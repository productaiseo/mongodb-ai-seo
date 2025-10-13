/* eslint-disable @typescript-eslint/no-unused-vars */
import 'server-only';
import { AppError, ErrorType } from '@/utils/errors';
import logger from '@/utils/logger';
import { AnalysisJob, ArkheReport } from '@/types/geo';
import { handleServiceError } from '@/utils/errorHandlers';
import { analyzeBusinessModel, analyzeTargetAudience, analyzeCompetitors } from '@/utils/aiAnalyzer';
import { ScrapeResult } from '@/types/analysis';


/**
 * Optimized Arkhe analysis - accepts pre-scraped data instead of re-scraping
 * @param job - The analysis job
 * @param locale - The locale for analysis
 * @param scrapedData - Pre-scraped data from Puppeteer (passed from orchestrator)
 */

export async function runArkheAnalysis(
  job: AnalysisJob,
  scrapedData: ScrapeResult,
  locale: string,
): Promise<ArkheReport | { error: string }> {
  logger.info(`Starting Arkhe analysis for job ${job.id}`, 'arkhe-service', { 
    url: job.url, 
    locale,
    contentLength: scrapedData.content?.length || 0
  });

  try {
    const { html, content, robotsTxt, llmsTxt } = scrapedData;

    // Validate scraped content
    if (!content || content.trim().length < 100) {
      throw new AppError(
        ErrorType.VALIDATION, 
        'Scraped content is insufficient for Arkhe analysis.'
      );
    }

    logger.info(`Arkhe analysis using pre-scraped content (${content.length} chars)`, 'arkhe-service');
    console.log("locale in arkhe", locale);

    const [businessModelResult, targetAudienceResult, competitorsResult] = await Promise.all([
      analyzeBusinessModel(content, locale),
      analyzeTargetAudience(content, locale),
      analyzeCompetitors(content, job.url, locale)
    ]);

    // Validate that at least the combined results exist
    const ok = businessModelResult?.combined && 
               targetAudienceResult?.combined && 
               competitorsResult?.combined;
    
    if (!ok) {
      throw new AppError(
        ErrorType.ANALYSIS_FAILED, 
        'Arkhe analysis encountered AI errors - missing combined results.'
      );
    }

    const report: ArkheReport = {
      businessModel: businessModelResult?.combined,
      targetAudience: targetAudienceResult?.combined,
      competitors: competitorsResult?.combined,
    };

    logger.info(`Arkhe analysis completed successfully for job ${job.id}`, 'arkhe-service', {
      hasBusinessModel: !!report.businessModel,
      hasTargetAudience: !!report.targetAudience,
      hasCompetitors: !!report.competitors
    });

    return report;
  } catch (error) {
    return handleServiceError(error, 'arkhe.runArkheAnalysis');
  }
}
