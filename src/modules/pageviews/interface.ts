import type { Prisma } from "@prisma/client";

export type PageViewCreateInput = {
  publicSlug: string;
  pageType: string;
  pageSlug?: string | null;
  referrer?: string | null;
};

export type PageViewDto = {
  id: string;
  pageType: string;
  pageSlug: string | null;
  referrer: string | null;
  createdAt: Date;
};

export type AnalyticsSummary = {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
};

export type DailyViewCount = {
  date: string; // "YYYY-MM-DD"
  count: number;
};

export type PageTypeCount = {
  pageType: string;
  count: number;
};

export type ReferrerCount = {
  referrer: string;
  count: number;
};

export type AnalyticsData = {
  summary: AnalyticsSummary;
  dailyViews: DailyViewCount[];
  pageTypeBreakdown: PageTypeCount[];
  topReferrers: ReferrerCount[];
  recentViews: PageViewDto[];
};

export type PageViewServiceErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED";

export class PageViewServiceError extends Error {
  readonly code: PageViewServiceErrorCode;
  readonly status: number;

  constructor(code: PageViewServiceErrorCode, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function isPageViewServiceError(
  error: unknown,
): error is PageViewServiceError {
  return error instanceof PageViewServiceError;
}

export type PageViewServicePrismaClient = Pick<
  Prisma.TransactionClient,
  "pageView" | "portfolioSettings"
>;

export interface PageViewsService {
  recordPageView(input: unknown): Promise<PageViewDto>;
  getAnalytics(ownerId: string, days?: number): Promise<AnalyticsData>;
}
