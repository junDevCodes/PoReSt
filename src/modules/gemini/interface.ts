// ─────────────────────────────────────────────
// Gemini 클라이언트 모듈 — 인터페이스 정의
// T80-1: AI 기능 기반 모듈 (임베딩 + 텍스트 생성)
// ─────────────────────────────────────────────

/** 임베딩 생성 결과 */
export type GeminiEmbeddingResult = {
  embedding: number[];
  dimensions: number;
};

/** 텍스트 생성 옵션 */
export type GeminiTextGenerationOptions = {
  /** 모델 ID (기본값: gemini-2.0-flash) */
  model?: string;
  /** 시스템 프롬프트 (페르소나 설정) */
  systemPrompt?: string;
  /** 생성 온도 (0~2, 기본값: 0.7) */
  temperature?: number;
  /** 최대 출력 토큰 수 (기본값: 2048) */
  maxOutputTokens?: number;
};

/** 텍스트 생성 결과 */
export type GeminiTextGenerationResult = {
  text: string;
  model: string;
  tokenCount?: number;
};

/** Gemini 클라이언트 설정 */
export type GeminiClientConfig = {
  apiKey?: string;
};

/** 에러 코드 */
export type GeminiClientErrorCode =
  | "NOT_CONFIGURED"
  | "API_ERROR"
  | "RATE_LIMITED"
  | "INVALID_INPUT"
  | "EMPTY_RESPONSE";

/** Gemini 클라이언트 에러 */
export class GeminiClientError extends Error {
  readonly code: GeminiClientErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(code: GeminiClientErrorCode, status: number, message: string, retryable = false) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function isGeminiClientError(error: unknown): error is GeminiClientError {
  return error instanceof GeminiClientError;
}

/** Gemini 클라이언트 인터페이스 */
export interface GeminiClient {
  /** API 키 설정 여부 확인 */
  isConfigured(): boolean;

  /** 텍스트 임베딩 생성 (text-embedding-004, 1536차원) */
  generateEmbedding(content: string): Promise<GeminiEmbeddingResult>;

  /** LLM 텍스트 생성 (gemini-2.0-flash 기본) */
  generateText(prompt: string, options?: GeminiTextGenerationOptions): Promise<GeminiTextGenerationResult>;
}

/** 기본 임베딩 모델 */
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-004";

/** 기본 텍스트 생성 모델 */
export const DEFAULT_TEXT_MODEL = "gemini-2.0-flash";

/** 기본 임베딩 차원 수 (NoteEmbedding 호환) */
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
