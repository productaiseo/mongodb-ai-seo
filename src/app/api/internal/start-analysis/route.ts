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
    const body = await request.json();
    
    // ✅ Support both direct calls and calls from analyze-domain
    const url = body.url || body.domain;
    const locale = body.locale || 'en';
    const existingJobId = body.jobId; // Optional: if called from analyze-domain
    const userId = body.userId || 'public';

    // Input validation
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
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

    const normalizedUrl = normalizeUrl(url);
    const hostname = extractHostname(url);
    
    console.log('[start-analysis] Input URL:', url);
    console.log('[start-analysis] Normalized URL:', normalizedUrl);
    console.log('[start-analysis] Hostname:', hostname);
    console.log('[start-analysis] Locale:', locale);
    console.log('[start-analysis] Existing jobId:', existingJobId || 'none');

    let jobId: string;
    let job: AnalysisJob;

    // ✅ If jobId provided, update existing job
    if (existingJobId) {
      console.log('[start-analysis] Using existing jobId:', existingJobId);
      
      const existingJob = await AnalysisJobModel.findOne({ id: existingJobId }).lean<AnalysisJob>().exec();
      
      if (!existingJob) {
        console.error('[start-analysis] Job not found:', existingJobId);
        return NextResponse.json(
          { error: 'Job not found' },
          { 
            status: 404,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
            },
          }
        );
      }

      // Update to PROCESSING_SCRAPE
      await AnalysisJobModel.updateOne(
        { id: existingJobId },
        { $set: { status: 'PROCESSING_SCRAPE', updatedAt: new Date().toISOString() } }
      ).exec();

      jobId = existingJobId;
      job = {
        ...existingJob,
        status: 'PROCESSING_SCRAPE',
        updatedAt: new Date().toISOString(),
      };
      
      console.log('[start-analysis] Updated existing job:', jobId);
    } 
    // ✅ Otherwise, create new job
    else {
      // Check for existing job in last 24 hours to avoid duplicates
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentJob = await AnalysisJobModel.findOne({
        urlHost: hostname,
        createdAt: { $gte: sinceIso }
      })
      .sort({ createdAt: -1 })
      .lean<AnalysisJob>()
      .exec();

      if (recentJob && recentJob.status !== 'FAILED') {
        console.log('[start-analysis] Found recent job:', recentJob.id, 'status:', recentJob.status);
        
        if (recentJob.status === 'COMPLETED') {
          return NextResponse.json(
            { jobId: recentJob.id, status: 'COMPLETED' },
            {
              status: 200,
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
              },
            }
          );
        }
        
        // Job is in progress, return existing jobId
        return NextResponse.json(
          { jobId: recentJob.id, status: recentJob.status },
          {
            status: 202,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
            },
          }
        );
      }

      const nowIso = new Date().toISOString();
      jobId = uuidv4();

      job = {
        id: jobId,
        userId,
        url: normalizedUrl,
        urlHost: hostname,
        locale,
        status: 'PROCESSING_SCRAPE',
        createdAt: nowIso,
        updatedAt: nowIso,
        finalGeoScore: null,
      };

      const payload = cleanUndefined(job) as any;
      await AnalysisJobModel.create(payload);

      console.log('[start-analysis] Created new job:', jobId, 'for domain:', hostname);

      // Verify write
      try {
        const check = await AnalysisJobModel.findOne({ id: jobId }).lean().exec();
        if (!check) {
          console.error('[start-analysis] Job write verification failed');
        }
      } catch (err) {
        console.error('[start-analysis] Job verification error:', err);
      }
    }

    // Fire-and-forget: Start orchestration in background
    orchestrateAnalysis(job).catch((error: any) => {
      logger.error?.('orchestrateAnalysis failed (detached)', 'start-analysis', { 
        jobId,
        error: error?.message || error 
      });
      
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

    // Return immediately with jobId
    return NextResponse.json(
      { 
        jobId, 
        status: 'PROCESSING_SCRAPE'
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
    logger.error?.('start-analysis internal API failed', 'start-analysis', { error });
    
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
