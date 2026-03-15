import type { CompanyTargetStatus, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// 지원 이력 트래커 — 인터페이스 정의
// T84: 칸반 보드 + JD 매칭
// ─────────────────────────────────────────────

/** 칸반 보드 카드 DTO */
export type BoardCardDto = {
  id: string;
  company: string;
  role: string;
  status: CompanyTargetStatus;
  priority: number;
  summary: string | null;
  tags: string[];
  jobDescriptionMd: string | null;
  appliedAt: Date | null;
  matchScoreJson: unknown;
  eventCount: number;
  updatedAt: Date;
};

/** 칸반 보드 컬럼 */
export type BoardColumnDto = {
  status: CompanyTargetStatus;
  label: string;
  cards: BoardCardDto[];
};

/** 칸반 보드 전체 */
export type BoardDto = {
  columns: BoardColumnDto[];
  totalCount: number;
};

/** 상태 변경 입력 */
export type StatusChangeInput = {
  status: CompanyTargetStatus;
  note?: string | null;
};

/** 이벤트 DTO */
export type ApplicationEventDto = {
  id: string;
  fromStatus: CompanyTargetStatus | null;
  toStatus: CompanyTargetStatus;
  note: string | null;
  createdAt: Date;
};

/** JD 매칭 결과 */
export type JdMatchResult = {
  score: number;
  matchedSkills: string[];
  gaps: string[];
  summary: string;
};

/** JD 매칭 입력 */
export type JdMatchInput = {
  jobDescriptionMd: string;
};

/** 서비스 에러 코드 */
export type JobTrackerServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "NO_JD";

export class JobTrackerServiceError extends Error {
  readonly code: JobTrackerServiceErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(code: JobTrackerServiceErrorCode, status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isJobTrackerServiceError(error: unknown): error is JobTrackerServiceError {
  return error instanceof JobTrackerServiceError;
}

/** Prisma 클라이언트 타입 */
export type JobTrackerServicePrismaClient = Pick<Prisma.TransactionClient, "companyTarget" | "applicationEvent" | "skill" | "experience">;

/** 서비스 인터페이스 */
export interface JobTrackerService {
  /** 칸반 보드 조회 (상태별 그룹핑) */
  getBoardForOwner(ownerId: string): Promise<BoardDto>;

  /** 상태 변경 (이벤트 기록 포함) */
  changeStatus(ownerId: string, targetId: string, input: unknown): Promise<BoardCardDto>;

  /** JD 매칭 실행 */
  runJdMatch(ownerId: string, targetId: string, input?: unknown): Promise<JdMatchResult>;

  /** 이벤트 타임라인 조회 */
  getEventsForTarget(ownerId: string, targetId: string): Promise<ApplicationEventDto[]>;
}
