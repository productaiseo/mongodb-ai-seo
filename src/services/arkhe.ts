/* eslint-disable @typescript-eslint/no-unused-vars */
import 'server-only';
import { AppError, ErrorType } from '@/utils/errors';
import logger from '@/utils/logger';
import { AnalysisJob, ArkheReport } from '@/types/geo';
import { handleServiceError } from '@/utils/errorHandlers';
import { scrapWithPuppeteer } from '@/services/puppeteerScraper';
// import { scrapWithPlaywright } from '@/services/playwrightScraper';
import { analyzeBusinessModel, analyzeTargetAudience, analyzeCompetitors } from '@/utils/aiAnalyzer';
// import { PlaywrightScrapeResult } from '@/utils/types/analysis';

export async function runArkheAnalysis(job: AnalysisJob, locale: string): Promise<ArkheReport | { error: string }> {
  logger.info(`Starting Arkhe analysis for job ${job.id}`, 'arkhe-service', { url: job.url, locale });

  try {
    // const { html, content, robotsTxt, llmsTxt } = await scrapWithPlaywright(job.url);
    const { html, content, robotsTxt, llmsTxt } = await scrapWithPuppeteer(job.url);

    if (!content || content.trim().length < 100) {
      throw new AppError(ErrorType.VALIDATION, 'Scraped content is insufficient for Arkhe analysis.');
    }

    console.log("locale in arkhe", locale);

    const [businessModelResult, targetAudienceResult, competitorsResult] = await Promise.all([
      analyzeBusinessModel(content, locale),
      analyzeTargetAudience(content, locale),
      analyzeCompetitors(content, job.url, locale)
    ]);
/* 
    // Hata kontrolü
    const errors = [
      ...businessModelResult.errors,
      ...targetAudienceResult.errors,
      ...competitorsResult.errors,
    ];

    if (errors.length > 0) {
      throw new AppError(ErrorType.ANALYSIS_FAILED, `Arkhe analysis encountered AI errors: ${errors.join(', ')}`);
    }
 */

    // proceed if at least one combined exists
    const ok = businessModelResult?.combined && targetAudienceResult?.combined && competitorsResult?.combined;
    if (!ok) {
      throw new AppError(ErrorType.ANALYSIS_FAILED, 'Arkhe analysis encountered AI errors.');
    }

    const report: ArkheReport = {
      businessModel: businessModelResult?.combined,
      targetAudience: targetAudienceResult?.combined,
      competitors: competitorsResult?.combined,
    };

    // Rakip analizi için şimdilik bir şey yapmıyoruz, bu daha sonraki bir adımda ele alınacak.

    logger.info(`Arkhe analysis completed for job ${job?.id}`, 'arkhe-service');
    return report;
  } catch (error) {
    return handleServiceError(error, 'arkhe.runArkheAnalysis');
  }
}
