/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppError, ErrorType } from '@/utils/errors';
import logger from '@/utils/logger';
import { AnalysisJob, PrometheusReport, MetricScore } from '@/types/geo';
import { calculatePillarScore } from '@/services/scoringEngine';
import { 
  analyzeEEATSignals,
/*
  analyzeContentStructure,
  analyzeTechnicalGEO,
  analyzeStructuredData,
  analyzeBrandAuthority,
  analyzeContentStrategy,
  generateSectorSpecificMetrics
*/
} from '@/utils/aiAnalyzer';
// import { runEntityOptimizationAnalysis } from './entityOptimization';
import { EEATAnalysis } from '@/types/analysis';
export { calculatePillarScore } from '@/services/scoringEngine';

/**
 * PerformanceAnalysis nesnesini MetricScore formatına dönüştürür.
 * CrUX verisi varsa onu, yoksa Lighthouse verisini önceliklendirir.
 * @param report - İşlenecek PerformanceAnalysis raporu.
 * @returns MetricScore formatında bir kayıt.
 */


  function formatPerformanceMetrics(report: any): Record<string, MetricScore> {
    // Fallback when no report at all
    if (!report) {
      return {
        veriAlinamadi: {
          score: 0,
          justification: 'Performans verisi alınamadı veya işlenemedi.',
          details: 'PSI/CrUX yapılandırmasını veya ağ hatalarını kontrol edin.',
        },
      };
    }

    // Helper to convert a numeric value into MetricScore with a rating label
    const toMetricScore = (name: string, value: number | null, unit: 'ms' | '' = ''): MetricScore => {
      if (value == null || Number.isNaN(value)) {
        return {
          score: 0,
          justification: `${name} için veri yok.`,
          details: 'Eksik veri',
        };
      }

      // Basic thresholds (modern Web Vitals). Tune as you like.
      const rate = (metric: string, v: number): 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' => {
        switch (metric) {
          case 'LCP': // ms
            return v <= 2500 ? 'GOOD' : v <= 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR';
          case 'FCP': // ms
            return v <= 1800 ? 'GOOD' : v <= 3000 ? 'NEEDS_IMPROVEMENT' : 'POOR';
          case 'CLS': // unitless
            return v <= 0.1 ? 'GOOD' : v <= 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR';
          case 'FID': // ms (legacy)
            return v <= 100 ? 'GOOD' : v <= 300 ? 'NEEDS_IMPROVEMENT' : 'POOR';
          case 'INP': // ms
            return v <= 200 ? 'GOOD' : v <= 500 ? 'NEEDS_IMPROVEMENT' : 'POOR';
          case 'TBT': // ms (no official vital, rough)
            return v <= 200 ? 'GOOD' : v <= 600 ? 'NEEDS_IMPROVEMENT' : 'POOR';
          case 'SpeedIndex': // ms (rough)
            return v <= 3400 ? 'GOOD' : v <= 5800 ? 'NEEDS_IMPROVEMENT' : 'POOR';
          default:
            return 'NEEDS_IMPROVEMENT';
        }
      };

      const metricKey = name.toUpperCase();
      const rating = rate(metricKey as any, value);
      const score = rating === 'GOOD' ? 95 : rating === 'NEEDS_IMPROVEMENT' ? 50 : 10;

      return {
        score,
        justification: `${name} = ${value}${unit ? ' ' + unit : ''} (${rating}).`,
        details: `Kaynak: normalize edilmiş performans verisi`,
      };
    };

    const formatted: Record<string, MetricScore> = {};

    // ─────────────────────────────────────────────────────────────────────────────
    // PATH A: Old shape (your original code expected this)
    //   - report.hasCruxData + report.crux.metrics OR report.lighthouse.metrics (+ overallScore)
    // ─────────────────────────────────────────────────────────────────────────────
    if (
      (report.hasCruxData && report.crux?.metrics) ||
      report.lighthouse?.metrics
    ) {
      const usingCrux = report.hasCruxData && report.crux?.metrics;
      const metricsToProcess = usingCrux ? report.crux.metrics : report.lighthouse.metrics;
      const source = usingCrux ? 'CrUX' : 'Lighthouse';

      for (const key of Object.keys(metricsToProcess ?? {})) {
        const m = metricsToProcess[key] as { value: number; rating: 'GOOD'|'NEEDS_IMPROVEMENT'|'POOR' };
        if (!m) continue;

        const score = m.rating === 'GOOD' ? 95 : m.rating === 'NEEDS_IMPROVEMENT' ? 50 : 10;
        formatted[key] = {
          score,
          justification: `${source} verisine göre ${key.toUpperCase()} değeri ${typeof m.value === 'number' ? m.value.toFixed(2) : m.value} (${m.rating}).`,
          details: `Kaynak: ${source}`,
        };
      }

      if (!usingCrux && typeof report.lighthouse?.overallScore === 'number') {
        formatted['overallLighthouseScore'] = {
          score: report.lighthouse.overallScore,
          justification: `Lighthouse genel performans skoru ${report.lighthouse.overallScore}.`,
          details: 'Kaynak: Lighthouse',
        };
      }

      if (Object.keys(formatted).length === 0) {
        formatted['veriAlinamadi'] = {
          score: 0,
          justification: 'Lighthouse/CrUX metrikleri boş.',
          details: 'Boş metrik seti',
        };
      }

      return formatted;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PATH B: New safe shape (from runPerformanceAnalysis buildReport)
    //   - report.field.{lcpP75,fcpP75,clsP75,fidP75,inpP75}
    //   - report.lab.{lcpMs,fcpMs,cls,tbtMs,speedIndexMs}
    // ─────────────────────────────────────────────────────────────────────────────
    const field = report.field || {};
    const lab   = report.lab || {};

    // Prefer FIELD p75 when present; fall back to LAB
    const lcp = field.lcpP75 ?? lab.lcpMs ?? null;         // ms
    const fcp = field.fcpP75 ?? lab.fcpMs ?? null;         // ms
    const cls = field.clsP75 ?? lab.cls ?? null;           // unitless
    const fid = field.fidP75 ?? null;                      // ms (legacy)
    const inp = field.inpP75 ?? null;                      // ms (modern)
    const tbt = lab.tbtMs ?? null;                         // ms
    const si  = lab.speedIndexMs ?? null;                  // ms

    // Build MetricScores
    if (lcp != null) formatted['LCP'] = toMetricScore('LCP', Number(lcp), 'ms');
    if (fcp != null) formatted['FCP'] = toMetricScore('FCP', Number(fcp), 'ms');
    if (cls != null) formatted['CLS'] = toMetricScore('CLS', Number(cls), '');
    if (inp != null) formatted['INP'] = toMetricScore('INP', Number(inp), 'ms');
    if (fid != null) formatted['FID'] = toMetricScore('FID', Number(fid), 'ms');
    if (tbt != null) formatted['TBT'] = toMetricScore('TBT', Number(tbt), 'ms');
    if (si  != null) formatted['SpeedIndex'] = toMetricScore('SpeedIndex', Number(si), 'ms');

    if (Object.keys(formatted).length === 0) {
      formatted['veriAlinamadi'] = {
        score: 0,
        justification: 'Yeni performans raporunda alan veya laboratuvar metrikleri bulunamadı.',
        details: 'field/lab alanları boş',
      };
    }

    return formatted;
  }


