// job-tracker 도메인 공용 타입 + 상수
// page.tsx, JobCardDetailModal.tsx에서 공유

export type CompanyTargetStatus =
  | "INTERESTED"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "ARCHIVED";

export type BoardCardDto = {
  id: string;
  company: string;
  role: string;
  status: CompanyTargetStatus;
  priority: number;
  summary: string | null;
  tags: string[];
  jobDescriptionMd: string | null;
  appliedAt: string | null;
  matchScoreJson: JdMatchResult | null;
  eventCount: number;
  updatedAt: string;
};

export type BoardColumnDto = {
  status: CompanyTargetStatus;
  label: string;
  cards: BoardCardDto[];
};

export type BoardDto = {
  columns: BoardColumnDto[];
  totalCount: number;
};

export type ApplicationEventDto = {
  id: string;
  fromStatus: CompanyTargetStatus | null;
  toStatus: CompanyTargetStatus;
  note: string | null;
  createdAt: string;
};

export type JdMatchResult = {
  score: number;
  matchedSkills: string[];
  gaps: string[];
  summary: string;
};

export const STATUS_ORDER: CompanyTargetStatus[] = [
  "INTERESTED",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
  "ARCHIVED",
];

export const STATUS_COLORS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "border-blue-300 bg-blue-50",
  APPLIED: "border-indigo-300 bg-indigo-50",
  INTERVIEWING: "border-amber-300 bg-amber-50",
  OFFER: "border-emerald-300 bg-emerald-50",
  REJECTED: "border-rose-300 bg-rose-50",
  ARCHIVED: "border-gray-300 bg-gray-50",
};

export const STATUS_BADGE_COLORS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "bg-blue-100 text-blue-800",
  APPLIED: "bg-indigo-100 text-indigo-800",
  INTERVIEWING: "bg-amber-100 text-amber-800",
  OFFER: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export const STATUS_LABELS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "관심",
  APPLIED: "지원 완료",
  INTERVIEWING: "면접 진행",
  OFFER: "오퍼 수령",
  REJECTED: "탈락/거절",
  ARCHIVED: "보관",
};

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-blue-700";
  if (score >= 40) return "text-amber-700";
  return "text-rose-700";
}
