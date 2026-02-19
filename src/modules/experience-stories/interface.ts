import type { Prisma } from "@prisma/client";

export type ExperienceStoryCreateInput = {
  experienceId: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags?: string[];
  metricsJson?: Prisma.InputJsonValue | null;
  linksJson?: Prisma.InputJsonValue | null;
};

export type ExperienceStoryUpdateInput = Partial<Omit<ExperienceStoryCreateInput, "experienceId">>;

export type ExperienceStoriesCursorPayload = {
  updatedAt: string;
  id: string;
};

export type ExperienceStoriesListQuery = {
  experienceId?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

export type OwnerExperienceStoryDto = {
  id: string;
  experienceId: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  metricsJson: unknown;
  linksJson: unknown;
  updatedAt: Date;
};

export type ExperienceStoriesListResult = {
  items: OwnerExperienceStoryDto[];
  nextCursor: string | null;
};

export type ExperienceStoryFieldErrors = Record<string, string>;

export type ExperienceStoryServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT";

export class ExperienceStoryServiceError extends Error {
  readonly code: ExperienceStoryServiceErrorCode;
  readonly status: number;
  readonly fields?: ExperienceStoryFieldErrors;

  constructor(
    code: ExperienceStoryServiceErrorCode,
    status: number,
    message: string,
    fields?: ExperienceStoryFieldErrors,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isExperienceStoryServiceError(
  error: unknown,
): error is ExperienceStoryServiceError {
  return error instanceof ExperienceStoryServiceError;
}

export type ExperienceStoriesServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "experienceStory" | "experience"
>;

export interface ExperienceStoriesService {
  listStoriesForOwner(
    ownerId: string,
    query: unknown,
  ): Promise<ExperienceStoriesListResult>;
  createStory(ownerId: string, input: unknown): Promise<OwnerExperienceStoryDto>;
  getStoryForOwner(ownerId: string, storyId: string): Promise<OwnerExperienceStoryDto>;
  updateStory(
    ownerId: string,
    storyId: string,
    input: unknown,
  ): Promise<OwnerExperienceStoryDto>;
  deleteStory(ownerId: string, storyId: string): Promise<{ id: string }>;
}