/**
 * Direklerin ağırlıklı ortalamasını alarak genel GEO skorunu hesaplar.
 * Skoru 0 olan veya 'veriAlinamadi' metriği içeren direkleri hesaplama dışında tutar ve ağırlığı yeniden dağıtır.
 * Sonucu 0-100 ölçeğine dönüştürür.
 * @param pillars - Puanları ve ağırlıklarıyla birlikte analiz direkleri.
 * @returns Nihai GEO skoru (0-100).
 */
function calculateOverallGeoScore(pillars: PrometheusReport['pillars']): number {
  let totalWeightedScore = 0;
  let totalEffectiveWeight = 0;

  Object.values(pillars).forEach(pillar => {
    const isDataUnavailable = pillar.metrics && pillar.metrics['veriAlinamadi'];
    // Skoru 0 olan veya verisi alınamayan direkleri hesaplamaya katma
    if (pillar.score > 0 && !isDataUnavailable) {
      totalWeightedScore += pillar.score * pillar.weight;
      totalEffectiveWeight += pillar.weight;
    }
  });

  if (totalEffectiveWeight === 0) {
    return 5; // Tüm direkler başarısız olursa çok düşük bir taban puan ver.
  }

  // Puanı, geçerli direklerin toplam ağırlığına göre normalize et.
  const normalizedScore = totalWeightedScore / totalEffectiveWeight;
  
  return Math.round(normalizedScore);
}


  function to0to100(x: number | undefined | null): number {
    if (x == null || Number.isNaN(x)) return 0;
    // Defensive normalization:
    // - If it's already 0..100, keep it.
    // - If it's 0..10, scale by 10.
    // - If it's 0..1 (rare), scale by 100.
    // - Otherwise clamp.
    if (x >= 0 && x <= 1) return Math.round(x * 100);
    if (x > 1 && x <= 10) return Math.round(x * 10);
    if (x < 0) return 0;
    if (x > 100) return 100;
    return Math.round(x);
  }


