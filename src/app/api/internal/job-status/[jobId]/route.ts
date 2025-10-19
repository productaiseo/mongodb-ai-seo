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
  // Matches your original signature that used a Promise for params
  props: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await props.params;
    console.log('[job-status] Fetching job status for', jobId);

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    /*  // If you later add auth, keep this block and verify ownership:
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!bearer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // decode/verify your own JWT here and derive userId to enforce ownership
    */

    await dbConnect();
    const job = await AnalysisJobModel.findOne({ id: jobId }).lean<AnalysisJob>().exec();

    // If not found yet, treat as queued (202) to avoid jarring UX
    if (!job) {
      return NextResponse.json({ status: 'QUEUED' }, { status: 202 });
    }

    /*  // Enforce ownership example (uncomment when you have userId from auth):
    // if (job.userId && job.userId !== userId) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
    */

    if (job.status === 'COMPLETED') {
      // When completed, return full job object
      return NextResponse.json(
        { status: job.status, job }, // response body
        { 
          status: 200,
          headers: {   
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        }
      );
    }

    // Otherwise return just status (and error if present)
    return NextResponse.json({ status: job.status, error: (job as any).error ?? null });
  } catch (error) {
    console.error('[job-status] Error fetching job status', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
