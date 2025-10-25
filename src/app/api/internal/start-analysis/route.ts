/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { orchestrateAnalysis } from '@/services/analysisOrchestrator';

import dbConnect from '@/lib/dbConnect';
import { AnalysisJobModel } from '@/models/AnalysisJob';
import type { AnalysisJob } from '@/types/geo';
import logger from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 800; // 800 seconds

/**
 * Extract clean hostname from any URL format
 * Returns just the domain without protocol or www
 */
function extractHostname(input: string): string {
  try {
    // Add protocol if missing
    const urlish = input.includes('://') ? input : `https://${input}`;
    const url = new URL(urlish);
    // Remove www. prefix
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    // Fallback for malformed URLs
    return input
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase();
  }
}

/**
 * Normalize URL by adding https:// if no protocol exists
 */
function normalizeUrl(raw: string): string {
  if (!raw) return raw;
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
}

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

export async function POST(request: NextRequest) {
  try {
    // Extract parameters from request body
    const { url, locale } = await request.json();

    // Input validation
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL gereklidir ve bir metin olmalidir.' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        }
      );
    }

    await dbConnect();

    // Input normalization
    const normalizedUrl = normalizeUrl(url);
    const hostname = extractHostname(url);
    
    console.log('[start-analysis] Input URL:', url);
    console.log('[start-analysis] Normalized URL:', normalizedUrl);
    console.log('[start-analysis] Hostname:', hostname);
    console.log('[start-analysis] Locale:', locale);

    const nowIso = new Date().toISOString();
    const jobId = uuidv4();

    // Create job directly with PROCESSING_SCRAPE status
    const newJob: AnalysisJob = {
      id: jobId,
      userId: 'public',
      url: normalizedUrl,
      urlHost: hostname,
      locale: locale || 'en',
      status: 'PROCESSING_SCRAPE', // Start directly at processing
      createdAt: nowIso,
      updatedAt: nowIso,
      finalGeoScore: null,
    };

    // Create the job in DB
    const payload = cleanUndefined(newJob) as any;
    await AnalysisJobModel.create(payload);

    console.log('[start-analysis] Created job:', jobId, 'for domain:', hostname);

    // Best-effort verify
    let wroteOk: boolean | undefined = undefined;
    try {
      const check = await AnalysisJobModel.findOne({ id: jobId }).lean().exec();
      wroteOk = !!check;
      console.log('[start-analysis] Job write verification:', wroteOk);
    } catch (err) {
      console.error('[start-analysis] Job verification failed:', err);
    }

    // Fire-and-forget: Start orchestration in background
    orchestrateAnalysis(newJob).catch((error: any) => {
      logger.error?.('orchestrateAnalysis failed (detached)', 'internal-start-analysis', { 
        jobId,
        error: error?.message || error 
      });
      
      // Update job status to FAILED on error
      AnalysisJobModel.updateOne(
        { id: jobId },
        {
          $set: {
            status: 'FAILED',
            updatedAt: new Date().toISOString(),
            error: error?.message || 'Analysis orchestration failed',
          },
        }
      ).exec().catch((dbErr) => {
        console.error('[start-analysis] Failed to update job status to FAILED:', dbErr);
      });
    });

    // Return immediately (fire-and-forget)
    return NextResponse.json(
      { 
        jobId, 
        wroteOk,
        status: 'PROCESSING_SCRAPE' // Return the actual status
      },
      {
        status: 202, // Accepted
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );

  } catch (error: any) {
    console.error('[start-analysis] Error in POST handler:', error);
    logger.error?.('start-analysis internal API failed', 'internal-start-analysis', { error });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );
  }
}
