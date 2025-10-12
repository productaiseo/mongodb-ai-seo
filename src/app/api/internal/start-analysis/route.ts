/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
    // --- Auth & Signature checks (same semantics as your Firebase version) ---
    const token = (request.headers.get('x-internal-token') || '').trim();
    const ts = request.headers.get('x-timestamp') || '';
    const signature = request.headers.get('x-signature') || '';

    const serverToken = (process.env.INTERNAL_API_TOKEN || '').trim();
    if (!serverToken) {
      console.error('[internal-start] INTERNAL_API_TOKEN missing in env');
      logger.error('INTERNAL_API_TOKEN missing in env', 'internal-start-analysis');
      return NextResponse.json({ error: 'Server is not configured' }, { status: 500 });
    }

    if (token !== serverToken) {
      console.error(
        '[internal-start] Unauthorized: token mismatch. len(client)=',
        token?.length || 0,
        ' len(server)=',
        serverToken?.length || 0
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Optional HMAC validation with timestamp freshness check
    if (ts && signature) {
      const tsNum = Number(ts);
      if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) {
        console.error('[internal-start] Timestamp expired or invalid:', ts);
        return NextResponse.json({ error: 'Timestamp expired' }, { status: 403 });
      }

      const raw = await request.clone().text();
      let canonical = raw;
      try {
        canonical = JSON.stringify(JSON.parse(raw));
      } catch {}
      const payload = `${ts}.${canonical}`;
      const expected = crypto.createHmac('sha256', serverToken).update(payload).digest('hex');
      if (expected !== signature) {
        console.error('[internal-start] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    // --- Parse body ---
    const body = await request.json();
    const { jobId, userId, domain, locale } = body || {};
    if (!jobId || !userId || !domain) {
      return NextResponse.json({ error: 'jobId, userId ve domain zorunludur' }, { status: 400 });
    }

    // Normalize URL (keep parity with your other route)
    const url = String(domain).startsWith('http') ? String(domain) : `https://${String(domain)}`;

    // --- DB: connect & early status update ---
    await dbConnect();

    console.log("start analysis", locale);
    // Mark as PROCESSING early so UI doesn't look stuck on QUEUED
    try {
      await AnalysisJobModel.updateOne(
        { id: jobId },
        {
          $set: {
            status: 'PROCESSING',
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
      status: 'PROCESSING',
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
