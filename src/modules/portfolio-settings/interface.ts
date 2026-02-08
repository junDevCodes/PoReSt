import type { Prisma } from "@prisma/client";

export const MAX_PORTFOLIO_PUBLIC_SLUG_LENGTH = 100;
export const PORTFOLIO_PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PortfolioSettingsFieldErrors = Record<string, string>;

export type PortfolioLinkInput = {
  label: string;
  url: string;
  order?: number;
};

export type PortfolioSettingsUpsertInput = {
  publicSlug?: string;
  isPublic?: boolean;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  layoutJson?: Prisma.InputJsonValue | null;
  links?: PortfolioLinkInput[];
};

export type OwnerPortfolioSettingsDto = {
  id: string;
  publicSlug: string;
  isPublic: boolean;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  layoutJson: unknown;
  links: Array<{
    id: string;
    label: string;
    url: string;
    order: number;
  }>;
  updatedAt: Date;
};

export type PortfolioSettingsServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT";

export class PortfolioSettingsServiceError extends Error {
  readonly code: PortfolioSettingsServiceErrorCode;
  readonly status: number;
  readonly fields?: PortfolioSettingsFieldErrors;

  constructor(
    code: PortfolioSettingsServiceErrorCode,
    status: number,
    message: string,
    fields?: PortfolioSettingsFieldErrors,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isPortfolioSettingsServiceError(
  error: unknown,
): error is PortfolioSettingsServiceError {
  return error instanceof PortfolioSettingsServiceError;
}

export type PortfolioSettingsServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "portfolioSettings" | "portfolioLink"
>;

export interface PortfolioSettingsService {
  getPortfolioSettingsForOwner(ownerId: string): Promise<OwnerPortfolioSettingsDto | null>;
  upsertPortfolioSettingsForOwner(
    ownerId: string,
    input: unknown,
  ): Promise<OwnerPortfolioSettingsDto>;
}
