/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI, GenerativeModel, GenerateContentRequest } from '@google/generative-ai';
import logger from './logger';
import { AppError, ErrorType, ErrorCode, createApiError } from '@/utils/errors';
import { ContentVisibilityResult } from '@/types/content';
import { PROMPTS } from '@/prompts/prompts';
import {
  BusinessModelAnalysis,
  CompetitorAnalysis,
  DelfiAgenda,
  EEATAnalysis,
  TargetAudienceAnalysis,
} from '@/types/analysis';
import { GenerativePerformanceReport } from '@/types/geo';

// API key (support either var)
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Model names (modern 2.5 family)
export const MODEL_NAMES = {
  DEFAULT: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
  PRO_LATEST: 'gemini-2.5-pro',
  VISION: 'gemini-2.5-vision',
};

// Optional grounding tool (when you want Google Search grounding)
const GROUNDING_CONFIG = {
  tools: [{ googleSearchRetrieval: {} }],
};

/** Lazily created client (not strictly required, but handy) */
export const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/** Is Gemini configured? */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

/** Acquire a model instance */
export function getGeminiModel(
  apiKey?: string,
  modelName?: string,
  useGrounding: boolean = true
): GenerativeModel {
  const actualApiKey = apiKey || GEMINI_API_KEY;
  if (!actualApiKey) {
    throw createApiError('Gemini API anahtarı sağlanmadı', {
      userFriendlyMessage: 'Gemini API entegrasyonu yapılandırılmamış.',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(actualApiKey);
    const model = genAI.getGenerativeModel({
      model: modelName || MODEL_NAMES.DEFAULT,
      ...(useGrounding ? { tools: GROUNDING_CONFIG.tools as any } : {}),
    });
    return model;
  } catch (error) {
    logger.error('Gemini model oluşturma hatası', 'gemini-api', error);
    throw createApiError('Gemini API modeli oluşturulamadı', {
      userFriendlyMessage: 'Gemini API servisine bağlanırken bir sorun oluştu.',
    });
  }
}

/** ---------- Robust JSON helpers ---------- */

/** Strip ```json fences (and generic ``` fences) */
function stripFences(s: string): string {
  return s
    .replace(/```json\s*([\s\S]*?)\s*```/gi, '$1')
    .replace(/```\s*([\s\S]*?)\s*```/g, '$1')
    .trim();
}

/**
 * Extract the largest balanced JSON object/array from text.
 * Returns null if none found.
 */
function extractBalancedJson(text: string): string | null {
  const s = stripFences(text);
  let best: { start: number; end: number } | null = null;

  const tryDelim = (open: '{' | '[', close: '}' | ']') => {
    const stack: number[] = [];
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === open) stack.push(i);
      if (ch === close && stack.length) {
        const start = stack.pop()!;
        if (stack.length === 0) {
          best = { start, end: i + 1 }; // prefer the last full balance
        }
      }
    }
  };

  tryDelim('{', '}');
  tryDelim('[', ']');

  if (!best) return null;
  const { start, end } = best;
  return s?.slice(start, end);
}

/** Safe JSON.parse with light repairs */
function safeParse<T>(raw: string): T {
  let s = stripFences(raw);
  const extracted = extractBalancedJson(s);
  if (extracted) s = extracted;

  // very conservative cleanups
  s = s.replace(/\u0000/g, ''); // stray NULs
  s = s.replace(/,\s*([}\]])/g, '$1'); // trailing commas

  return JSON.parse(s) as T;
}

/** Centralized parser with logging */
function parseJsonResponse<T>(text: string, context: string): T {
  try {
    return safeParse<T>(text);
  } catch (error) {
    logger.error('Gemini JSON parse error', context, { error, text });
    throw createApiError('Gemini response could not be parsed.', {
      userFriendlyMessage: 'AI modelinden gelen yanıt işlenemedi.',
      technicalDetails: `Failed to parse JSON from Gemini in ${context}.`,
    });
  }
}

/** ---------- Core request wrapper ---------- */

/**
 * Run a `generateContent` with timeout & consistent error mapping.
 * For JSON endpoints we also set `responseMimeType: "application/json"`.
 */
async function generateContentWithTimeout(
  model: GenerativeModel,
  request: GenerateContentRequest,
  context: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s

  try {
    const result = await model.generateContent(request);
    clearTimeout(timeoutId);
    return result.response.text();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(`Gemini API request timed out in ${context}`, 'gemini-timeout');
      throw createApiError(`Gemini API request timed out in ${context}.`);
    }
    if (error?.message?.includes('API key not valid')) {
      logger.error('Invalid Gemini API key', context, error);
      throw createApiError('Invalid Gemini API key.', {
        userFriendlyMessage: 'Gemini API anahtarı geçersiz veya eksik.',
      });
    }
    logger.error(`Error in ${context}`, 'gemini-api-error', error);
    throw createApiError(`Failed during ${context} with Gemini.`, {
      originalError: error,
    });
  }
}

