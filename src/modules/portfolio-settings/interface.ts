import type { Prisma } from "@prisma/client";

export const MAX_PORTFOLIO_PUBLIC_SLUG_LENGTH = 100;
export const PORTFOLIO_PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// --- Layout types ---

export const LAYOUT_SECTION_IDS = ["projects", "experiences", "skills", "testimonials"] as const;
export type LayoutSectionId = (typeof LAYOUT_SECTION_IDS)[number];

export type LayoutSection = {
  id: LayoutSectionId;
  visible: boolean;
};

export type LayoutConfig = {
  sections: LayoutSection[];
};

export const DEFAULT_LAYOUT: LayoutConfig = {
  sections: [
    { id: "projects", visible: true },
    { id: "experiences", visible: true },
    { id: "skills", visible: true },
    { id: "testimonials", visible: true },
  ],
};

export function parseLayoutConfig(raw: unknown): LayoutConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_LAYOUT;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.sections)) return DEFAULT_LAYOUT;

  const validIds = new Set<string>(LAYOUT_SECTION_IDS);
  const seen = new Set<string>();
  const sections: LayoutSection[] = [];

  for (const item of obj.sections) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const id = s.id;
    if (typeof id !== "string" || !validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    sections.push({ id: id as LayoutSectionId, visible: s.visible !== false });
  }

  // Append any missing sections (backward compat)
  for (const defaultSection of DEFAULT_LAYOUT.sections) {
    if (!seen.has(defaultSection.id)) {
      sections.push(defaultSection);
    }
  }

  return { sections };
}

export type PortfolioSettingsFieldErrors = Record<string, string>;

export type PortfolioLinkInput = {
  label: string;
  url: string;
  order?: number;
  type?: string; // "GITHUB"|"LINKEDIN"|...|"CUSTOM"
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
  email?: string | null;
  isEmailPublic?: boolean;
  location?: string | null;
  availabilityStatus?: string | null; // "OPEN"|"CONSIDERING"|"NOT_OPEN"|"HIDDEN"
  resumeUrl?: string | null;
  featuredResumeId?: string | null;
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
  email: string | null;
  isEmailPublic: boolean;
  location: string | null;
  availabilityStatus: string | null;
  resumeUrl: string | null;
  featuredResumeId: string | null;
  featuredResumeTitle: string | null;
  links: Array<{
    id: string;
    label: string;
    url: string;
    order: number;
    type: string;
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
  "portfolioSettings" | "portfolioLink" | "resume"
>;

export interface PortfolioSettingsService {
  getPortfolioSettingsForOwner(ownerId: string): Promise<OwnerPortfolioSettingsDto | null>;
  upsertPortfolioSettingsForOwner(
    ownerId: string,
    input: unknown,
  ): Promise<OwnerPortfolioSettingsDto>;
}
