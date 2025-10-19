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
export const maxDuration = 800;

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
    const { url, locale } = await request.json();

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

    const normalizedUrl = normalizeUrl(url);
    const hostname = extractHostname(url); // Extract clean hostname
    
    console.log('[analyze-domain] Input URL:', url);
    console.log('[analyze-domain] Normalized URL:', normalizedUrl);
    console.log('[analyze-domain] Hostname:', hostname);

    // Check for existing job in last 24 hours
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const existingJob = await AnalysisJobModel.findOne({
      urlHost: hostname,
      createdAt: { $gte: sinceIso }
    })
    .sort({ createdAt: -1 })
    .lean<AnalysisJob>()
    .exec();

    if (existingJob) {
      console.log('[analyze-domain] Found existing job:', existingJob.id, 'status:', existingJob.status);
      
      if (existingJob.status === 'COMPLETED') {
        return NextResponse.json(
          { jobId: existingJob.id, status: 'COMPLETED' },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
            },
          }
        );
      } else if (existingJob.status !== 'FAILED') {
        return NextResponse.json(
          { jobId: existingJob.id, status: existingJob.status },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
            },
          }
        );
      }
    }

    const nowIso = new Date().toISOString();
    const jobId = uuidv4();

    const newJob: AnalysisJob = {
      id: jobId,
      userId: 'public',
      url: normalizedUrl,
      urlHost: hostname, // Store clean hostname for easy lookups
      locale,
      status: 'QUEUED',
      createdAt: nowIso,
      updatedAt: nowIso,
      finalGeoScore: null,
    };

    // Create the job
    const payload = cleanUndefined(newJob) as any;
    await AnalysisJobModel.create(payload);

    console.log('[analyze-domain] Created job:', jobId, 'for domain:', hostname);

    // Best-effort verify
    let wroteOk: boolean | undefined = undefined;
    try {
      const check = await AnalysisJobModel.findOne({ id: jobId }).lean().exec();
      wroteOk = !!check;
      console.log('[analyze-domain] Job write verification:', wroteOk);
    } catch (err) {
      console.error('[analyze-domain] Job verification failed:', err);
    }

    // Resolve internal base URL
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
      await AnalysisJobModel.updateOne(
        { id: jobId },
        { $set: { status: 'FAILED', updatedAt: new Date().toISOString(), error: 'Server is not configured' } }
      ).exec();

      return NextResponse.json(
        { error: 'Server is not configured' }, 
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        }
      );
    }

    console.log('[analyze-domain] Locale:', locale);

    const enqueueUrl = `${baseUrl}/api/internal/enqueue-analysis`;
    const body = { 
      jobId, 
      userId: 'public', 
      domain: hostname, // Send clean hostname to worker
      url: normalizedUrl, // Also send full URL if needed
      locale 
    };
    
    console.log('[analyze-domain] Enqueue body:', body);
    
    const ts = Date.now().toString();
    const payloadToSign = `${ts}.${JSON.stringify(body)}`;
    const sig = crypto.createHmac('sha256', key).update(payloadToSign).digest('hex');

    // Fire-and-forget enqueue
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
          console.error('[analyze-domain] Enqueue failed:', res.status, text);
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
        } else {
          console.log('[analyze-domain] Enqueue successful for job:', jobId);
        }
      })
      .catch(async (err: any) => {
        console.error('[analyze-domain] Enqueue error:', err);
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
      { jobId, wroteOk },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[analyze-domain] Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata olustu.' },
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
