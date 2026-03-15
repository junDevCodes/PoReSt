import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// 성장 타임라인 — 인터페이스 정의
// T86: 자동 수집 + 히트맵
// ─────────────────────────────────────────────

/** 성장 이벤트 타입 */
export const GROWTH_EVENT_TYPES = [
  "SKILL_ADDED",
  "PROJECT_CREATED",
  "EXPERIENCE_ADDED",
  "RESUME_CREATED",
  "NOTE_CREATED",
  "JOB_APPLIED",
  "OFFER_RECEIVED",
  "CUSTOM",
] as const;

export type GrowthEventType = (typeof GROWTH_EVENT_TYPES)[number];

/** 이벤트 타입 한국어 라벨 */
export const GROWTH_EVENT_LABELS: Record<GrowthEventType, string> = {
  SKILL_ADDED: "기술 추가",
  PROJECT_CREATED: "프로젝트 생성",
  EXPERIENCE_ADDED: "경력 추가",
  RESUME_CREATED: "이력서 생성",
  NOTE_CREATED: "노트 작성",
  JOB_APPLIED: "지원 완료",
  OFFER_RECEIVED: "오퍼 수령",
  CUSTOM: "기타",
};

/** 성장 이벤트 DTO */
export type GrowthEventDto = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entityId: string | null;
  occurredAt: Date;
  createdAt: Date;
};

/** 일별 활동 카운트 (히트맵 셀) */
export type DailyActivityCount = {
  date: string; // "YYYY-MM-DD"
  count: number;
};

/** 이벤트 타입별 분포 */
export type TypeDistribution = {
  type: string;
  label: string;
  count: number;
};

/** 월별 요약 */
export type MonthlySummary = {
  month: string; // "YYYY-MM"
  count: number;
};

/** 타임라인 전체 데이터 */
export type GrowthTimelineData = {
  totalEvents: number;
  recentEvents: GrowthEventDto[];
  heatmap: DailyActivityCount[];
  typeDistribution: TypeDistribution[];
  monthlySummary: MonthlySummary[];
};

/** 수동 이벤트 입력 */
export type GrowthEventCreateInput = {
  type: string;
  title: string;
  description?: string | null;
  occurredAt: string; // ISO 날짜 문자열
};

/** 자동 수집 결과 */
export type SyncResult = {
  created: number;
  skipped: number;
};

/** 서비스 에러 코드 */
export type GrowthTimelineServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN";

export class GrowthTimelineServiceError extends Error {
  readonly code: GrowthTimelineServiceErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(
    code: GrowthTimelineServiceErrorCode,
    status: number,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isGrowthTimelineServiceError(
  error: unknown,
): error is GrowthTimelineServiceError {
  return error instanceof GrowthTimelineServiceError;
}

/** Prisma 클라이언트 타입 */
export type GrowthTimelineServicePrismaClient = Pick<
  Prisma.TransactionClient,
  | "growthEvent"
  | "skill"
  | "project"
  | "experience"
  | "resume"
  | "note"
  | "companyTarget"
>;

/** 서비스 인터페이스 */
export interface GrowthTimelineService {
  /** 타임라인 조회 (히트맵 + 이벤트 목록) */
  getTimeline(ownerId: string, days?: number): Promise<GrowthTimelineData>;

  /** 수동 이벤트 추가 */
  createEvent(ownerId: string, input: unknown): Promise<GrowthEventDto>;

  /** 이벤트 삭제 */
  deleteEvent(ownerId: string, eventId: string): Promise<void>;

  /** 기존 엔티티에서 자동 수집 */
  syncFromEntities(ownerId: string): Promise<SyncResult>;
}
