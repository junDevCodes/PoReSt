import type { DomainLinkEntityType, Prisma } from "@prisma/client";

export type FieldErrors = Record<string, string>;

export type DomainLinkCreateInput = {
  sourceType: DomainLinkEntityType;
  sourceId: string;
  targetType: DomainLinkEntityType;
  targetId: string;
  context?: string | null;
};

export type DomainLinkListQuery = {
  sourceType?: DomainLinkEntityType;
  sourceId?: string;
  targetType?: DomainLinkEntityType;
  targetId?: string;
  limit?: number;
};

export type OwnerDomainLinkDto = {
  id: string;
  ownerId: string;
  sourceType: DomainLinkEntityType;
  sourceId: string;
  targetType: DomainLinkEntityType;
  targetId: string;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DomainLinkServiceErrorCode =
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "NOT_FOUND"
  | "FORBIDDEN";

export class DomainLinkServiceError extends Error {
  readonly code: DomainLinkServiceErrorCode;
  readonly status: number;
  readonly fields?: FieldErrors;

  constructor(code: DomainLinkServiceErrorCode, status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isDomainLinkServiceError(error: unknown): error is DomainLinkServiceError {
  return error instanceof DomainLinkServiceError;
}

export type DomainLinkServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "domainLink" | "project" | "experience" | "resume" | "note" | "blogPost"
>;

export interface DomainLinksService {
  listLinksForOwner(ownerId: string, query?: unknown): Promise<OwnerDomainLinkDto[]>;
  createLinkForOwner(ownerId: string, input: unknown): Promise<OwnerDomainLinkDto>;
  deleteLinkForOwner(ownerId: string, linkId: string): Promise<{ id: string }>;
}