/** ---------- Public functions ---------- */

export async function checkContentVisibility(
  domain: string,
  query: string,
  options?: {
    model?: string;
    temperature?: number;
    apiKey?: string;
    useGrounding?: boolean;
  },
  locale: string = 'en',
): Promise<ContentVisibilityResult> {
  try {
    logger.info(
      `Gemini ile içerik görünürlüğü kontrolü: ${domain}, Sorgu: "${query}" ${locale}`,
      'gemini-visibility-check'
    );

    const model = getGeminiModel(
      options?.apiKey,
      options?.model || MODEL_NAMES.DEFAULT,
      options?.useGrounding ?? true
    );

    const temperature = options?.temperature ?? 0.3;
    const startTime = Date.now();
    const prompt = PROMPTS.GEMINI.CHECK_VISIBILITY(domain, query, locale);

    // We keep this manual call (not using wrapper) to access grounding metadata.
    const request: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    };

    const result = await model.generateContent(request);
    const response = result.response;
    const text = response.text();

    // Pull grounding info if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map((c: any) => c.web?.title) || [];

    const jsonResponse = parseJsonResponse<any>(text, 'gemini-visibility-check');

    const duration = Date.now() - startTime;
    logger.info('İçerik görünürlüğü kontrolü tamamlandı', 'gemini-visibility-check', {
      domain,
      query,
      duration,
      sources: sources.length,
      domainPresent: jsonResponse.domainPresent,
    });

    return {
      ...jsonResponse,
      sources: [...new Set([...(jsonResponse.sources || []), ...sources])],
      duration,
      groundingMetadata: groundingMetadata || null,
      isVisible: jsonResponse.domainPresent,
      confidence: 0,
      score: 0,
      reasons: [],
      suggestions: [],
    };
  } catch (error: any) {
    const errorDetails = error?.response ? error.response.data : error;
    logger.error('İçerik görünürlüğü kontrolü hatası', 'gemini-visibility-check', errorDetails);

    if (error instanceof AppError) throw error;

    if (error?.response && error.response.status === 400) {
      throw createApiError("Gemini API'sine geçersiz istek gönderildi.", {
        userFriendlyMessage: 'Gemini API isteği oluşturulurken bir yapılandırma sorunu oluştu.',
        errorCode: ErrorCode.API_BAD_REQUEST,
        contextData: errorDetails,
      });
    }

    if (error instanceof Error && error.message.includes('API key not valid')) {
      throw createApiError('Geçersiz Gemini API anahtarı.', {
        userFriendlyMessage:
          'Gemini API anahtarı geçersiz veya eksik. Lütfen Vercel ayarlarınızı kontrol edin.',
      });
    }

    throw createApiError('İçerik görünürlüğü kontrolü başarısız oldu.', {
      contextData: errorDetails,
    });
  }
}

export async function generatePotentialQueries(
  domain: string,
  locale: string = 'en',
  options?: { model?: string; temperature?: number; apiKey?: string; count?: number }
): Promise<any> {
  try {
    logger.info(`Gemini ile potansiyel sorgular oluşturuluyor: ${domain} ${locale}`, 'gemini-api');

    const model = getGeminiModel(options?.apiKey, options?.model || MODEL_NAMES.PRO_LATEST);
    const count = options?.count || 15;
    const prompt = PROMPTS.GEMINI.GENERATE_QUERIES(domain, count, locale);

    const request: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        responseMimeType: 'application/json',
      },
    };

    const text = await generateContentWithTimeout(model, request, 'generatePotentialQueries');
    // Expecting a JSON array
    try {
      const parsed = safeParse<any>(text);
      // If model returned a wrapped object, unwrap best effort
      if (Array.isArray(parsed)) return { queries: parsed };
      if (Array.isArray(parsed?.queries)) return { queries: parsed.queries };
      return { queries: [] };
    } catch (e) {
      logger.warn('Gemini sorgu yanıtı JSON olarak ayrıştırılamadı', 'gemini-api', { response: text });
      return { queries: [], error: 'Sorgu yanıtı işlenemedi.' };
    }
  } catch (error) {
    logger.error('Gemini potansiyel sorgu oluşturma sırasında hata', 'gemini-api', error);
    throw new AppError(ErrorType.API_ERROR, 'Gemini potansiyel sorgu oluşturma sırasında hata');
  }
}


