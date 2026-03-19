// ─────────────────────────────────────────────
// 자기소개서 임베딩 모듈 — 인터페이스 정의
// T97: 합격 자소서 RAG 파이프라인
// ─────────────────────────────────────────────

import type { Prisma } from "@prisma/client";

// ── DTO ──

export type CoverLetterEmbeddingRunResult = {
  scheduled: number;
  succeeded: number;
  failed: number;
  coverLetterIds: string[];
};

export type SimilarCoverLetterDto = {
  coverLetterId: string;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  contentMd: string;
  score: number;
};

export type CoverLetterEmbeddingSimilarSearchInput = {
  limit?: number;
  minScore?: number;
};

// ── 에러 ──

export type CoverLetterEmbeddingFieldErrors = Record<string, string>;

export type CoverLetterEmbeddingServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class CoverLetterEmbeddingServiceError extends Error {
  readonly code: CoverLetterEmbeddingServiceErrorCode;
  readonly status: number;
  readonly fields?: CoverLetterEmbeddingFieldErrors;

  constructor(
    code: CoverLetterEmbeddingServiceErrorCode,
    status: number,
    message: string,
    fields?: CoverLetterEmbeddingFieldErrors,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isCoverLetterEmbeddingServiceError(
  error: unknown,
): error is CoverLetterEmbeddingServiceError {
  return error instanceof CoverLetterEmbeddingServiceError;
}

// ── 서비스 인터페이스 ──

export type CoverLetterEmbeddingPrismaClient = Pick<
  Prisma.TransactionClient,
  "coverLetter" | "coverLetterEmbedding" | "$executeRawUnsafe" | "$queryRaw"
>;

export interface CoverLetterEmbeddingPipelineService {
  /** 소유자의 합격 자소서(isReference=true) 전체 임베딩 재빌드 */
  rebuildForOwner(ownerId: string): Promise<CoverLetterEmbeddingRunResult>;

  /** 단일 자기소개서 임베딩 생성 */
  embedSingle(
    ownerId: string,
    coverLetterId: string,
  ): Promise<CoverLetterEmbeddingRunResult>;

  /** 쿼리 텍스트 기반 유사 합격 자소서 검색 (RAG 검색) */
  searchSimilarByQuery(
    ownerId: string,
    queryText: string,
    input?: CoverLetterEmbeddingSimilarSearchInput,
  ): Promise<SimilarCoverLetterDto[]>;
}
