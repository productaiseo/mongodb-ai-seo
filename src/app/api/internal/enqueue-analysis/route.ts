/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import crypto from 'crypto';
// import { createHttpTask } from '@/lib/cloudTasks';
import logger from '@/utils/logger';

// Enqueue analysis via Cloud Tasks (if configured), else call orchestrator with OIDC, else fallback to local start-analysis
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      logger.error('Invalid JSON body', 'enqueue-analysis', { e });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const { jobId, userId, domain } = body || {};
    if (!jobId || !userId || !domain) {
      return NextResponse.json({ error: 'jobId, userId ve domain zorunludur' }, { status: 400 });
    }

    const token = (process.env.INTERNAL_API_TOKEN || '').trim();
    const payload = { jobId, userId, domain };

    // Fallback: call local start-analysis
    const base = new URL(request.url).origin;
    const startUrl = `${base}/api/internal/start-analysis`;
    const ts = Date.now().toString();
    const sig = token ? crypto.createHmac('sha256', token).update(`${ts}.${JSON.stringify(payload)}`).digest('hex') : '';
    const res = await fetch(startUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Internal-Token': token, 'X-Timestamp': ts, 'X-Signature': sig } : {}) },
      body: JSON.stringify(payload),
    } as any);
    if (!res.ok) {
      const text = await res.text().catch(()=> '');
      logger.error(`start-analysis failed: ${res.status} ${res.statusText}`, 'enqueue-analysis', { text });
      return NextResponse.json({ error: `start-analysis failed: ${res.status} ${res.statusText}`, detail: text }, { status: 502 });
    }
    return NextResponse.json({ ok: true, queued: true }, { status: 202 });
  } catch (e: any) {
    logger.error('enqueue failed', 'enqueue-analysis', { message: e?.message, stack: e?.stack });
    return NextResponse.json({ error: 'enqueue failed', detail: e?.message || String(e) }, { status: 500 });
  }
}
