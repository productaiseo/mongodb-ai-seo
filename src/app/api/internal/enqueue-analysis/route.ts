/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import logger from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 800; // 800 seconds

// Enqueue analysis via Cloud Tasks (if configured), else call orchestrator with OIDC, else fallback to local start-analysis
export async function POST(request: NextRequest) {
  try {

    const { jobId, userId, domain, locale } = await request.json();

    if (!jobId || !userId || !domain) {
      return NextResponse.json({ error: 'jobId, userId ve domain zorunludur' }, { status: 400 });
    }

    console.log("locale enqueue-analysis", locale);

    // const token = (process.env.INTERNAL_API_TOKEN || '').trim();
    // logger.info('Token check', 'enqueue-analysis', { hasToken: !!token });

    const raw = process.env.INTERNAL_API_TOKEN;
    const token = typeof raw === 'string' ? raw.trim() : '';
    logger.info('Token check', 'enqueue-analysis', {
      present: raw !== undefined,
      type: typeof raw,
      rawPreview: typeof raw === 'string' ? `${raw.slice(0, 4)}…(${raw.length})` : raw,
      trimmedLength: token.length,
    });

    const payload = { jobId, userId, domain, locale };

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
