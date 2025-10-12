/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { scrapWithPuppeteer } from '@/services/puppeteerScraper';
// import { scrapWithPlaywright } from '@/services/playwrightScraper';
import { runPerformanceAnalysis } from '@/services/performanceAnalyzer';
import { runArkheAnalysis } from '@/services/arkhe';
import { runPrometheusAnalysis } from '@/services/prometheus';
import { runLirAnalysis } from '@/services/lir';
import { runGenerativePerformanceAnalysis } from '@/services/generativePerformance';
// import { generateEnhancedAnalysisReport } from '@/utils/gemini';

import { AnalysisJob } from '@/types/geo';
import logger from '@/utils/logger';
import { AppError, ErrorType } from '@/utils/errors';

import dbConnect from '@/lib/dbConnect';
import { AnalysisJobModel } from '@/models/AnalysisJob';
import { JobEventModel } from '@/models/JobEvent'; // optional; see model below

// If you still store/query extra metadata in Postgres, keep these:
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
    { upsert: true } // in case the job doc wasn't created yet
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
 * Tüm analiz sürecini yönetir: Scrape → PSI → Arkhe → Prometheus → Lir → Generative Performance → Enhanced Report.
 * Firestore yerine MongoDB/Mongoose kullanır.
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

    // 1) SCRAPE
    job = await updateJob(job, { status: 'PROCESSING_SCRAPE' });
    try { await appendJobEvent(id, { step: 'SCRAPE', status: 'STARTED' }); } catch {}
    const { content: scrapedContent, html: scrapedHtml } = await scrapWithPuppeteer(url);
    // const { content: scrapedContent, html: scrapedHtml } = await scrapWithPlaywright(url);
    job = await updateJob(job, { scrapedContent, scrapedHtml });
    try { await appendJobEvent(id, { step: 'SCRAPE', status: 'COMPLETED' }); } catch {}

    // 2. Performans Analizi
    job = await updateJob(job, { status: 'PROCESSING_PSI' });
    try { await appendJobEvent(id, { step: 'PSI', status: 'STARTED' }); } catch {}
    try {
      const performanceResult = await runPerformanceAnalysis(url);
      job = await updateJob(job, { performanceReport: performanceResult } as any);
      try { await appendJobEvent(id, { step: 'PSI', status: 'COMPLETED' }); } catch {}
    } catch (e: any) {
      // Don’t crash the orchestration; record the failure and proceed
      job = await updateJob(job, { performanceReport: { error: e?.message || 'PSI failed' } as any });
      try { await appendJobEvent(id, { step: 'PSI', status: 'FAILED', meta: { message: e?.message } } as any); } catch {}
      // Option A (recommended): continue
      // Option B: rethrow if PSI is critical for later stages
      // throw e;
    }
/* 
    // 3) Arkhe (critical)
    job = await updateJob(job, { status: 'PROCESSING_ARKHE' });
    const arkheAnalysisResult = await runArkheAnalysis(job);
    if ((arkheAnalysisResult as any)?.error) {
      throw new AppError(ErrorType.ANALYSIS_FAILED, `Arkhe analysis failed: ${(arkheAnalysisResult as any).error}`);
    }
    job = await updateJob(job, { arkheReport: arkheAnalysisResult as any });
*/
    // 3) Arkhe (soft-fail)
    job = await updateJob(job, { status: 'PROCESSING_ARKHE' });
    try {
      const arkheAnalysisResult = await runArkheAnalysis(job, locale);
      if ((arkheAnalysisResult as any)?.error) throw new Error((arkheAnalysisResult as any).error);
      job = await updateJob(job, { arkheReport: arkheAnalysisResult as any });
    } catch (e: any) {
      job = await updateJob(job, { arkheReport: { error: e?.message || 'Arkhe failed' } as any });
      // continue instead of throwing
    }

    // 4) Prometheus
    job = await updateJob(job, { status: 'PROCESSING_PROMETHEUS' });
    const prometheusReport = await runPrometheusAnalysis(job, locale);
    job = await updateJob(job, { prometheusReport });

    // 5) Lir (Delfi agenda)
    job = await updateJob(job, { status: 'PROCESSING_LIR' });
    const delfiAgenda = await runLirAnalysis(prometheusReport, locale);
    job = await updateJob(job, { delfiAgenda });

    // 6) Generative Performance
    job = await updateJob(job, { status: 'PROCESSING_GENERATIVE_PERFORMANCE' });
    const targetBrand = job.arkheReport?.businessModel?.brandName || new URL(job.url).hostname;
    const generativePerformanceReport = await runGenerativePerformanceAnalysis(job, targetBrand);
    job = await updateJob(job, { generativePerformanceReport });
    try { await appendJobEvent(id, { step: 'GEN_PERF', status: 'COMPLETED' }); } catch {}

    // 7) Complete
    const finalGeoScore = (prometheusReport as any)?.overallGeoScore;
    job = await updateJob(job, { status: 'COMPLETED', finalGeoScore });

    // Optional Postgres side-effects
    if (job.queryId) {
      await saveReport(job.queryId, job);
      await updateQueryStatus(job.queryId, 'COMPLETED');
    }

    logger.info(`[Orchestrator] Analiz süreci başarıyla tamamlandı: ${id}`, 'orchestrateAnalysis');

  } catch (error) {
    logger.error(`[Orchestrator] Analiz sürecinde hata oluştu: ${id}`, 'orchestrateAnalysis', { error });
    try {
      await updateJob(job, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.',
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
      `Analiz orkestrasyonu başarısız oldu: ${id}`,
      { originalError: error }
    );
  } finally {
    clearInterval(heartbeat);
  }
}
