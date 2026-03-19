import { createPageViewsService } from "@/modules/pageviews/implementation";
import {
  PageViewServiceError,
  type PageViewServicePrismaClient,
} from "@/modules/pageviews/interface";

// ── B5: 입력 검증 ──

describe("pageviews validation", () => {
  function createMockPrisma(overrides: {
    portfolioSettingsFindFirst?: jest.Mock;
    pageViewCreate?: jest.Mock;
    pageViewCount?: jest.Mock;
    pageViewFindMany?: jest.Mock;
  } = {}) {
    return {
      portfolioSettings: {
        findFirst: overrides.portfolioSettingsFindFirst ?? jest.fn().mockResolvedValue(null),
      },
      pageView: {
        create: overrides.pageViewCreate ?? jest.fn().mockResolvedValue({
          id: "pv-1",
          pageType: "home",
          pageSlug: null,
          referrer: null,
          createdAt: new Date(),
        }),
        count: overrides.pageViewCount ?? jest.fn().mockResolvedValue(0),
        findMany: overrides.pageViewFindMany ?? jest.fn().mockResolvedValue([]),
      },
    } as unknown as PageViewServicePrismaClient;
  }

  // ── publicSlug 검증 ──

  it("publicSlug 빈 문자열이면 VALIDATION_ERROR(422)를 발생시켜야 한다", async () => {
    const prisma = createMockPrisma();
    const service = createPageViewsService({ prisma });

    await expect(
      service.recordPageView({ publicSlug: "", pageType: "home" }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("publicSlug 누락 시 VALIDATION_ERROR(422)를 발생시켜야 한다", async () => {
    const prisma = createMockPrisma();
    const service = createPageViewsService({ prisma });

    await expect(
      service.recordPageView({ pageType: "home" }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  // ── pageType 검증 ──

  it("허용된 pageType 4가지만 통과해야 한다", async () => {
    const validTypes = ["home", "experiences", "projects", "project_detail"];
    const findFirst = jest.fn().mockResolvedValue({ ownerId: "owner-1" });
    const create = jest.fn().mockImplementation((args: { data: { pageType: string } }) => ({
      id: "pv-1",
      pageType: args.data.pageType,
      pageSlug: null,
      referrer: null,
      createdAt: new Date(),
    }));
    const prisma = createMockPrisma({
      portfolioSettingsFindFirst: findFirst,
      pageViewCreate: create,
    });
    const service = createPageViewsService({ prisma });

    for (const pageType of validTypes) {
      const result = await service.recordPageView({
        publicSlug: "valid-slug",
        pageType,
      });
      expect(result.pageType).toBe(pageType);
    }
  });

  it("허용되지 않은 pageType은 VALIDATION_ERROR(422)를 발생시켜야 한다", async () => {
    const prisma = createMockPrisma();
    const service = createPageViewsService({ prisma });

    const invalidTypes = ["blog", "about", "contact", "", "HOME", "Projects"];

    for (const pageType of invalidTypes) {
      await expect(
        service.recordPageView({ publicSlug: "valid-slug", pageType }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
  });

  // ── referrer 검증 ──

  it("referrer가 null/undefined일 때 허용해야 한다", async () => {
    const findFirst = jest.fn().mockResolvedValue({ ownerId: "owner-1" });
    const create = jest.fn().mockResolvedValue({
      id: "pv-1",
      pageType: "home",
      pageSlug: null,
      referrer: null,
      createdAt: new Date(),
    });
    const prisma = createMockPrisma({
      portfolioSettingsFindFirst: findFirst,
      pageViewCreate: create,
    });
    const service = createPageViewsService({ prisma });

    // null referrer
    const result1 = await service.recordPageView({
      publicSlug: "valid-slug",
      pageType: "home",
      referrer: null,
    });
    expect(result1.referrer).toBeNull();

    // undefined referrer (누락)
    const result2 = await service.recordPageView({
      publicSlug: "valid-slug",
      pageType: "home",
    });
    expect(result2.referrer).toBeNull();
  });

  // ── NOT_FOUND 처리 ──

  it("존재하지 않는 publicSlug은 NOT_FOUND(404)를 반환해야 한다", async () => {
    const prisma = createMockPrisma({
      portfolioSettingsFindFirst: jest.fn().mockResolvedValue(null),
    });
    const service = createPageViewsService({ prisma });

    await expect(
      service.recordPageView({ publicSlug: "nonexistent", pageType: "home" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  // ── 에러 타입 검증 ──

  it("에러가 PageViewServiceError 인스턴스여야 한다", async () => {
    const prisma = createMockPrisma();
    const service = createPageViewsService({ prisma });

    try {
      await service.recordPageView({ publicSlug: "", pageType: "home" });
      fail("에러가 발생해야 합니다");
    } catch (error) {
      expect(error).toBeInstanceOf(PageViewServiceError);
    }
  });

  // ── B6: extractHost() 유틸리티 (간접 테스트: getAnalytics의 topReferrers) ──

  describe("extractHost (getAnalytics topReferrers 간접 검증)", () => {
    it("유효한 URL에서 호스트를 추출해야 한다", async () => {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      monthAgo.setHours(0, 0, 0, 0);

      const prisma = createMockPrisma({
        pageViewCount: jest.fn().mockResolvedValue(2),
        pageViewFindMany: jest.fn().mockImplementation((args: { orderBy?: { createdAt: string } }) => {
          if (args.orderBy?.createdAt === "desc") {
            // recentViews
            return [
              { id: "pv-1", pageType: "home", pageSlug: null, referrer: "https://google.com/search?q=test", createdAt: now },
              { id: "pv-2", pageType: "home", pageSlug: null, referrer: "https://github.com/user/repo", createdAt: now },
            ];
          }
          // allViewsInRange (asc)
          return [
            { pageType: "home", referrer: "https://google.com/search?q=test", createdAt: now },
            { pageType: "home", referrer: "https://github.com/user/repo", createdAt: now },
          ];
        }),
      });
      const service = createPageViewsService({ prisma });

      const analytics = await service.getAnalytics("owner-1", 7);

      // 검증: URL → hostname 추출
      const referrerNames = analytics.topReferrers.map((r) => r.referrer);
      expect(referrerNames).toContain("google.com");
      expect(referrerNames).toContain("github.com");
    });

    it("잘못된 URL은 원본 문자열을 반환해야 한다", async () => {
      const now = new Date();

      const prisma = createMockPrisma({
        pageViewCount: jest.fn().mockResolvedValue(1),
        pageViewFindMany: jest.fn().mockImplementation((args: { orderBy?: { createdAt: string } }) => {
          if (args.orderBy?.createdAt === "desc") {
            return [
              { id: "pv-1", pageType: "home", pageSlug: null, referrer: "not-a-valid-url", createdAt: now },
            ];
          }
          return [
            { pageType: "home", referrer: "not-a-valid-url", createdAt: now },
          ];
        }),
      });
      const service = createPageViewsService({ prisma });

      const analytics = await service.getAnalytics("owner-1", 7);

      // 검증: 잘못된 URL → 원본 문자열 그대로
      expect(analytics.topReferrers[0].referrer).toBe("not-a-valid-url");
    });

    it("referrer가 null인 뷰는 topReferrers에 포함되지 않아야 한다", async () => {
      const now = new Date();

      const prisma = createMockPrisma({
        pageViewCount: jest.fn().mockResolvedValue(1),
        pageViewFindMany: jest.fn().mockImplementation((args: { orderBy?: { createdAt: string } }) => {
          if (args.orderBy?.createdAt === "desc") {
            return [
              { id: "pv-1", pageType: "home", pageSlug: null, referrer: null, createdAt: now },
            ];
          }
          return [
            { pageType: "home", referrer: null, createdAt: now },
          ];
        }),
      });
      const service = createPageViewsService({ prisma });

      const analytics = await service.getAnalytics("owner-1", 7);

      // 검증: null referrer → topReferrers에 미포함
      expect(analytics.topReferrers).toEqual([]);
    });
  });

  // ── getAnalytics 빈 데이터 (mock 기반) ──

  it("빈 데이터에서 getAnalytics 요약이 전부 0이어야 한다", async () => {
    const prisma = createMockPrisma({
      pageViewCount: jest.fn().mockResolvedValue(0),
      pageViewFindMany: jest.fn().mockResolvedValue([]),
    });
    const service = createPageViewsService({ prisma });

    const analytics = await service.getAnalytics("owner-1");

    expect(analytics.summary.totalViews).toBe(0);
    expect(analytics.summary.todayViews).toBe(0);
    expect(analytics.summary.weekViews).toBe(0);
    expect(analytics.summary.monthViews).toBe(0);
    expect(analytics.dailyViews).toHaveLength(30); // 기본 30일
    expect(analytics.pageTypeBreakdown).toEqual([]);
    expect(analytics.topReferrers).toEqual([]);
    expect(analytics.recentViews).toEqual([]);
  });
});
