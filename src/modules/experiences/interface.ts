import type { Prisma, Visibility } from "@prisma/client";

export type ExperienceCreateInput = {
  visibility?: Visibility;
  isFeatured?: boolean;
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date | null;
  isCurrent?: boolean;
  summary?: string | null;
  bulletsJson?: Prisma.InputJsonValue | null;
  metricsJson?: Prisma.InputJsonValue | null;
  techTags?: string[];
  order?: number;
};

export type ExperienceUpdateInput = Partial<ExperienceCreateInput>;

export type OwnerExperienceDto = {
  id: string;
  visibility: Visibility;
  isFeatured: boolean;
  company: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  summary: string | null;
  bulletsJson: unknown;
  metricsJson: unknown;
  techTags: string[];
  order: number;
  updatedAt: Date;
};

export type ExperienceFieldErrors = Record<string, string>;

export type ExperienceServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN";

export class ExperienceServiceError extends Error {
  readonly code: ExperienceServiceErrorCode;
  readonly status: number;
  readonly fields?: ExperienceFieldErrors;

  constructor(
    code: ExperienceServiceErrorCode,
    status: number,
    message: string,
    fields?: ExperienceFieldErrors,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isExperienceServiceError(error: unknown): error is ExperienceServiceError {
  return error instanceof ExperienceServiceError;
}

export type ExperienceServicePrismaClient = Pick<Prisma.TransactionClient, "experience">;

export interface ExperiencesService {
  listExperiencesForOwner(ownerId: string): Promise<OwnerExperienceDto[]>;
  createExperience(ownerId: string, input: unknown): Promise<OwnerExperienceDto>;
  updateExperience(
    ownerId: string,
    experienceId: string,
    input: unknown,
  ): Promise<OwnerExperienceDto>;
  deleteExperience(ownerId: string, experienceId: string): Promise<{ id: string }>;
}
