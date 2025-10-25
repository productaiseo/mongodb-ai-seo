/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
// import { puppeteerScraper } from '@/services/puppeteerScraper';
import { playwrightScraper } from '@/services/playwrightScraper';
import { runPerformanceAnalysis } from '@/services/performanceAnalyzer';
import { runArkheAnalysis } from '@/services/arkhe';
import { runPrometheusAnalysis } from '@/services/prometheus';
import { runLirAnalysis } from '@/services/lir';
import { runGenerativePerformanceAnalysis } from '@/services/generativePerformance';

import { AnalysisJob } from '@/types/geo';
import logger from '@/utils/logger';
import { AppError, ErrorType } from '@/utils/errors';

import dbConnect from '@/lib/dbConnect';
import { AnalysisJobModel } from '@/models/AnalysisJob';
import { JobEventModel } from '@/models/JobEvent';

import { updateQueryStatus, saveReport } from '@/lib/database';

/** Utility: remove undefined recursively so we don't write undefineds into Mongo */
function cleanUndefined<T>(v: T): T {
  if (Array.isArray(v)) return v.map(cleanUndefined).filter(x => x !== undefined) as any;
  if (v && typeof v === 'object') {
    const out: any = {};
    for (const [k, val] of Object.entries(v as any)) {
      const sv = cleanUndefined(val as any);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }
  return v;
}

/** Persist job updates in Mongo, return the merged in-memory job */
async function updateJob(job: AnalysisJob, updates: Partial<AnalysisJob>): Promise<AnalysisJob> {
  await dbConnect();
  const updatesWithTimestamp = { ...updates, updatedAt: new Date().toISOString() };
  const payload = cleanUndefined(updatesWithTimestamp);

  await AnalysisJobModel.updateOne(
    { id: job.id },
    { $set: payload },
    { upsert: true }
  ).exec();

  if (updates.status) {
    logger.info(`[Orchestrator] Job ${job.id} status updated to: ${updates.status}`, 'updateJob');
  }

  return { ...job, ...updatesWithTimestamp };
}

/** Optional: append a small event document for progress tracking (Mongo version) */
async function appendJobEvent(jobId: string, event: { step: string; status: 'STARTED' | 'COMPLETED' | 'FAILED'; meta?: any }) {
  try {
    await dbConnect();
    await JobEventModel.create({
      jobId,
      step: event.step,
      status: event.status,
      meta: event.meta ?? null,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    logger.warn?.('appendJobEvent failed (non-fatal)', 'orchestrateAnalysis', { jobId, error: (e as Error)?.message });
  }
}

/**
 * RESILIENT orchestration: Continue even if steps fail
 * Strategy: Store error reports for failed steps, complete what we can
 */
export async function orchestrateAnalysis(job: AnalysisJob): Promise<void> {
  const { id, url, locale } = job;

  console.log("orchestrateAnalysis locale", locale);

  if (!id || !url) {
    throw new AppError(ErrorType.VALIDATION, 'Job must have id and url');
  }

  logger.info(`[Orchestrator] Environment:`, 'orchestrateAnalysis', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  });

  logger.info(`[Orchestrator] Analysis initiated: ${id} - ${url}`, 'orchestrateAnalysis');

  const heartbeat = setInterval(() => {
    logger.info(`[Orchestrator] Heartbeat for job ${id}`, 'orchestrateAnalysis');
  }, 10000);

  // Track which steps completed successfully
  let hasScrapedData = false;
  let hasArkheData = false;
  let hasPrometheusData = false;

  try {
    await dbConnect();
    logger.info(`[Orchestrator] DB connected`, 'orchestrateAnalysis');

    const existing = await AnalysisJobModel.findOne({ id }).lean();
    logger.info(`[Orchestrator] Existing job status:`, 'orchestrateAnalysis', { status: existing?.status });

    if (existing?.status === 'COMPLETED' || existing?.status === 'FAILED') {
      logger.info(`[Orchestrator] Job ${id} already ${existing.status}; skipping.`, 'orchestrateAnalysis');
      return;
    }

    try { await appendJobEvent(id, { step: 'INIT', status: 'COMPLETED' }); } catch {}


    // PHASE 1: SCRAPE (Critical - but continue if fails)
    job = await updateJob(job, { status: 'PROCESSING_SCRAPE' });
    try { await appendJobEvent(id, { step: 'SCRAPE', status: 'STARTED' }); } catch {}
    
    let scrapedContent = '';
    let scrapedHtml = '';
    let scrapedData: any = null;

    try {
      logger.info(`[Orchestrator] Starting Playwright scrape for ${url}`, 'orchestrateAnalysis');
      scrapedData = await playwrightScraper(url);
      scrapedContent = scrapedData.content || '';
      scrapedHtml = scrapedData.html || '';
      
      logger.info(`[Orchestrator] Scrape completed. Content length: ${scrapedContent.length}`, 'orchestrateAnalysis');
      job = await updateJob(job, { scrapedContent, scrapedHtml });
      try { await appendJobEvent(id, { step: 'SCRAPE', status: 'COMPLETED' }); } catch {}
      hasScrapedData = true;
    } catch (e: any) {
      logger.error(`[Orchestrator] Scraping failed, continuing with empty data`, 'orchestrateAnalysis', { error: e.message });
      job = await updateJob(job, { 
        scrapedContent: '',
        scrapedHtml: '',
        scrapeError: e?.message || 'Scraping failed'
      } as any);
      try { await appendJobEvent(id, { step: 'SCRAPE', status: 'FAILED', meta: { message: e?.message } }); } catch {}
      // Continue anyway - some analyses might work with URL alone
    }


    // PHASE 2: PARALLEL - Arkhe + Performance
    logger.info(`[Orchestrator] Starting parallel: Arkhe + Performance`, 'orchestrateAnalysis');
    
    const [arkheResult, performanceResult] = await Promise.allSettled([
      // ARKHE
      (async () => {
        job = await updateJob(job, { status: 'PROCESSING_ARKHE' });
        try { await appendJobEvent(id, { step: 'ARKHE', status: 'STARTED' }); } catch {}
        
        try {
          if (!hasScrapedData) {
            throw new Error('No scraped data available');
          }
          
          logger.info(`[Orchestrator] Starting Arkhe analysis`, 'orchestrateAnalysis');
          const arkheAnalysisResult = await runArkheAnalysis(job, scrapedData, locale);
          
          if ((arkheAnalysisResult as any)?.error) throw new Error((arkheAnalysisResult as any).error);
          job = await updateJob(job, { arkheReport: arkheAnalysisResult as any });
          try { await appendJobEvent(id, { step: 'ARKHE', status: 'COMPLETED' }); } catch {}
          logger.info(`[Orchestrator] Arkhe completed`, 'orchestrateAnalysis');
          return arkheAnalysisResult;
        } catch (e: any) {
          logger.warn(`[Orchestrator] Arkhe failed: ${e.message}`, 'orchestrateAnalysis');
          const errorReport = { error: e?.message || 'Arkhe failed', failed: true };
          job = await updateJob(job, { arkheReport: errorReport as any });
          try { await appendJobEvent(id, { step: 'ARKHE', status: 'FAILED', meta: { message: e?.message } }); } catch {}
          throw e;
        }
      })(),
      
      // PERFORMANCE
      (async () => {
        job = await updateJob(job, { status: 'PROCESSING_PSI' });
        try { await appendJobEvent(id, { step: 'PSI', status: 'STARTED' }); } catch {}
        
        try {
          logger.info(`[Orchestrator] Starting Performance analysis`, 'orchestrateAnalysis');
          const performanceResult = await runPerformanceAnalysis(url);
          job = await updateJob(job, { performanceReport: performanceResult } as any);
          try { await appendJobEvent(id, { step: 'PSI', status: 'COMPLETED' }); } catch {}
          logger.info(`[Orchestrator] Performance completed`, 'orchestrateAnalysis');
          return performanceResult;
        } catch (e: any) {
          logger.warn(`[Orchestrator] PSI failed: ${e.message}`, 'orchestrateAnalysis');
          const errorReport = { error: e?.message || 'PSI failed', failed: true };
          job = await updateJob(job, { performanceReport: errorReport as any });
          try { await appendJobEvent(id, { step: 'PSI', status: 'FAILED', meta: { message: e?.message } }); } catch {}
          throw e;
        }
      })()
    ]);

    hasArkheData = arkheResult.status === 'fulfilled';
    logger.info(`[Orchestrator] Phase 2 done - Arkhe: ${arkheResult.status}, Performance: ${performanceResult.status}`, 'orchestrateAnalysis');


    // PHASE 3: PARALLEL - Prometheus + Generative Performance
    // (Only if Arkhe succeeded)
    if (hasArkheData) {
      logger.info(`[Orchestrator] Starting parallel: Prometheus + GenPerf`, 'orchestrateAnalysis');
      
      const [prometheusResult, genPerfResult] = await Promise.allSettled([
        // PROMETHEUS
        (async () => {
          job = await updateJob(job, { status: 'PROCESSING_PROMETHEUS' });
          try { await appendJobEvent(id, { step: 'PROMETHEUS', status: 'STARTED' }); } catch {}
          
          try {
            logger.info(`[Orchestrator] Starting Prometheus analysis`, 'orchestrateAnalysis');
            const promReport = await runPrometheusAnalysis(job, locale);
            job = await updateJob(job, { prometheusReport: promReport });
            try { await appendJobEvent(id, { step: 'PROMETHEUS', status: 'COMPLETED' }); } catch {}
            logger.info(`[Orchestrator] Prometheus completed`, 'orchestrateAnalysis');
            return promReport;
          } catch (e: any) {
            logger.warn(`[Orchestrator] Prometheus failed: ${e.message}`, 'orchestrateAnalysis');
            const errorReport = { error: e?.message || 'Prometheus failed', failed: true };
            job = await updateJob(job, { prometheusReport: errorReport as any });
            try { await appendJobEvent(id, { step: 'PROMETHEUS', status: 'FAILED', meta: { message: e?.message } }); } catch {}
            throw e;
          }
        })(),
        
        // GENERATIVE PERFORMANCE
        (async () => {
          job = await updateJob(job, { status: 'PROCESSING_GENERATIVE_PERFORMANCE' });
          try { await appendJobEvent(id, { step: 'GEN_PERF', status: 'STARTED' }); } catch {}
          
          try {
            logger.info(`[Orchestrator] Starting GenPerf analysis`, 'orchestrateAnalysis');
            const targetBrand = job.arkheReport?.businessModel?.brandName || new URL(job.url).hostname;
            const genPerfReport = await runGenerativePerformanceAnalysis(job, targetBrand);
            job = await updateJob(job, { generativePerformanceReport: genPerfReport });
            try { await appendJobEvent(id, { step: 'GEN_PERF', status: 'COMPLETED' }); } catch {}
            logger.info(`[Orchestrator] GenPerf completed`, 'orchestrateAnalysis');
            return genPerfReport;
          } catch (e: any) {
            logger.warn(`[Orchestrator] GenPerf failed: ${e.message}`, 'orchestrateAnalysis');
            const errorReport = { error: e?.message || 'GenPerf failed', failed: true };
            job = await updateJob(job, { generativePerformanceReport: errorReport as any });
            try { await appendJobEvent(id, { step: 'GEN_PERF', status: 'FAILED', meta: { message: e?.message } }); } catch {}
            throw e;
          }
        })()
      ]);

      hasPrometheusData = prometheusResult.status === 'fulfilled';
      logger.info(`[Orchestrator] Phase 3 done - Prometheus: ${prometheusResult.status}, GenPerf: ${genPerfResult.status}`, 'orchestrateAnalysis');


      // PHASE 4: LIR (Only if Prometheus succeeded)
      if (hasPrometheusData) {
        job = await updateJob(job, { status: 'PROCESSING_LIR' });
        try { await appendJobEvent(id, { step: 'LIR', status: 'STARTED' }); } catch {}
        
        try {
          logger.info(`[Orchestrator] Starting Lir analysis`, 'orchestrateAnalysis');
          const prometheusReport = (prometheusResult as PromiseFulfilledResult<any>).value;
          const delfiAgenda = await runLirAnalysis(prometheusReport, locale);
          job = await updateJob(job, { delfiAgenda });
          try { await appendJobEvent(id, { step: 'LIR', status: 'COMPLETED' }); } catch {}
          logger.info(`[Orchestrator] Lir completed`, 'orchestrateAnalysis');
        } catch (e: any) {
          logger.warn(`[Orchestrator] Lir failed: ${e.message}`, 'orchestrateAnalysis');
          const errorReport = { error: e?.message || 'Lir failed', failed: true };
          job = await updateJob(job, { delfiAgenda: errorReport as any });
          try { await appendJobEvent(id, { step: 'LIR', status: 'FAILED', meta: { message: e?.message } }); } catch {}
        }

        // Get final GEO score
        const prometheusReport = (prometheusResult as PromiseFulfilledResult<any>).value;
        const finalGeoScore = (prometheusReport as any)?.overallGeoScore || null;
        job = await updateJob(job, { finalGeoScore });
      } else {
        logger.warn(`[Orchestrator] Skipping Lir (Prometheus failed)`, 'orchestrateAnalysis');
      }
    } else {
      logger.warn(`[Orchestrator] Skipping Prometheus, GenPerf, Lir (Arkhe failed)`, 'orchestrateAnalysis');
    }


    // COMPLETION: Mark as completed even if some steps failed
    job = await updateJob(job, { status: 'COMPLETED' });

    if (job.queryId) {
      await saveReport(job.queryId, job);
      await updateQueryStatus(job.queryId, 'COMPLETED');
    }

    logger.info(`[Orchestrator] Analysis completed: ${id}`, 'orchestrateAnalysis');
    logger.info(`[Orchestrator] Summary - Scraped: ${hasScrapedData}, Arkhe: ${hasArkheData}, Prometheus: ${hasPrometheusData}`, 'orchestrateAnalysis');

  } catch (error) {
    // Only fail if something catastrophic happened (DB error, etc.)
    logger.error(`[Orchestrator] Critical error: ${id}`, 'orchestrateAnalysis', { error });
    try {
      await updateJob(job, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error occurred.',
      });
      if (job.queryId) {
        await updateQueryStatus(job.queryId, 'FAILED');
      }
    } catch (writeErr) {
      logger.error('Failed to persist FAILED status', 'orchestrateAnalysis', { error: (writeErr as Error)?.message });
    }

    throw new AppError(
      ErrorType.ANALYSIS_FAILED,
      `Analysis orchestration failed: ${id}`,
      { originalError: error }
    );
  } finally {
    clearInterval(heartbeat);
  }
}
