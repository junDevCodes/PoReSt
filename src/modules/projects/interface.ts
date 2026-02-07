import type { Prisma, Visibility } from "@prisma/client";

export const MAX_PROJECT_SLUG_LENGTH = 100;
export const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type FieldErrors = Record<string, string>;

export type ProjectCreateInput = {
  slug?: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  contentMd: string;
  techStack?: string[];
  repoUrl?: string | null;
  demoUrl?: string | null;
  thumbnailUrl?: string | null;
  visibility?: Visibility;
  isFeatured?: boolean;
  order?: number;
  highlightsJson?: Prisma.InputJsonValue | null;
};

export type ProjectUpdateInput = Partial<ProjectCreateInput>;

export type OwnerProjectDto = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  contentMd: string;
  techStack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  thumbnailUrl: string | null;
  visibility: Visibility;
  isFeatured: boolean;
  order: number;
  highlightsJson: unknown;
  updatedAt: Date;
};

export type PublicProjectListItemDto = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  techStack: string[];
  thumbnailUrl: string | null;
  updatedAt: Date;
};

export type PublicProjectDetailDto = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  contentMd: string;
  techStack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  highlightsJson: unknown;
  updatedAt: Date;
};

export type PublicPortfolioProfileDto = {
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  links: Array<{
    label: string;
    url: string;
  }>;
};

export type PublicPortfolioDto = {
  profile: PublicPortfolioProfileDto | null;
  featuredProjects: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    techStack: string[];
    repoUrl: string | null;
    demoUrl: string | null;
    thumbnailUrl: string | null;
  }>;
  featuredExperiences: Array<{
    id: string;
    company: string;
    role: string;
    startDate: Date;
    endDate: Date | null;
    summary: string | null;
  }>;
};

export type ProjectServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN";

export class ProjectServiceError extends Error {
  readonly code: ProjectServiceErrorCode;
  readonly status: number;
  readonly fields?: FieldErrors;

  constructor(code: ProjectServiceErrorCode, status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isProjectServiceError(error: unknown): error is ProjectServiceError {
  return error instanceof ProjectServiceError;
}

export type ProjectServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "project" | "portfolioSettings" | "experience"
>;

export interface ProjectsService {
  listProjectsForOwner(ownerId: string): Promise<OwnerProjectDto[]>;
  getProjectForOwner(ownerId: string, projectId: string): Promise<OwnerProjectDto>;
  createProject(ownerId: string, input: unknown): Promise<OwnerProjectDto>;
  updateProject(ownerId: string, projectId: string, input: unknown): Promise<OwnerProjectDto>;
  deleteProject(ownerId: string, projectId: string): Promise<{ id: string }>;
  listPublicProjects(): Promise<PublicProjectListItemDto[]>;
  getPublicProjectBySlug(slug: string): Promise<PublicProjectDetailDto>;
  getPublicPortfolio(slug?: string): Promise<PublicPortfolioDto>;
}