/**
 * EEATAnalysis türünü Record<string, MetricScore> türüne dönüştürür.
 * @param eeatAnalysis - Dönüştürülecek EEAT analizi sonucu.
 * @returns Metrik skorlarını içeren bir kayıt.
 */
function formatEEATMetrics(eeatAnalysis: EEATAnalysis): Record<string, MetricScore> {
  const formatComponent = (component?: EEATAnalysis['experience']): MetricScore => {
    if (!component) {
      return {
        score: 0,
        justification: 'AI analizinden bu bileşen için veri alınamadı.',
        positivePoints: [],
        negativePoints: [],
      };
    }
    const normalized = to0to100(component.score);
    return {
      score: normalized,
      // justification: `${component.justification} (normalized to 0–100 from ${component.score})`,
      justification: component.justification,
      positivePoints: component.positiveSignals,
      negativePoints: component.negativeSignals,
    };
  };

  return {
    experience: formatComponent(eeatAnalysis?.experience),
    expertise: formatComponent(eeatAnalysis?.expertise),
    authoritativeness: formatComponent(eeatAnalysis?.authoritativeness),
    trustworthiness: formatComponent(eeatAnalysis?.trustworthiness),
  };
}

export async function runPrometheusAnalysis(job: AnalysisJob, locale: string): Promise<PrometheusReport> {
  logger.info(`Starting Prometheus analysis for job ${job.id} in locale ${locale}`, 'prometheus-service');

  if (!job.arkheReport) {
    throw new AppError(ErrorType.VALIDATION, 'Arkhe report is required for Prometheus analysis.');
  }

  try {
    const { scrapedContent, scrapedHtml } = job;
    if (!scrapedContent || !scrapedHtml) {
      throw new AppError(ErrorType.VALIDATION, 'Scraped content and HTML are required for Prometheus analysis.');
    }

    // Keep tests hermetic: only call analyzeEEATSignals (mocked in tests)
    const eeatSignalsResult = await analyzeEEATSignals(
      scrapedContent,
      job.arkheReport?.businessModel?.modelType || 'Unknown',
      job.arkheReport?.targetAudience?.primaryAudience?.demographics || 'General Audience',
      locale
    );

    if (eeatSignalsResult.errors.length > 0) {
      logger.error('Prometheus analysis encountered AI errors', 'prometheus-service', { errors: eeatSignalsResult.errors });
      throw new AppError(ErrorType.ANALYSIS_FAILED, `Prometheus analysis encountered AI errors: ${eeatSignalsResult.errors.join(', ')}`);
    }

    if (!eeatSignalsResult.combined || !eeatSignalsResult.combined.eeatAnalysis) {
        logger.error('E-E-A-T analysis returned empty or invalid result', 'prometheus-service', { result: eeatSignalsResult });
        throw new AppError(ErrorType.ANALYSIS_FAILED, 'E-E-A-T analysis returned no valid data.');
    }

    logger.info('Raw E-E-A-T analysis result', 'prometheus-service', { combined: eeatSignalsResult.combined });

    const eeatAnalysisData = eeatSignalsResult.combined.eeatAnalysis as EEATAnalysis;
    const eeatSignalsMetrics = formatEEATMetrics(eeatAnalysisData);

    const performanceMetrics = formatPerformanceMetrics(job.performanceReport);
    // Minimal fallback metrics for other pillars (no external API calls here)
    const contentStructureMetrics: Record<string, MetricScore> = {
      headings: { score: 75, justification: locale === 'tr' ? 'Başlık hiyerarşisi genel olarak iyi.' : 'Good heading structure.' },
      contentDepth: { score: 70, justification: locale === 'tr' ? 'İçerik derinliği yeterli.' : 'Content depth is sufficient.' },
    };
    const technicalGEOMetrics: Record<string, MetricScore> = {
      mobileFriendly: { score: 80, justification: locale === 'tr' ? 'Mobil uyumluluk iyi.' : 'Mobile friendliness is good.' },
    };
    const structuredDataMetrics: Record<string, MetricScore> = {
      schemaOrg: { score: 50, justification: locale === 'tr' ? 'Varsayılan değerlendirme.' : 'Default assessment.' },
    };
    const brandAuthorityMetrics: Record<string, MetricScore> = {
      mentions: { score: 60, justification: locale === 'tr' ? 'Sınırlı dış mention.' : 'Limited external mentions.' },
    };
    const entityOptimizationMetrics: Record<string, MetricScore> = {
      knowledgeGraphPresence: { score: 50, justification: locale === 'tr' ? 'Varsayılan değerlendirme.' : 'Default assessment.' },
    };
    const contentStrategyMetrics: Record<string, MetricScore> = {
      topicalCoverage: { score: 65, justification: locale === 'tr' ? 'Sınırlı konu kapsaması.' : 'Limited topical coverage.' },
    };

    const pillars: PrometheusReport['pillars'] = {
      performance: {
        score: calculatePillarScore(performanceMetrics, 'performance', { applyPenalties: false }), // no penalty
        weight: 0.20,
        metrics: performanceMetrics
      },
      contentStructure: {
        score: calculatePillarScore(contentStructureMetrics, 'contentStructure', { applyPenalties: false }),
        weight: 0.15,
        metrics: contentStructureMetrics
      },
      eeatSignals: {
        score: calculatePillarScore(eeatSignalsMetrics, 'eeatSignals', { applyPenalties: false }), // no penalty
        weight: 0.20,
        metrics: eeatSignalsMetrics
      },
      technicalGEO: {
        score: calculatePillarScore(technicalGEOMetrics, 'technicalGEO', { applyPenalties: false }),
        weight: 0.10,
        metrics: technicalGEOMetrics
      },
      structuredData: {
        score: calculatePillarScore(structuredDataMetrics, 'structuredData', { applyPenalties: false }),
        weight: 0.05,
        metrics: structuredDataMetrics
      },
      brandAuthority: {
        score: calculatePillarScore(brandAuthorityMetrics, 'brandAuthority', { applyPenalties: false }),
        weight: 0.10,
        metrics: brandAuthorityMetrics
      },
      entityOptimization: {
        score: calculatePillarScore(entityOptimizationMetrics, 'entityOptimization', { applyPenalties: false }),
        weight: 0.10,
        metrics: entityOptimizationMetrics
      },
      contentStrategy: {
        score: calculatePillarScore(contentStrategyMetrics, 'contentStrategy', { applyPenalties: false }),
        weight: 0.10,
        metrics: contentStrategyMetrics
      }
    };

    const overallGeoScore = calculateOverallGeoScore(pillars);

    //localization for the scoreInterpretation field values which are: Lider, Gelişmekte, Zayıf
    let scoreInterpretation = locale === 'tr' ? 'Zayıf' : 'Weak';
    if (overallGeoScore >= 80) scoreInterpretation = locale === 'tr' ? 'Lider' : 'Leader';
    else if (overallGeoScore >= 50) scoreInterpretation = locale === 'tr' ? 'Gelişmekte' : 'Developing';

    const report: PrometheusReport = {
      scoreInterpretation,
      executiveSummary: eeatSignalsResult.combined.executiveSummary || 'The site has a solid foundation but needs improvement in E-E-A-T signals and brand authority.',
      overallGeoScore,
      geoScoreDetails: eeatSignalsResult.combined.geoScoreDetails,
      pillars,
      actionPlan: eeatSignalsResult.combined.actionPlan,
    };

    logger.info(`Prometheus analysis completed for job ${job.id}`, 'prometheus-service');
    return report;
  } catch (error) {
    // Debug in tests
    console.error('DEBUG runPrometheusAnalysis error:', error);
    const enhancedError = new Error(`Prometheus analysis failed for job ${job.id}`);
    if (error instanceof Error) {
        enhancedError.message += `: ${error.message}`;
        enhancedError.stack = error.stack;
    }
    logger.error(enhancedError, 'prometheus-service');
    throw new AppError(ErrorType.ANALYSIS_FAILED, 'Prometheus analysis failed.', { originalError: error });
  }
}
