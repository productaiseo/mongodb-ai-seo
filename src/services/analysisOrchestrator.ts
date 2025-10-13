/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { scrapWithPuppeteer } from '@/services/puppeteerScraper';
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
    // Non-fatal; just log
    logger.warn?.('appendJobEvent failed (non-fatal)', 'orchestrateAnalysis', { jobId, error: (e as Error)?.message });
  }
}

/**
 * Optimized orchestration: Scrape once, reuse data for all analysis steps
 */
export async function orchestrateAnalysis(job: AnalysisJob): Promise<void> {
  const { id, url, locale } = job;

  console.log("orchestrateAnalysis locale", locale);

  if (!id || !url) {
    throw new AppError(ErrorType.VALIDATION, 'Job must have id and url');
  }

  // Log environment info
  logger.info(`[Orchestrator] Environment:`, 'orchestrateAnalysis', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  });

  logger.info(`[Orchestrator] The analysis process has been initiated: ${id} - ${url}`, 'orchestrateAnalysis');

  // Add heartbeat logging to detect where it hangs
  const heartbeat = setInterval(() => {
    logger.info(`[Orchestrator] Heartbeat for job ${id} - still running...`, 'orchestrateAnalysis');
  }, 5000);

  try {
    // Make sure DB connection is up
    await dbConnect();
    logger.info(`[Orchestrator] DB connected`, 'orchestrateAnalysis');

    const existing = await AnalysisJobModel.findOne({ id }).lean();
    logger.info(`[Orchestrator] Existing job status:`, 'orchestrateAnalysis', { status: existing?.status });

    if (existing?.status === 'COMPLETED' || existing?.status === 'FAILED') {
      logger.info(`[Orchestrator] Job ${id} is already ${existing.status}; skipping.`, 'orchestrateAnalysis');
      return;
    }

    // Early mark so UI doesn't appear stuck
    job = await updateJob(job, { status: 'PROCESSING' });
    try { await appendJobEvent(id, { step: 'INIT', status: 'COMPLETED' }); } catch {}

    // ========================================
    // 1) SCRAPE - Do this ONCE and reuse
    // ========================================
    job = await updateJob(job, { status: 'PROCESSING_SCRAPE' });
    try { await appendJobEvent(id, { step: 'SCRAPE', status: 'STARTED' }); } catch {}
    
    logger.info(`[Orchestrator] Starting Puppeteer scrape for ${url}`, 'orchestrateAnalysis');
    const scrapedData = await scrapWithPuppeteer(url);
    const { content: scrapedContent, html: scrapedHtml, robotsTxt, llmsTxt } = scrapedData;
    
    logger.info(`[Orchestrator] Scrape completed. Content length: ${scrapedContent.length}`, 'orchestrateAnalysis');
    job = await updateJob(job, { scrapedContent, scrapedHtml });
    try { await appendJobEvent(id, { step: 'SCRAPE', status: 'COMPLETED' }); } catch {}

    // ========================================
    // 2) ARKHE - Use scraped data (no re-scrape)
    // ========================================
    job = await updateJob(job, { status: 'PROCESSING_ARKHE' });
    try { await appendJobEvent(id, { step: 'ARKHE', status: 'STARTED' }); } catch {}
    
    try {
      logger.info(`[Orchestrator] Starting Arkhe analysis (using cached scrape data)`, 'orchestrateAnalysis');
      const arkheAnalysisResult = await runArkheAnalysis(job, scrapedData, locale);
      
      if ((arkheAnalysisResult as any)?.error) throw new Error((arkheAnalysisResult as any).error);
      job = await updateJob(job, { arkheReport: arkheAnalysisResult as any });
      try { await appendJobEvent(id, { step: 'ARKHE', status: 'COMPLETED' }); } catch {}
      logger.info(`[Orchestrator] Arkhe analysis completed`, 'orchestrateAnalysis');
    } catch (e: any) {
      logger.warn(`[Orchestrator] Arkhe analysis failed, continuing...`, 'orchestrateAnalysis', { error: e.message });
      job = await updateJob(job, { arkheReport: { error: e?.message || 'Arkhe failed' } as any });
      try { await appendJobEvent(id, { step: 'ARKHE', status: 'FAILED', meta: { message: e?.message } } as any); } catch {}
    }

    // ========================================
    // 3) PERFORMANCE ANALYSIS (PSI)
    // ========================================
    job = await updateJob(job, { status: 'PROCESSING_PSI' });
    try { await appendJobEvent(id, { step: 'PSI', status: 'STARTED' }); } catch {}
    
    try {
      logger.info(`[Orchestrator] Starting Performance analysis`, 'orchestrateAnalysis');
      const performanceResult = await runPerformanceAnalysis(url);
      job = await updateJob(job, { performanceReport: performanceResult } as any);
      try { await appendJobEvent(id, { step: 'PSI', status: 'COMPLETED' }); } catch {}
      logger.info(`[Orchestrator] Performance analysis completed`, 'orchestrateAnalysis');
    } catch (e: any) {
      logger.warn(`[Orchestrator] PSI failed, continuing...`, 'orchestrateAnalysis', { error: e.message });
      job = await updateJob(job, { performanceReport: { error: e?.message || 'PSI failed' } as any });
      try { await appendJobEvent(id, { step: 'PSI', status: 'FAILED', meta: { message: e?.message } } as any); } catch {}
    }

    // ========================================
    // 4) PROMETHEUS
    // ========================================
    job = await updateJob(job, { status: 'PROCESSING_PROMETHEUS' });
    try { await appendJobEvent(id, { step: 'PROMETHEUS', status: 'STARTED' }); } catch {}
    
    logger.info(`[Orchestrator] Starting Prometheus analysis`, 'orchestrateAnalysis');
    const prometheusReport = await runPrometheusAnalysis(job, locale);
    job = await updateJob(job, { prometheusReport });
    try { await appendJobEvent(id, { step: 'PROMETHEUS', status: 'COMPLETED' }); } catch {}
    logger.info(`[Orchestrator] Prometheus analysis completed`, 'orchestrateAnalysis');

    // ========================================
    // 5) LIR (Delfi agenda)
    // ========================================
    job = await updateJob(job, { status: 'PROCESSING_LIR' });
    try { await appendJobEvent(id, { step: 'LIR', status: 'STARTED' }); } catch {}
    
    logger.info(`[Orchestrator] Starting Lir analysis`, 'orchestrateAnalysis');
    const delfiAgenda = await runLirAnalysis(prometheusReport, locale);
    job = await updateJob(job, { delfiAgenda });
    try { await appendJobEvent(id, { step: 'LIR', status: 'COMPLETED' }); } catch {}
    logger.info(`[Orchestrator] Lir analysis completed`, 'orchestrateAnalysis');

    // ========================================
    // 6) GENERATIVE PERFORMANCE
    // ========================================
    job = await updateJob(job, { status: 'PROCESSING_GENERATIVE_PERFORMANCE' });
    try { await appendJobEvent(id, { step: 'GEN_PERF', status: 'STARTED' }); } catch {}
    
    logger.info(`[Orchestrator] Starting Generative Performance analysis`, 'orchestrateAnalysis');
    const targetBrand = job.arkheReport?.businessModel?.brandName || new URL(job.url).hostname;
    const generativePerformanceReport = await runGenerativePerformanceAnalysis(job, targetBrand);
    job = await updateJob(job, { generativePerformanceReport });
    try { await appendJobEvent(id, { step: 'GEN_PERF', status: 'COMPLETED' }); } catch {}
    logger.info(`[Orchestrator] Generative Performance analysis completed`, 'orchestrateAnalysis');

    // 7) Complete
    const finalGeoScore = (prometheusReport as any)?.overallGeoScore;
    job = await updateJob(job, { status: 'COMPLETED', finalGeoScore });

    // Optional Postgres side-effects
    if (job.queryId) {
      await saveReport(job.queryId, job);
      await updateQueryStatus(job.queryId, 'COMPLETED');
    }

    logger.info(`[Orchestrator] Analysis process completed successfully: ${id}`, 'orchestrateAnalysis');

  } catch (error) {
    logger.error(`[Orchestrator] Analysis process error: ${id}`, 'orchestrateAnalysis', { error });
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

    if (error instanceof AppError) throw error;

    throw new AppError(
      ErrorType.ANALYSIS_FAILED,
      `Analysis orchestration failed: ${id}`,
      { originalError: error }
    );
  } finally {
    clearInterval(heartbeat);
  }
}
