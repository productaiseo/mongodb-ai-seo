/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from '@/lib/dbConnect';
import { AnalysisJobModel } from '@/models/AnalysisJob';
import { ReportModel } from '@/models/Report';
import { QueryModel } from '@/models/Query';
import { JobEventModel } from '@/models/JobEvent'; // optional but handy
import type { AnalysisJob } from '@/types/geo';

function isoNow() {
  return new Date().toISOString();
}

/** Read a job by public `id` (not _id). */
export async function getJob(id: string): Promise<AnalysisJob | null> {
  await dbConnect();
  const doc = await AnalysisJobModel.findOne({ id }).lean<AnalysisJob>().exec();
  return doc ?? null;
}

/** Partially update a job; auto-sets updatedAt; upserts if missing (keeps parity with prior flow). */
export async function updateJob(id: string, updates: Partial<AnalysisJob>): Promise<void> {
  await dbConnect();
  await AnalysisJobModel.updateOne(
    { id },
    { $set: { ...updates, updatedAt: isoNow() } },
    { upsert: true }
  ).exec();
}

/** Persist a full report document under reports/{jobId} (by jobId uniqueness). */
export async function saveReport(queryId: string | undefined, job: AnalysisJob): Promise<void> {
  if (!job?.id) return;
  await dbConnect();

  const reportDoc = {
    jobId: job.id,
    userId: job.userId,
    domain: job.url,
    createdAt: job.createdAt,
    updatedAt: isoNow(),
    finalGeoScore: job.finalGeoScore ?? null,
    arkheReport: job.arkheReport ?? null,
    prometheusReport: job.prometheusReport ?? null,
    delfiAgenda: job.delfiAgenda ?? null,
    generativePerformanceReport: job.generativePerformanceReport ?? null,
    performanceReport: job.performanceReport ?? null,
    queryId: queryId ?? null,
    enhancedAnalysis: (job as any).enhancedAnalysis ?? null,
  };

  await ReportModel.updateOne(
    { jobId: job.id },
    { $set: reportDoc },
    { upsert: true }
  ).exec();
}

/** Optionally maintain a queries/{queryId} status document (if provided). */
export async function updateQueryStatus(queryId: string | undefined, status: string): Promise<void> {
  if (!queryId) return;
  await dbConnect();

  await QueryModel.updateOne(
    { id: queryId },                      // we treat "id" as the public key, like Firestore docId
    { $set: { id: queryId, status, updatedAt: isoNow() } },
    { upsert: true }
  ).exec();
}

/**
 * Append a job event.
 * A) Pushes to analysisJobs.events[] (array on the job doc)
 * B) Also creates a row in a dedicated JobEvent collection (optional, for easy timelines)
 */
export async function appendJobEvent(
  jobId: string,
  event: { step: string; status: 'STARTED' | 'COMPLETED' | 'FAILED'; timestamp?: string; detail?: any }
): Promise<void> {
  await dbConnect();
  const ts = event.timestamp || isoNow();

  // A) Append to job.events[] (mirrors your Firestore arrayUnion logic)
  await AnalysisJobModel.updateOne(
    { id: jobId },
    {
      $push: {
        events: {
          step: event.step,
          status: event.status,
          timestamp: ts,
          detail: event.detail ?? null,
        },
      },
      $setOnInsert: { id: jobId, createdAt: ts },
      $set: { updatedAt: ts },
    },
    { upsert: true }
  ).exec();

  // B) Also write a standalone event doc (optional but useful)
  try {
    await JobEventModel.create({
      jobId,
      step: event.step,
      status: event.status,
      meta: event.detail ?? null,
      ts,
    });
  } catch {
    // best-effort
  }
}
