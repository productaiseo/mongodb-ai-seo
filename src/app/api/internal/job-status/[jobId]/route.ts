/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { AnalysisJob } from '@/types/geo';
import dbConnect from '@/lib/dbConnect';
import { AnalysisJobModel } from '@/models/AnalysisJob';

export async function generateStaticParams() {
  return [];
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await props.params;
    console.log('[job-status] Fetching job status for', jobId);

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' }, 
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
    const job = await AnalysisJobModel.findOne({ id: jobId }).lean<AnalysisJob>().exec();

    // CRITICAL FIX: If job not found, return 404 instead of QUEUED
    // This prevents infinite polling on non-existent jobs
    if (!job) {
      console.warn(`[job-status] Job ${jobId} not found in database`);
      return NextResponse.json(
        { error: 'Job not found', status: 'NOT_FOUND' }, 
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        }
      );
    }

    console.log(`[job-status] Job ${jobId} status: ${job.status}`);

    if (job.status === 'COMPLETED') {
      // When completed, return full job object
      return NextResponse.json(
        { status: job.status, job },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        }
      );
    }

    if (job.status === 'FAILED') {
      return NextResponse.json(
        { 
          status: job.status, 
          error: (job as any).error ?? 'Analysis failed' 
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        }
      );
    }

    // Return current status for in-progress jobs
    return NextResponse.json(
      { 
        status: job.status, 
        jobId: job.id,
        error: (job as any).error ?? null 
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[job-status] Error fetching job status', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' }, 
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
