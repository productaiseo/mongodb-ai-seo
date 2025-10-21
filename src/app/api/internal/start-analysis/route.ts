/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { orchestrateAnalysis } from '@/services/analysisOrchestrator';
import logger from '@/utils/logger';

import dbConnect from '@/lib/dbConnect';
import { AnalysisJobModel } from '@/models/AnalysisJob';
import type { AnalysisJob } from '@/types/geo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 800; // 800 seconds

export async function POST(request: NextRequest) {
  try {
    // Extract parameters from request body
    const { jobId, userId, domain, url, locale } = await request.json();

    if (!jobId || !userId || !domain || !url) {
      return NextResponse.json({ error: 'jobId, userId, domain ve url zorunludur' }, { status: 400 });
    }

    // --- DB: connect & early status update ---
    await dbConnect();

    console.log("start analysis", locale);
    // Mark as PROCESSING early so UI doesn't look stuck on QUEUED
    try {
      await AnalysisJobModel.updateOne(
        { id: jobId },
        {
          $set: {
            status: 'PROCESSING_SCRAPE',
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: false }
      ).exec();
      // If the job might not exist yet (edge case), you could upsert:
      // }, { upsert: true })
    } catch (e) {
      // Non-fatal; orchestrator will try to update again
      logger.warn?.('update status to PROCESSING failed (non-fatal)', 'internal-start-analysis', { jobId, error: (e as Error)?.message });
    }


    // Prepare job object for orchestrator
    const job: AnalysisJob = {
      id: jobId,
      userId,
      url,
      locale: locale || 'en', // default to 'en' if not provided
      status: 'PROCESSING_SCRAPE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalGeoScore: null,
    } as AnalysisJob;
/* 
    // Fire and return early (do not await long-running orchestration)
    orchestrateAnalysis(job).catch((error: any) => {
      logger.error?.('orchestrateAnalysis failed (detached)', 'internal-start-analysis', { error });
    });
 */
    // ✅ Wait for the orchestration instead of detaching
    await orchestrateAnalysis(job);

    // return NextResponse.json({ ok: true, queued: true }, { status: 202 });
    return NextResponse.json({ ok: true, completed: true }, { status: 200 });
  } catch (error: any) {
    logger.error?.('start-analysis internal API failed', 'internal-start-analysis', { error });
    return NextResponse.json({ error: 'start-analysis failed' }, { status: 500 });
  }
}
