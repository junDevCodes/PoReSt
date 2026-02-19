import type { CompanyTargetStatus, Prisma } from "@prisma/client";

export type CompanyTargetCreateInput = {
  company: string;
  role: string;
  status?: CompanyTargetStatus;
  priority?: number;
  summary?: string | null;
  analysisMd?: string | null;
  linksJson?: Prisma.InputJsonValue | null;
  tags?: string[];
};

export type CompanyTargetUpdateInput = Partial<CompanyTargetCreateInput>;

export type CompanyTargetsCursorPayload = {
  updatedAt: string;
  id: string;
};

export type CompanyTargetsListQuery = {
  status?: CompanyTargetStatus;
  q?: string;
  limit?: number;
  cursor?: string;
};

export type OwnerCompanyTargetDto = {
  id: string;
  company: string;
  role: string;
  status: CompanyTargetStatus;
  priority: number;
  summary: string | null;
  analysisMd: string | null;
  linksJson: unknown;
  tags: string[];
  updatedAt: Date;
};

export type CompanyTargetsListResult = {
  items: OwnerCompanyTargetDto[];
  nextCursor: string | null;
};

export type CompanyTargetFieldErrors = Record<string, string>;

export type CompanyTargetServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT";

export class CompanyTargetServiceError extends Error {
  readonly code: CompanyTargetServiceErrorCode;
  readonly status: number;
  readonly fields?: CompanyTargetFieldErrors;

  constructor(code: CompanyTargetServiceErrorCode, status: number, message: string, fields?: CompanyTargetFieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isCompanyTargetServiceError(error: unknown): error is CompanyTargetServiceError {
  return error instanceof CompanyTargetServiceError;
}

export type CompanyTargetsServicePrismaClient = Pick<Prisma.TransactionClient, "companyTarget">;

export interface CompanyTargetsService {
  listTargetsForOwner(ownerId: string, query: unknown): Promise<CompanyTargetsListResult>;
  createTarget(ownerId: string, input: unknown): Promise<OwnerCompanyTargetDto>;
  getTargetForOwner(ownerId: string, targetId: string): Promise<OwnerCompanyTargetDto>;
  updateTarget(ownerId: string, targetId: string, input: unknown): Promise<OwnerCompanyTargetDto>;
  deleteTarget(ownerId: string, targetId: string): Promise<{ id: string }>;
}

