// ─────────────────────────────────────────────
// 자기소개서 모듈 — 인터페이스 정의
// T97: 합격 자소서 RAG 파이프라인
// ─────────────────────────────────────────────

import type { CoverLetterStatus, Prisma } from "@prisma/client";

// ── DTO ──

export type CoverLetterCreateInput = {
  title: string;
  targetCompany?: string | null;
  targetRole?: string | null;
  contentMd: string;
  status?: CoverLetterStatus;
  isReference?: boolean;
  resumeId?: string | null;
  experienceId?: string | null;
};

export type CoverLetterUpdateInput = Partial<CoverLetterCreateInput>;

export type OwnerCoverLetterListItemDto = {
  id: string;
  status: CoverLetterStatus;
  isReference: boolean;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  updatedAt: Date;
};

export type OwnerCoverLetterDetailDto = {
  id: string;
  status: CoverLetterStatus;
  isReference: boolean;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  contentMd: string;
  resumeId: string | null;
  experienceId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── 생성 요청 (RAG 기반) ──

export type CoverLetterGenerateInput = {
  targetCompany: string;
  targetRole: string;
  jobDescription?: string | null;
  motivationHint?: string | null;
};

export type CoverLetterGenerateResult = {
  coverLetter: OwnerCoverLetterDetailDto;
  source: "gemini" | "fallback";
};

// ── 에러 ──

export type CoverLetterFieldErrors = Record<string, string>;

export type CoverLetterServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN";

export class CoverLetterServiceError extends Error {
  readonly code: CoverLetterServiceErrorCode;
  readonly status: number;
  readonly fields?: CoverLetterFieldErrors;

  constructor(
    code: CoverLetterServiceErrorCode,
    status: number,
    message: string,
    fields?: CoverLetterFieldErrors,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isCoverLetterServiceError(
  error: unknown,
): error is CoverLetterServiceError {
  return error instanceof CoverLetterServiceError;
}

// ── 서비스 인터페이스 ──

export type CoverLetterServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "coverLetter" | "coverLetterEmbedding" | "experience" | "skill" | "$queryRaw" | "$executeRawUnsafe"
>;

export interface CoverLettersService {
  listForOwner(ownerId: string): Promise<OwnerCoverLetterListItemDto[]>;
  getForOwner(ownerId: string, id: string): Promise<OwnerCoverLetterDetailDto>;
  create(ownerId: string, input: unknown): Promise<OwnerCoverLetterDetailDto>;
  update(
    ownerId: string,
    id: string,
    input: unknown,
  ): Promise<OwnerCoverLetterDetailDto>;
  delete(ownerId: string, id: string): Promise<{ id: string }>;
  toggleReference(
    ownerId: string,
    id: string,
  ): Promise<OwnerCoverLetterDetailDto>;
}
