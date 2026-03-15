import { z } from "zod";
import {
  PageViewServiceError,
  type PageViewServicePrismaClient,
  type PageViewsService,
  type AnalyticsData,
  type DailyViewCount,
  type PageTypeCount,
  type ReferrerCount,
} from "@/modules/pageviews/interface";

const VALID_PAGE_TYPES = ["home", "experiences", "projects", "project_detail"] as const;
const MAX_SLUG_LENGTH = 200;
const MAX_REFERRER_LENGTH = 2000;
const DEFAULT_ANALYTICS_DAYS = 30;
const RECENT_VIEWS_LIMIT = 20;
const TOP_REFERRERS_LIMIT = 10;
const MS_PER_DAY = 86400000;

const recordPageViewSchema = z.object({
  publicSlug: z.string().min(1, "publicSlug은 필수입니다."),
  pageType: z.enum(VALID_PAGE_TYPES, { message: "올바른 페이지 유형이 아닙니다." }),
  pageSlug: z
    .string()
    .max(MAX_SLUG_LENGTH)
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  referrer: z
    .string()
    .max(MAX_REFERRER_LENGTH)
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});

const pageViewSelect = {
  id: true,
  pageType: true,
  pageSlug: true,
  referrer: true,
  createdAt: true,
} as const;

export function createPageViewsService(deps: {
  prisma: PageViewServicePrismaClient;
}): PageViewsService {
  const { prisma } = deps;

  return {
    async recordPageView(input) {
      const parsed = recordPageViewSchema.safeParse(input);
      if (!parsed.success) {
        throw new PageViewServiceError(
          "VALIDATION_ERROR",
          422,
          "페이지뷰 입력값이 올바르지 않습니다.",
        );
      }

      const { publicSlug, pageType, pageSlug, referrer } = parsed.data;

      const settings = await prisma.portfolioSettings.findFirst({
        where: { publicSlug, isPublic: true },
        select: { ownerId: true },
      });

      if (!settings) {
        throw new PageViewServiceError(
          "NOT_FOUND",
          404,
          "포트폴리오를 찾을 수 없습니다.",
        );
      }

      return prisma.pageView.create({
        data: {
          ownerId: settings.ownerId,
          pageType,
          pageSlug,
          referrer,
        },
        select: pageViewSelect,
      });
    },

    async getAnalytics(ownerId, days = DEFAULT_ANALYTICS_DAYS) {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date(now.getTime() - 7 * MS_PER_DAY);
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(now.getTime() - days * MS_PER_DAY);
      monthStart.setHours(0, 0, 0, 0);

      const [
        totalViews,
        todayViews,
        weekViews,
        monthViews,
        allViewsInRange,
        recentViews,
      ] = await Promise.all([
        prisma.pageView.count({ where: { ownerId } }),
        prisma.pageView.count({
          where: { ownerId, createdAt: { gte: todayStart } },
        }),
        prisma.pageView.count({
          where: { ownerId, createdAt: { gte: weekStart } },
        }),
        prisma.pageView.count({
          where: { ownerId, createdAt: { gte: monthStart } },
        }),
        prisma.pageView.findMany({
          where: { ownerId, createdAt: { gte: monthStart } },
          select: { pageType: true, referrer: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.pageView.findMany({
          where: { ownerId },
          select: pageViewSelect,
          orderBy: { createdAt: "desc" },
          take: RECENT_VIEWS_LIMIT,
        }),
      ]);

      // Aggregate daily views
      const dailyMap = new Map<string, number>();
      for (let d = 0; d < days; d++) {
        const date = new Date(monthStart.getTime() + d * MS_PER_DAY);
        dailyMap.set(date.toISOString().slice(0, 10), 0);
      }
      for (const view of allViewsInRange) {
        const dateKey = view.createdAt.toISOString().slice(0, 10);
        dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
      }
      const dailyViews: DailyViewCount[] = Array.from(
        dailyMap.entries(),
      ).map(([date, count]) => ({ date, count }));

      // Aggregate page type breakdown
      const pageTypeMap = new Map<string, number>();
      for (const view of allViewsInRange) {
        pageTypeMap.set(
          view.pageType,
          (pageTypeMap.get(view.pageType) ?? 0) + 1,
        );
      }
      const pageTypeBreakdown: PageTypeCount[] = Array.from(
        pageTypeMap.entries(),
      )
        .map(([pageType, count]) => ({ pageType, count }))
        .sort((a, b) => b.count - a.count);

      // Aggregate top referrers
      const referrerMap = new Map<string, number>();
      for (const view of allViewsInRange) {
        if (view.referrer) {
          const host = extractHost(view.referrer);
          referrerMap.set(host, (referrerMap.get(host) ?? 0) + 1);
        }
      }
      const topReferrers: ReferrerCount[] = Array.from(
        referrerMap.entries(),
      )
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_REFERRERS_LIMIT);

      const summary = { totalViews, todayViews, weekViews, monthViews };

      return {
        summary,
        dailyViews,
        pageTypeBreakdown,
        topReferrers,
        recentViews,
      } satisfies AnalyticsData;
    },
  };
}

function extractHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
