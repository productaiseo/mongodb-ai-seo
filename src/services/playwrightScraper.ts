/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';

import logger from '@/utils/logger';
import { AppError, ErrorType } from '@/utils/errors';
import { PlaywrightScrapeResult } from '@/utils/types/analysis';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

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

  if (g.__PW_BROWSER__.browser) return g.__PW_BROWSER__.browser!;

  if (isProduction) {
    // ---- Production (Vercel) → playwright-core + @sparticuz/chromium ----
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
    // ---- Development → full playwright (has browsers installed locally) ----
    const { chromium } = await import('playwright'); // dev dependency
    pwChromium = chromium;

    const browser = await pwChromium.launch({
      headless: true,
    });

    g.__PW_BROWSER__.browser = browser;
    return browser;
  }
}

export async function playwrightScraper(url: string): Promise<PlaywrightScrapeResult> {
  const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let browser: Browser | null = null;
    let context: import('playwright-core').BrowserContext | null = null;
    let page: import('playwright-core').Page | null = null;

    try {
      logger.info(`[playwright-scraper] Attempt ${attempt}/${MAX_RETRIES} - ${normalizedUrl}`);

      browser = await getBrowser();

      // Create a fresh context each attempt (userAgent/headers/viewport here)
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

      // Navigation strategy: DOM ready + bounded network idle
      const response = await page.goto(normalizedUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      // Bounded idle (avoid permanent hangs on long-polling sites)
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

      if (!response || !response.ok()) {
        throw new AppError(
          ErrorType.SCRAPING_ERROR,
          `HTTP error! Status: ${response?.status()} for ${normalizedUrl}`,
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

      // robots.txt + llms.txt (HTTP from inside the page to honor cookies/proxy if any)
      const [robotsTxt, llmsTxt] = await Promise.all([
        (async () => {
          try {
            return await page.evaluate(async (baseUrl: string) => {
              try {
                const res = await fetch(new URL('/robots.txt', baseUrl).toString());
                return res.ok ? await res.text() : undefined;
              } catch {
                return undefined;
              }
            }, normalizedUrl);
          } catch {
            logger.warn(`[playwright-scraper] robots.txt not reachable`);
            return undefined;
          }
        })(),
        (async () => {
          try {
            return await page.evaluate(async (baseUrl: string) => {
              try {
                const res = await fetch(new URL('/llms.txt', baseUrl).toString());
                return res.ok ? await res.text() : undefined;
              } catch {
                return undefined;
              }
            }, normalizedUrl);
          } catch {
            logger.warn(`[playwright-scraper] llms.txt not reachable`);
            return undefined;
          }
        })(),
      ]);

      // Shallow-clone window.performance (structured-clone safe)
      const performanceMetrics = await page.evaluate(
        () => JSON.parse(JSON.stringify(window.performance))
      );

      logger.info(`[playwright-scraper] Success - ${normalizedUrl}`);

      return { html, content, robotsTxt, llmsTxt, performanceMetrics };
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
          `Alan adı çözümlenemedi: ${normalizedUrl}`,
          {
            contextData: { url: normalizedUrl, error: error.message },
            userFriendlyMessage: 'The specified domain name could not be found. Please check the URL and try again.',
          }
        );
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    } finally {
      // Always close page + context; keep the browser cached for warm invocations
      try {
        await page?.close().catch(() => {});
        await context?.close().catch(() => {});
      } catch (closeErr) {
        logger.error(`[playwright-scraper] Error closing page/context`, 'playwright-scraper', { error: closeErr });
      }
    }
  }

  throw new AppError(
    ErrorType.SCRAPING_ERROR,
    `Playwright ile sayfa taranırken ${MAX_RETRIES} denemenin ardından bir hata oluştu: ${normalizedUrl}`,
    {
      contextData: { url: normalizedUrl, error: lastError?.message },
      userFriendlyMessage: 'An issue occurred while scraping the website. Please check the URL and try again.',
    }
  );
}
