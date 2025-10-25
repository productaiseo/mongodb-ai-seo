/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';

import logger from '@/utils/logger';
import { AppError, ErrorType } from '@/utils/errors';
import { PlaywrightScrapeResult } from '@/utils/types/analysis';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const OVERALL_TIMEOUT_MS = 45000; // 45 seconds max per attempt

type Browser = import('playwright-core').Browser;

let chromiumPkg: any;        // @sparticuz/chromium (prod)
let pwChromium: any;         // chromium launcher from playwright-core/playwright

/** Cache a single Browser per warm lambda to reduce cold starts */
const g = globalThis as any;
g.__PW_BROWSER__ ??= { browser: null as Browser | null };

async function getBrowser(): Promise<Browser> {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

  logger.info(
    `[playwright-scraper] Environment check`,
    'playwright environment',
    {
      isProduction,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
    }
  );

  if (g.__PW_BROWSER__.browser) {
    try {
      // Test if browser is still alive
      const contexts = g.__PW_BROWSER__.browser.contexts();
      logger.info(`[playwright-scraper] Reusing cached browser (${contexts.length} contexts)`, 'playwright-scraper');
      return g.__PW_BROWSER__.browser!;
    } catch (e) {
      logger.warn(`[playwright-scraper] Cached browser is dead, creating new one`, 'playwright-scraper');
      g.__PW_BROWSER__.browser = null;
    }
  }

  if (isProduction) {
    const [{ chromium: chromiumLauncher }, chromiumModule] = await Promise.all([
      import('playwright-core').then(m => ({ chromium: m.chromium })),
      import('@sparticuz/chromium')
    ]);

    pwChromium = chromiumLauncher;
    chromiumPkg = chromiumModule.default || chromiumModule;

    // Use Sparticuz’ packaged, brotli-compressed Chrome; no network fetch
    const executablePath = await chromiumPkg.executablePath();

    logger.info(`[playwright-scraper] Using executablePath: ${executablePath}`, 'playwright-scraper');

    const browser = await pwChromium.launch({
      headless: true,
      executablePath,
      args: chromiumPkg.args,            // good defaults for serverless
      chromiumSandbox: false,            // lambda-safe
    });

    g.__PW_BROWSER__.browser = browser;
    return browser;
  } else {
    const { chromium } = await import('playwright');
    pwChromium = chromium;

    const browser = await pwChromium.launch({
      headless: true,
    });

    g.__PW_BROWSER__.browser = browser;
    return browser;
  }
}

/**
 * Scrape with overall timeout protection
 */