export async function generateText(
  prompt: string,
  options?: { model?: string; temperature?: number; apiKey?: string },
  locale: string = 'en'
): Promise<string> {
  try {
    logger.info('Gemini ile metin oluşturuluyor', 'gemini-generate-text', { promptLength: prompt.length });

    const model = getGeminiModel(options?.apiKey, options?.model || MODEL_NAMES.DEFAULT, false);
    const request: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.5,
        maxOutputTokens: 256,
        // Not enforcing JSON here; it's free-form text.
      },
    };

    const text = await generateContentWithTimeout(model, request, 'generateText');
    logger.info('Gemini ile metin başarıyla oluşturuldu', 'gemini-generate-text');
    return stripFences(text);
  } catch (error: any) {
    logger.error('Gemini metin oluşturma hatası', 'gemini-generate-text', error);
    throw createApiError('Gemini ile metin oluşturulurken bir hata oluştu.', {
      contextData: error,
    });
  }
}

/** --- JSON-returning analyzers (all use responseMimeType) --- */

export async function analyzeBusinessModel(content: string, locale: string = 'en'): Promise<BusinessModelAnalysis> {
  const context = 'gemini-analyzeBusinessModel';
  const model = getGeminiModel(undefined, MODEL_NAMES.DEFAULT, false);
  const prompt = PROMPTS.GEMINI.ANALYZE_BUSINESS_MODEL(content, locale);
  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
  const text = await generateContentWithTimeout(model, request, context);
  return parseJsonResponse<BusinessModelAnalysis>(text, context);
}

export async function analyzeTargetAudience(content: string, locale: string = 'en'): Promise<TargetAudienceAnalysis> {
  const context = 'gemini-analyzeTargetAudience';
  const model = getGeminiModel(undefined, MODEL_NAMES.DEFAULT, false);
  const prompt = PROMPTS.GEMINI.ANALYZE_TARGET_AUDIENCE(content, locale);
  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
  const text = await generateContentWithTimeout(model, request, context);
  return parseJsonResponse<TargetAudienceAnalysis>(text, context);
}

export async function analyzeCompetitors(content: string, url: string, locale: string = 'en'): Promise<CompetitorAnalysis> {
  const context = 'gemini-analyzeCompetitors';
  const model = getGeminiModel(undefined, MODEL_NAMES.DEFAULT, false);
  const prompt = PROMPTS.GEMINI.ANALYZE_COMPETITORS(content, url, locale);
  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
  const text = await generateContentWithTimeout(model, request, context);
  return parseJsonResponse<CompetitorAnalysis>(text, context);
}

export async function analyzeEEATSignals(
  content: string,
  sector: string,
  audience: string,
  locale: string = 'en'
): Promise<EEATAnalysis> {
  const context = 'gemini-analyzeEEATSignals';
  const model = getGeminiModel(undefined, MODEL_NAMES.DEFAULT, false);
  const prompt = PROMPTS.GEMINI.ANALYZE_EEAT_SIGNALS(content, sector, audience, locale);
  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
  const text = await generateContentWithTimeout(model, request, context);
  return parseJsonResponse<EEATAnalysis>(text, context);
}

export async function generateDelfiAgenda(prometheusReport: any, locale: string = 'en'): Promise<DelfiAgenda> {
  const context = 'gemini-generateDelfiAgenda';
  const model = getGeminiModel(undefined, MODEL_NAMES.DEFAULT, false);
  const reportString =
    typeof prometheusReport === 'string' ? prometheusReport : JSON.stringify(prometheusReport, null, 2);
  const prompt = PROMPTS.GEMINI.GENERATE_DELFI_AGENDA(reportString, locale);
  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
  const text = await generateContentWithTimeout(model, request, context);
  return parseJsonResponse<DelfiAgenda>(text, context);
}

export async function generateGenerativePerformanceReport(
  content: string,
  competitors: string[],
  locale: string = 'en'
): Promise<GenerativePerformanceReport> {
  const context = 'gemini-generateGenerativePerformanceReport';
  const model = getGeminiModel(undefined, MODEL_NAMES.DEFAULT, false);
  // Reuse your OpenAI prompt here as noted in your codebase.
  const prompt = PROMPTS.OPENAI.GENERATE_GENERATIVE_PERFORMANCE_REPORT(content, competitors, locale);
  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
  const text = await generateContentWithTimeout(model, request, context);
  return parseJsonResponse<GenerativePerformanceReport>(text, context);
}

export default {
  isGeminiConfigured,
  getGeminiModel,
  checkContentVisibility,
  generatePotentialQueries,
  // generateEnhancedAnalysisReport,
  analyzeBusinessModel,
  analyzeTargetAudience,
  analyzeCompetitors,
  analyzeEEATSignals,
  generateDelfiAgenda,
  generateGenerativePerformanceReport,
  MODEL_NAMES,
  GROUNDING_CONFIG,
};
