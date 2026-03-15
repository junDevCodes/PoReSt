// ─────────────────────────────────────────────
// Gemini 클라이언트 모듈 — 구현
// T80-1: Google Gemini API 래퍼 + graceful fallback
// ─────────────────────────────────────────────

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  GeminiClient,
  GeminiClientConfig,
  GeminiEmbeddingResult,
  GeminiTextGenerationOptions,
  GeminiTextGenerationResult,
} from "@/modules/gemini/interface";
import {
  GeminiClientError,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_TEXT_MODEL,
  DEFAULT_EMBEDDING_DIMENSIONS,
} from "@/modules/gemini/interface";

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const MAX_EMBEDDING_INPUT_LENGTH = 10000;
const MAX_PROMPT_LENGTH = 30000;

function resolveApiKey(config?: GeminiClientConfig): string | undefined {
  return config?.apiKey ?? process.env.GEMINI_API_KEY ?? undefined;
}

function assertConfigured(apiKey: string | undefined): asserts apiKey is string {
  if (!apiKey) {
    throw new GeminiClientError(
      "NOT_CONFIGURED",
      503,
      "GEMINI_API_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.",
    );
  }
}

function validateEmbeddingInput(content: string): void {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new GeminiClientError("INVALID_INPUT", 422, "임베딩 대상 텍스트가 비어 있습니다.");
  }
  if (trimmed.length > MAX_EMBEDDING_INPUT_LENGTH) {
    throw new GeminiClientError(
      "INVALID_INPUT",
      422,
      `임베딩 입력은 ${MAX_EMBEDDING_INPUT_LENGTH}자를 초과할 수 없습니다.`,
    );
  }
}

function validatePromptInput(prompt: string): void {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new GeminiClientError("INVALID_INPUT", 422, "프롬프트가 비어 있습니다.");
  }
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    throw new GeminiClientError(
      "INVALID_INPUT",
      422,
      `프롬프트는 ${MAX_PROMPT_LENGTH}자를 초과할 수 없습니다.`,
    );
  }
}

function wrapApiError(error: unknown): GeminiClientError {
  if (error instanceof GeminiClientError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    return new GeminiClientError("RATE_LIMITED", 429, "Gemini API 호출 한도를 초과했습니다.", true);
  }

  return new GeminiClientError("API_ERROR", 502, `Gemini API 호출 실패: ${message.slice(0, 300)}`, true);
}

/**
 * Gemini 클라이언트 생성
 *
 * @example
 * ```ts
 * const client = createGeminiClient();
 *
 * if (!client.isConfigured()) {
 *   // fallback 로직 실행
 * }
 *
 * const { embedding } = await client.generateEmbedding("텍스트");
 * const { text } = await client.generateText("프롬프트", {
 *   systemPrompt: "당신은 HR 전문가입니다.",
 * });
 * ```
 */
export function createGeminiClient(config?: GeminiClientConfig): GeminiClient {
  const apiKey = resolveApiKey(config);

  return {
    isConfigured(): boolean {
      return !!apiKey;
    },

    async generateEmbedding(content: string): Promise<GeminiEmbeddingResult> {
      assertConfigured(apiKey);
      validateEmbeddingInput(content);

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: DEFAULT_EMBEDDING_MODEL });
        const result = await model.embedContent(content.trim());
        const values = result.embedding.values;

        if (!values || values.length === 0) {
          throw new GeminiClientError("EMPTY_RESPONSE", 502, "Gemini 임베딩 응답이 비어 있습니다.");
        }

        return {
          embedding: values,
          dimensions: values.length,
        };
      } catch (error) {
        throw wrapApiError(error);
      }
    },

    async generateText(
      prompt: string,
      options?: GeminiTextGenerationOptions,
    ): Promise<GeminiTextGenerationResult> {
      assertConfigured(apiKey);
      validatePromptInput(prompt);

      const modelName = options?.model ?? DEFAULT_TEXT_MODEL;
      const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
      const maxOutputTokens = options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: options?.systemPrompt ?? undefined,
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        });

        const result = await model.generateContent(prompt.trim());
        const response = result.response;
        const text = response.text();

        if (!text || !text.trim()) {
          throw new GeminiClientError("EMPTY_RESPONSE", 502, "Gemini 텍스트 생성 응답이 비어 있습니다.");
        }

        return {
          text: text.trim(),
          model: modelName,
          tokenCount: response.usageMetadata?.totalTokenCount ?? undefined,
        };
      } catch (error) {
        throw wrapApiError(error);
      }
    },
  };
}

/** 싱글턴 인스턴스 (환경변수 기반) */
let _defaultClient: GeminiClient | null = null;

/** 기본 Gemini 클라이언트 (환경변수에서 API 키 자동 로드) */
export function getDefaultGeminiClient(): GeminiClient {
  if (!_defaultClient) {
    _defaultClient = createGeminiClient();
  }
  return _defaultClient;
}

/** 테스트용: 싱글턴 초기화 */
export function resetDefaultGeminiClient(): void {
  _defaultClient = null;
}

/**
 * Gemini 사용 가능 여부에 따라 AI/fallback 분기 헬퍼
 *
 * @example
 * ```ts
 * const embedding = await withGeminiFallback(
 *   client,
 *   () => client.generateEmbedding(content),
 *   () => buildDeterministicEmbeddingVector(content),
 * );
 * ```
 */
export async function withGeminiFallback<T>(
  client: GeminiClient,
  aiPath: () => Promise<T>,
  fallbackPath: () => T | Promise<T>,
): Promise<{ result: T; source: "gemini" | "fallback" }> {
  if (!client.isConfigured()) {
    const result = await fallbackPath();
    return { result, source: "fallback" };
  }

  try {
    const result = await aiPath();
    return { result, source: "gemini" };
  } catch (error) {
    if (error instanceof GeminiClientError && !error.retryable) {
      throw error;
    }
    console.warn("Gemini API 호출 실패, fallback 경로 사용:", error instanceof Error ? error.message : error);
    const result = await fallbackPath();
    return { result, source: "fallback" };
  }
}

export { DEFAULT_EMBEDDING_DIMENSIONS };
