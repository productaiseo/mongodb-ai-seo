/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

import dbConnect from '@/lib/dbConnect';
import { AnalysisJobModel } from '@/models/AnalysisJob';
import type { AnalysisJob } from '@/types/geo';
import logger from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 800; // 800 seconds

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

    const { url, locale, } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL gereklidir ve bir metin olmalidir.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedUrl = normalizeUrl(url);
    const nowIso = new Date().toISOString();
    const jobId = uuidv4();

    const newJob: AnalysisJob = {
      id: jobId,
      userId: 'public',
      url: normalizedUrl,
      locale,
      status: 'QUEUED',
      createdAt: nowIso,
      updatedAt: nowIso,
      finalGeoScore: null,
    };

    // Create the job
    const payload = cleanUndefined(newJob) as any;
    await AnalysisJobModel.create(payload);

    // Best-effort verify
    let wroteOk: boolean | undefined = undefined;
    try {
      const check = await AnalysisJobModel.findOne({ id: jobId }).lean().exec();
      wroteOk = !!check;
    } catch {
      // ignore
    }

    // Resolve internal base URL (same-origin fallback)
    let baseUrl = process.env.INTERNAL_API_URL;
    try {
      if (!baseUrl) throw new Error('no_base');
      const u = new URL(baseUrl);
      if (/[<>]/.test(u.href)) throw new Error('placeholder');
      baseUrl = u.origin;
    } catch {
      baseUrl = new URL(request.url).origin;
    }

    const key = process.env.INTERNAL_API_TOKEN || '';
    if (!key) {
      logger.error('INTERNAL_API_TOKEN missing in env', 'internal-start-analysis');
      // Mark FAILED if misconfigured
      await AnalysisJobModel.updateOne(
        { id: jobId },
        { $set: { status: 'FAILED', updatedAt: new Date().toISOString(), error: 'Server is not configured' } }
      ).exec();

      return NextResponse.json({ error: 'Server is not configured' }, { status: 500 });
    }

    console.log("locale analyze-domain", locale);

    const enqueueUrl = `${baseUrl}/api/internal/enqueue-analysis`;
    const body = { jobId, userId: 'public', domain: normalizedUrl, locale };
    console.log("analyze-domain body", body);
    const ts = Date.now().toString();
    const payloadToSign = `${ts}.${JSON.stringify(body)}`;
    const sig = crypto.createHmac('sha256', key).update(payloadToSign).digest('hex');

    // Fire-and-forget enqueue; on failure mark job as FAILED
    fetch(enqueueUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': key,
        'X-Timestamp': ts,
        'X-Signature': sig,
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          await AnalysisJobModel.updateOne(
            { id: jobId },
            {
              $set: {
                status: 'FAILED',
                updatedAt: new Date().toISOString(),
                error: `enqueue failed: ${res.status} ${res.statusText} - ${text}`,
              },
            }
          ).exec();
        }
      })
      .catch(async (err: any) => {
        await AnalysisJobModel.updateOne(
          { id: jobId },
          {
            $set: {
              status: 'FAILED',
              updatedAt: new Date().toISOString(),
              error: err?.message || 'enqueue failed',
            },
          }
        ).exec();
      });

    return NextResponse.json(
      { jobId, wroteOk }, // response body
      { 
        status: 200,
        headers: {   
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Error in analyze-domain POST handler:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata olustu.' },
      { status: 500 }
    );
  }
}
