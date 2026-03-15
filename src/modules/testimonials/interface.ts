import type { Prisma, TestimonialStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// 추천서/동료 평가 — 인터페이스 정의
// T85: 공유 링크 → 비로그인 작성 → 승인 후 공개
// ─────────────────────────────────────────────

/** 소유자 뷰 DTO */
export type TestimonialDto = {
  id: string;
  authorName: string | null;
  authorTitle: string | null;
  authorCompany: string | null;
  authorEmail: string | null;
  relationship: string | null;
  content: string | null;
  rating: number | null;
  status: TestimonialStatus;
  shareToken: string;
  isPublic: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

/** 공개 포트폴리오용 DTO */
export type PublicTestimonialDto = {
  id: string;
  authorName: string;
  authorTitle: string | null;
  authorCompany: string | null;
  relationship: string | null;
  content: string;
  rating: number | null;
};

/** 공유 링크 접근 시 DTO (작성 폼용) */
export type ShareTokenInfoDto = {
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  status: TestimonialStatus;
  authorName: string | null;
};

/** 추천서 요청 생성 입력 */
export type TestimonialCreateInput = {
  authorName?: string | null;
  authorEmail?: string | null;
  relationship?: string | null;
};

/** 소유자 업데이트 입력 (승인/거절/공개 설정) */
export type TestimonialUpdateInput = {
  status?: TestimonialStatus;
  isPublic?: boolean;
  displayOrder?: number;
};

/** 외부 작성자 제출 입력 */
export type TestimonialSubmitInput = {
  authorName: string;
  authorTitle?: string | null;
  authorCompany?: string | null;
  authorEmail?: string | null;
  relationship?: string | null;
  content: string;
  rating?: number | null;
};

/** 서비스 에러 코드 */
export type TestimonialServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "ALREADY_SUBMITTED"
  | "CONFLICT";

export class TestimonialServiceError extends Error {
  readonly code: TestimonialServiceErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(code: TestimonialServiceErrorCode, status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isTestimonialServiceError(error: unknown): error is TestimonialServiceError {
  return error instanceof TestimonialServiceError;
}

/** Prisma 클라이언트 타입 */
export type TestimonialServicePrismaClient = Pick<Prisma.TransactionClient, "testimonial" | "portfolioSettings">;

/** 서비스 인터페이스 */
export interface TestimonialService {
  /** 소유자의 추천서 목록 조회 */
  listForOwner(ownerId: string): Promise<TestimonialDto[]>;

  /** 추천서 요청 생성 (공유 링크 발급) */
  createRequest(ownerId: string, input: unknown): Promise<TestimonialDto>;

  /** 추천서 업데이트 (승인/거절/공개 설정) */
  updateForOwner(ownerId: string, testimonialId: string, input: unknown): Promise<TestimonialDto>;

  /** 추천서 삭제 */
  deleteForOwner(ownerId: string, testimonialId: string): Promise<void>;

  /** 공유 토큰으로 추천서 정보 조회 (작성 폼용) */
  getByShareToken(token: string): Promise<ShareTokenInfoDto>;

  /** 외부 작성자가 추천서 제출 */
  submitByShareToken(token: string, input: unknown): Promise<void>;

  /** 공개 포트폴리오용 승인된 추천서 목록 */
  listPublicBySlug(publicSlug: string): Promise<PublicTestimonialDto[]>;
}
