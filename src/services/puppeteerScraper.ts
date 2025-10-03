/* eslint-disable @typescript-eslint/no-explicit-any */

import { PlaywrightScrapeResult } from '@/utils/types/analysis';
import { AppError, ErrorType } from '@/utils/errors';
import logger from '@/utils/logger';
import 'server-only';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Reusable browser setup function (similar to your working example)
let puppeteer: any;
let chromium: any;

async function getBrowser() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    // Production environment (Vercel)
    try {
      console.log('[puppeteer-scraper] Setting up production browser...');
      
      // Import packages properly
      const [chromiumModule, puppeteerModule] = await Promise.all([
        import('@sparticuz/chromium'),
        import('puppeteer-core')
      ]);
      
      // Access the default exports correctly
      chromium = chromiumModule.default || chromiumModule;
      puppeteer = puppeteerModule.default || puppeteerModule;
      
      console.log('[puppeteer-scraper] Packages imported successfully');
      
      // Get executable path from chromium
      const executablePath = await chromium.executablePath();
      console.log('[puppeteer-scraper] Executable path:', executablePath);
      
      // Launch browser with proper configuration
      const browser = await puppeteer.launch({
        headless: 'new',
        executablePath,
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ]
      });
      
      console.log('[puppeteer-scraper] Browser launched successfully in production');
      return browser;
      
    } catch (prodError: any) {
      console.error('[puppeteer-scraper] Production browser setup failed:', prodError);
      console.error('[puppeteer-scraper] Error details:', {
        message: prodError.message,
        stack: prodError.stack,
        name: prodError.name
      });
      throw new Error(`Production browser setup failed: ${prodError.message || String(prodError)}`);
    }
  } else {
    // Development environment
    try {
      console.log('[puppeteer-scraper] Setting up development browser...');
      
      const puppeteerModule = await import('puppeteer');
      puppeteer = puppeteerModule.default || puppeteerModule;
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      console.log('[puppeteer-scraper] Browser launched successfully in development');
      return browser;
      
    } catch (devError: any) {
      console.error('[puppeteer-scraper] Development browser setup failed:', devError);
      throw new Error(`Development browser setup failed: ${devError.message || String(devError)}`);
    }
  }
}

export async function scrapWithPuppeteer(url: string): Promise<PlaywrightScrapeResult> {
  const normalizedUrl =
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let browser: any | null = null;

    try {
      logger.info(
        `[puppeteer-scraper] attempt ${attempt}/${MAX_RETRIES} - ${normalizedUrl}`,
      );

      console.log('[puppeteer-scraper] Environment check:', { 
        NODE_ENV: process.env.NODE_ENV, 
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV 
      });

      // Launch browser using the getBrowser function
      browser = await getBrowser();
      console.log('[puppeteer-scraper] Browser launched successfully');

      const page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set extra HTTP headers for locale
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });

      const response = await page.goto(normalizedUrl, {
        waitUntil: 'load',
        timeout: 60_000,
      });

      if (!response || !response.ok()) {
        throw new AppError(
          ErrorType.SCRAPING_ERROR,
          `HTTP error! Status: ${response?.status()} for ${normalizedUrl}`,
          {
            userFriendlyMessage: `Web sitesine ulaşılamadı (Hata Kodu: ${response?.status()}). Lütfen URL'yi kontrol edin.`,
          }
        );
      }

      const html = await page.content();
      const content = await page.evaluate(() => document.body.innerText || '');

      if (!content || content.trim().length < 100) {
        throw new Error('Yetersiz içerik kazındı. Sayfa düzgün yüklenmemiş olabilir.');
      }

      // Fetch robots.txt and llms.txt using page.evaluate with fetch
      const [robotsTxt, llmsTxt] = await Promise.all([
        (async () => {
          try {
            const result = await page.evaluate(async (baseUrl: string) => {
              try {
                const response = await fetch(new URL('/robots.txt', baseUrl).toString());
                return response.ok ? await response.text() : undefined;
              } catch {
                return undefined;
              }
            }, normalizedUrl);
            return result;
          } catch {
            logger.warn(`[puppeteer-scraper] robots.txt not reachable`);
            return undefined;
          }
        })(),
        (async () => {
          try {
            const result = await page.evaluate(async (baseUrl: string) => {
              try {
                const response = await fetch(new URL('/llms.txt', baseUrl).toString());
                return response.ok ? await response.text() : undefined;
              } catch {
                return undefined;
              }
            }, normalizedUrl);
            return result;
          } catch {
            logger.warn(`[puppeteer-scraper] llms.txt not reachable`);
            return undefined;
          }
        })(),
      ]);

      const performanceMetrics = await page.evaluate(
        () => JSON.parse(JSON.stringify(window.performance))
      );

      logger.info(`[puppeteer-scraper] success - ${normalizedUrl}`);

      console.log('[puppeteer-scraper] content length:', content);
      console.log('[puppeteer-scraper] html length:', html);
      
      return { html, content, robotsTxt, llmsTxt, performanceMetrics };
    } catch (error: any) {
      lastError = error;
      logger.warn(
        `[puppeteer-scraper] attempt ${attempt}/${MAX_RETRIES} failed - ${normalizedUrl}`,
        'puppeteer-scraper',
        { error: error?.message }
      );

      if (error?.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new AppError(
          ErrorType.DNS_RESOLUTION_ERROR,
          `Alan adı çözümlenemedi: ${normalizedUrl}`,
          {
            contextData: { url: normalizedUrl, error: error.message },
            userFriendlyMessage:
              "Belirtilen alan adı bulunamadı. Lütfen URL'yi kontrol edip tekrar deneyin.",
          }
        );
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    } finally {
      try {
        if (browser) {
          await browser.close();
          console.log('[puppeteer-scraper] Browser closed successfully');
        }
      } catch (closeError) {
        console.error('[puppeteer-scraper] Error closing browser:', closeError);
      }
    }
  }

  throw new AppError(
    ErrorType.SCRAPING_ERROR,
    `Puppeteer ile sayfa taranırken ${MAX_RETRIES} denemenin ardından bir hata oluştu: ${normalizedUrl}`,
    {
      contextData: { url: normalizedUrl, error: lastError?.message },
      userFriendlyMessage:
        'Web sitesi taranırken bir sorunla karşılaşıldı. Lütfen URL\'yi kontrol edip tekrar deneyin.',
    }
  );
}
