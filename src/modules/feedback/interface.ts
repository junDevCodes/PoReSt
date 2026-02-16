import type { FeedbackTargetType, Prisma } from "@prisma/client";

export type FeedbackRequestCreateInput = {
  targetType: FeedbackTargetType;
  targetId: string;
  contextJson?: Prisma.InputJsonValue | null;
  optionsJson?: Prisma.InputJsonValue | null;
};

export type FeedbackCompareInput = {
  currentRequestId: string;
  previousRequestId: string;
};

export type FeedbackTargetDto = {
  id: string;
  type: FeedbackTargetType;
  title: string;
  updatedAt: Date;
};

export type OwnerFeedbackRequestListItemDto = {
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  status: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type OwnerFeedbackItemDto = {
  id: string;
  requestId: string;
  severity: string;
  title: string;
  message: string;
  suggestion: string | null;
  evidenceJson: unknown;
  pointerJson: unknown;
  createdAt: Date;
};

export type OwnerFeedbackRequestDetailDto = {
  id: string;
  ownerId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  contextJson: unknown;
  optionsJson: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: OwnerFeedbackItemDto[];
};

export type FeedbackCompareResultDto = {
  currentRequestId: string;
  previousRequestId: string;
  added: OwnerFeedbackItemDto[];
  resolved: OwnerFeedbackItemDto[];
  unchanged: OwnerFeedbackItemDto[];
  summary: {
    added: number;
    resolved: number;
    unchanged: number;
  };
};

export type FeedbackFieldErrors = Record<string, string>;

export type FeedbackServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN";

export class FeedbackServiceError extends Error {
  readonly code: FeedbackServiceErrorCode;
  readonly status: number;
  readonly fields?: FeedbackFieldErrors;

  constructor(code: FeedbackServiceErrorCode, status: number, message: string, fields?: FeedbackFieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isFeedbackServiceError(error: unknown): error is FeedbackServiceError {
  return error instanceof FeedbackServiceError;
}

export type FeedbackServicePrismaClient = Pick<
  Prisma.TransactionClient,
  | "feedbackRequest"
  | "feedbackItem"
  | "portfolioSettings"
  | "project"
  | "experience"
  | "resume"
  | "resumeItem"
  | "note"
  | "blogPost"
>;

export interface FeedbackService {
  listFeedbackTargetsForOwner(ownerId: string, targetType: FeedbackTargetType): Promise<FeedbackTargetDto[]>;
  listFeedbackRequestsForOwner(ownerId: string): Promise<OwnerFeedbackRequestListItemDto[]>;
  getFeedbackRequestForOwner(ownerId: string, requestId: string): Promise<OwnerFeedbackRequestDetailDto>;
  createFeedbackRequest(ownerId: string, input: unknown): Promise<OwnerFeedbackRequestDetailDto>;
  runFeedbackRequestForOwner(ownerId: string, requestId: string): Promise<OwnerFeedbackRequestDetailDto>;
  compareFeedbackRequestsForOwner(ownerId: string, input: unknown): Promise<FeedbackCompareResultDto>;
}
