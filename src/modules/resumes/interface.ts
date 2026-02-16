import type { Prisma, ResumeStatus } from "@prisma/client";

export type ResumeCreateInput = {
  status?: ResumeStatus;
  title: string;
  targetCompany?: string | null;
  targetRole?: string | null;
  level?: string | null;
  summaryMd?: string | null;
};

export type ResumeUpdateInput = Partial<ResumeCreateInput>;

export type ResumeItemCreateInput = {
  experienceId: string;
  sortOrder?: number;
  overrideBulletsJson?: Prisma.InputJsonValue | null;
  overrideMetricsJson?: Prisma.InputJsonValue | null;
  overrideTechTags?: string[];
  notes?: string | null;
};

export type ResumeItemUpdateInput = Partial<ResumeItemCreateInput>;

export type ResumeShareLinkCreateInput = {
  expiresAt?: Date | null;
};

export type OwnerResumeListItemDto = {
  id: string;
  status: ResumeStatus;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  level: string | null;
  itemCount: number;
  updatedAt: Date;
};

export type OwnerResumeItemDto = {
  id: string;
  resumeId: string;
  experienceId: string;
  sortOrder: number;
  overrideBulletsJson: unknown;
  overrideMetricsJson: unknown;
  overrideTechTags: string[];
  notes: string | null;
  updatedAt: Date;
  experience: {
    id: string;
    company: string;
    role: string;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    summary: string | null;
    bulletsJson: unknown;
    metricsJson: unknown;
    techTags: string[];
    updatedAt: Date;
  };
};

export type OwnerResumeDetailDto = {
  id: string;
  status: ResumeStatus;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  level: string | null;
  summaryMd: string | null;
  updatedAt: Date;
  items: OwnerResumeItemDto[];
};

export type ResumePreviewDto = {
  resume: {
    id: string;
    title: string;
    targetCompany: string | null;
    targetRole: string | null;
    level: string | null;
    summaryMd: string | null;
    updatedAt: Date;
  };
  items: Array<{
    itemId: string;
    sortOrder: number;
    notes: string | null;
    experience: OwnerResumeItemDto["experience"];
    resolvedBulletsJson: unknown;
    resolvedMetricsJson: unknown;
    resolvedTechTags: string[];
  }>;
};

export type OwnerResumeShareLinkDto = {
  id: string;
  token: string;
  expiresAt: Date | null;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeFieldErrors = Record<string, string>;

export type ResumeServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN";

export class ResumeServiceError extends Error {
  readonly code: ResumeServiceErrorCode;
  readonly status: number;
  readonly fields?: ResumeFieldErrors;

  constructor(code: ResumeServiceErrorCode, status: number, message: string, fields?: ResumeFieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isResumeServiceError(error: unknown): error is ResumeServiceError {
  return error instanceof ResumeServiceError;
}

export type ResumeServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "resume" | "resumeItem" | "experience" | "resumeShareLink"
>;

export interface ResumesService {
  listResumesForOwner(ownerId: string): Promise<OwnerResumeListItemDto[]>;
  getResumeForOwner(ownerId: string, resumeId: string): Promise<OwnerResumeDetailDto>;
  createResume(ownerId: string, input: unknown): Promise<OwnerResumeDetailDto>;
  updateResume(ownerId: string, resumeId: string, input: unknown): Promise<OwnerResumeDetailDto>;
  deleteResume(ownerId: string, resumeId: string): Promise<{ id: string }>;
  listResumeItemsForOwner(ownerId: string, resumeId: string): Promise<OwnerResumeItemDto[]>;
  createResumeItem(ownerId: string, resumeId: string, input: unknown): Promise<OwnerResumeItemDto>;
  updateResumeItem(
    ownerId: string,
    resumeId: string,
    itemId: string,
    input: unknown,
  ): Promise<OwnerResumeItemDto>;
  deleteResumeItem(ownerId: string, resumeId: string, itemId: string): Promise<{ id: string }>;
  getResumePreviewForOwner(ownerId: string, resumeId: string): Promise<ResumePreviewDto>;
  listResumeShareLinksForOwner(ownerId: string, resumeId: string): Promise<OwnerResumeShareLinkDto[]>;
  createResumeShareLink(
    ownerId: string,
    resumeId: string,
    input: unknown,
  ): Promise<OwnerResumeShareLinkDto>;
  revokeResumeShareLink(ownerId: string, resumeId: string, shareLinkId: string): Promise<{ id: string }>;
  getResumePreviewByShareToken(token: string): Promise<ResumePreviewDto>;
}