async function scrapeWithTimeout(url: string, timeoutMs: number): Promise<PlaywrightScrapeResult> {
  return new Promise(async (resolve, reject) => {
    let browser: Browser | null = null;
    let context: import('playwright-core').BrowserContext | null = null;
    let page: import('playwright-core').Page | null = null;
    let timeoutHandle: NodeJS.Timeout | null = null;
    let isTimedOut = false;

    // Overall timeout
    timeoutHandle = setTimeout(() => {
      isTimedOut = true;
      const error = new Error(`Scraping timed out after ${timeoutMs}ms`);
      logger.error(`[playwright-scraper] Timeout reached for ${url}`, 'playwright-scraper');
      
      // Force cleanup
      Promise.all([
        page?.close().catch(() => {}),
        context?.close().catch(() => {}),
      ]).finally(() => {
        reject(error);
      });
    }, timeoutMs);

    try {
      browser = await getBrowser();

      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
        ignoreHTTPSErrors: true,
      });

      page = await context.newPage();

      // Shorter individual timeouts since we have overall timeout
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000, // Reduced from 60s
      });

      if (isTimedOut) return; // Already cleaned up

      // Shorter network idle
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
        logger.warn(`[playwright-scraper] Network idle timeout (non-fatal)`, 'playwright-scraper');
      });

      if (isTimedOut) return;

      if (!response || !response.ok()) {
        throw new AppError(
          ErrorType.SCRAPING_ERROR,
          `HTTP error! Status: ${response?.status()} for ${url}`,
          {
            userFriendlyMessage: `Could not reach the website (Error Code: ${response?.status()}). Please check the URL.`,
          }
        );
      }

      const html = await page.content();
      const content = await page.evaluate(() => document.body?.innerText || '');

      if (!content || content.trim().length < 100) {
        throw new Error('Insufficient content scraped. The page may not have loaded properly.');
      }

      // robots.txt + llms.txt (with shorter timeout)
      const [robotsTxt, llmsTxt] = await Promise.allSettled([
        page.evaluate(async (baseUrl: string) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(new URL('/robots.txt', baseUrl).toString(), { 
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            return res.ok ? await res.text() : undefined;
          } catch {
            return undefined;
          }
        }, url),
        page.evaluate(async (baseUrl: string) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(new URL('/llms.txt', baseUrl).toString(), { 
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            return res.ok ? await res.text() : undefined;
          } catch {
            return undefined;
          }
        }, url),
      ]).then(results => [
        results[0].status === 'fulfilled' ? results[0].value : undefined,
        results[1].status === 'fulfilled' ? results[1].value : undefined,
      ]);

      if (isTimedOut) return;

      // Performance metrics
      let performanceMetrics;
      try {
        performanceMetrics = await page.evaluate(
          () => JSON.parse(JSON.stringify(window.performance))
        );
      } catch (e) {
        logger.warn(`[playwright-scraper] Could not get performance metrics`, 'playwright-scraper');
        performanceMetrics = {};
      }

      logger.info(`[playwright-scraper] Success - ${url}`, 'playwright-scraper');

      // Clear timeout and resolve
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      resolve({ html, content, robotsTxt, llmsTxt, performanceMetrics });

    } catch (error: any) {
      if (isTimedOut) return; // Already handled by timeout
      
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      reject(error);
    } finally {
      // Cleanup
      try {
        await page?.close().catch(() => {});
        await context?.close().catch(() => {});
      } catch (closeErr) {
        logger.error(`[playwright-scraper] Error closing page/context`, 'playwright-scraper', { error: closeErr });
      }
    }
  });
}

export async function playwrightScraper(url: string): Promise<PlaywrightScrapeResult> {
  const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`[playwright-scraper] Attempt ${attempt}/${MAX_RETRIES} - ${normalizedUrl}`, 'playwright-scraper');

      const result = await scrapeWithTimeout(normalizedUrl, OVERALL_TIMEOUT_MS);
      return result;

    } catch (error: any) {
      lastError = error;
      logger.warn(
        `[playwright-scraper] Attempt ${attempt}/${MAX_RETRIES} failed - ${normalizedUrl}`,
        'playwright-scraper',
        { error: error?.message }
      );

      if (error?.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new AppError(
          ErrorType.DNS_RESOLUTION_ERROR,
          `Domain could not be resolved: ${normalizedUrl}`,
          {
            contextData: { url: normalizedUrl, error: error.message },
            userFriendlyMessage: 'The specified domain name could not be found. Please check the URL and try again.',
          }
        );
      }

      // Don't retry on timeout - it's likely a bad site
      if (error?.message?.includes('timed out')) {
        logger.error(`[playwright-scraper] Timeout after ${OVERALL_TIMEOUT_MS}ms, not retrying`, 'playwright-scraper');
        break;
      }

      if (attempt < MAX_RETRIES) {
        logger.info(`[playwright-scraper] Waiting ${RETRY_DELAY_MS}ms before retry`, 'playwright-scraper');
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  throw new AppError(
    ErrorType.SCRAPING_ERROR,
    `Failed to scrape page after ${MAX_RETRIES} attempts: ${normalizedUrl}`,
    {
      contextData: { url: normalizedUrl, error: lastError?.message },
      userFriendlyMessage: 'An issue occurred while scraping the website. Please check the URL and try again.',
    }
  );
}
