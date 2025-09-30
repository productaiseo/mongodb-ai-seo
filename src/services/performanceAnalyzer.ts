/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from '@/utils/logger';
import { AppError, ErrorType } from '@/utils/errors';

// If you use PageSpeed Insights, set PSI_API_KEY in env.
// Otherwise you can plug any provider and still return the same shape below.
const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/** Helper: deep get */
function get<T = any>(obj: any, path: string, fallback?: T): T | undefined {
  return path.split('.').reduce((o: any, k: string) => (o && k in o ? o[k] : undefined), obj) ?? fallback;
}

/** Helper: extract p75 safely from CrUX "metrics" */
function p75(metrics: any, key: string): number | null {
  // CrUX API: metrics.<key>.percentiles.p75
  const v = metrics?.[key]?.percentiles?.p75;
  return typeof v === 'number' ? v : null;
}

/** Normalizes PSI/CrUX response into your app’s report format */
function buildReport(url: string, json: any) {
  // Two common sources inside PSI v5 response:
  // 1) Lighthouse audits (json.lighthouseResult.audits.*)
  // 2) CrUX field data (json.loadingExperience / json.originLoadingExperience OR CrUX API "record.metrics")

  // ---- Lighthouse (lab) sampling (optional) ----
  const audits = get(json, 'lighthouseResult.audits', {});
  const lcpMsLab = Number(get(audits, 'largest-contentful-paint.numericValue', null)) || null;
  const clsLab   = Number(get(audits, 'cumulative-layout-shift.numericValue', null)) || null;
  const fcpMsLab = Number(get(audits, 'first-contentful-paint.numericValue', null)) || null;
  const tbtMsLab = Number(get(audits, 'total-blocking-time.numericValue', null)) || null;
  const siMsLab  = Number(get(audits, 'speed-index.numericValue', null)) || null;

  // ---- Field (CrUX) p75: handle both PSI and CrUX endpoints ----
  // PSI embedding:
  const psiField = get(json, 'loadingExperience.metrics') || get(json, 'originLoadingExperience.metrics') || null;

  // CrUX direct (if you ever swap to the CrUX API):
  const cruxRecordMetrics = get(json, 'record.metrics') || null;

  const fieldMetrics = psiField || cruxRecordMetrics || {};

  // Try both PSI metric keys and CrUX keys:
  // PSI keys example: FIRST_CONTENTFUL_PAINT_MS, LARGEST_CONTENTFUL_PAINT_MS, CUMULATIVE_LAYOUT_SHIFT_SCORE, FIRST_INPUT_DELAY_MS, INTERACTION_TO_NEXT_PAINT
  // CrUX keys example: first_contentful_paint, largest_contentful_paint, cumulative_layout_shift, first_input_delay, interaction_to_next_paint
  const fcpField =
    p75(fieldMetrics, 'FIRST_CONTENTFUL_PAINT_MS') ??
    p75(fieldMetrics, 'first_contentful_paint') ?? null;

  const lcpField =
    p75(fieldMetrics, 'LARGEST_CONTENTFUL_PAINT_MS') ??
    p75(fieldMetrics, 'largest_contentful_paint') ?? null;

  const clsField =
    p75(fieldMetrics, 'CUMULATIVE_LAYOUT_SHIFT_SCORE') ??
    p75(fieldMetrics, 'cumulative_layout_shift') ?? null;

  const fidField =
    p75(fieldMetrics, 'FIRST_INPUT_DELAY_MS') ??
    p75(fieldMetrics, 'first_input_delay') ?? null;

  const inpField =
    p75(fieldMetrics, 'INTERACTION_TO_NEXT_PAINT') ??
    p75(fieldMetrics, 'interaction_to_next_paint') ?? null;

  return {
    url,
    fetchedAt: new Date().toISOString(),
    lab: {
      lcpMs: lcpMsLab,
      fcpMs: fcpMsLab,
      cls: clsLab,
      tbtMs: tbtMsLab,
      speedIndexMs: siMsLab,
    },
    field: {
      // p75 values in ms or unitless (CLS)
      lcpP75: lcpField,
      fcpP75: fcpField,
      clsP75: clsField,      // unitless
      fidP75: fidField,
      inpP75: inpField,
    },
    rawProvider: (json && json.kind) || 'unknown', // optional
  };
}

/**
 * Run performance analysis using PSI if PSI_API_KEY is present.
 * If missing, returns a no-op report (so the pipeline doesn’t crash).
 */
export async function runPerformanceAnalysis(url: string) {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.PSI_API_KEY;


    if (!apiKey) {
      // No external provider configured → return empty but valid structure
      logger.warn('PSI_API_KEY missing; returning stub performance report', 'performanceAnalyzer.run');
      return buildReport(url, {}); // will have mostly nulls
    }

    const u = new URL(PSI_ENDPOINT);
    u.searchParams.set('url', url);
    u.searchParams.set('strategy', 'mobile');
    u.searchParams.set('category', 'performance');
    u.searchParams.set('key', apiKey);

    logger.info(`PageSpeed Insights analizi başlatılıyor: ${url}`, 'performanceAnalyzer.run');

    const resp = await fetch(u.toString(), { method: 'GET' });
    const json = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // Surface API errors, but keep the pipeline alive by throwing an AppError (caught by orchestrator)
      const msg = (json && (json.error?.message || json.message)) || `PSI request failed with ${resp.status}`;
      throw new AppError(ErrorType.EXTERNAL_API, msg, { status: resp.status, body: json });
    }

    // Build safe report regardless of which fields are present
    return buildReport(url, json);
  } catch (err: any) {
    // Wrap unknown shape errors so they’re visible but typed
    const msg = err?.message || 'Unknown error in runPerformanceAnalysis';
    logger.error(msg, 'performanceAnalyzer.run', { error: err });
    throw new AppError(ErrorType.UNKNOWN, msg, { originalError: err });
  }
}
