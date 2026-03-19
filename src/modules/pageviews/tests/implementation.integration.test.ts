import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import { createPageViewsService } from "@/modules/pageviews/implementation";
import { type PageViewServicePrismaClient } from "@/modules/pageviews/interface";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("pageviews service integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }

    prisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: TEST_DATABASE_URL }),
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function runWithRollback(
    testFn: (
      service: ReturnType<typeof createPageViewsService>,
      tx: Prisma.TransactionClient,
    ) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createPageViewsService({
          prisma: tx as unknown as PageViewServicePrismaClient,
        });
        await testFn(service, tx);
        throw rollbackError;
      });
    } catch (error) {
      if (!(error instanceof Error && error.message === ROLLBACK_ERROR_MESSAGE)) {
        throw error;
      }
    }
  }

  async function createOwnerWithPublicPortfolio(
    tx: Prisma.TransactionClient,
    suffix: string,
  ) {
    const user = await tx.user.create({
      data: {
        email: `owner-pageviews-${suffix}@example.com`,
        isOwner: true,
      },
    });
    const settings = await tx.portfolioSettings.create({
      data: {
        ownerId: user.id,
        publicSlug: `pv-slug-${suffix}`,
        isPublic: true,
      },
    });
    return { user, settings };
  }

  // ── B1: recordPageView() — 정상 케이스 ──

  it("유효한 pageType 'home'으로 페이지뷰를 기록해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { settings } = await createOwnerWithPublicPortfolio(tx, `home-${unique}`);

      // 실행: home 페이지뷰 기록
      const result = await service.recordPageView({
        publicSlug: settings.publicSlug,
        pageType: "home",
      });

      // 검증: 결과에 id, pageType, createdAt 포함
      expect(result.id).toBeDefined();
      expect(result.pageType).toBe("home");
      expect(result.pageSlug).toBeNull();
      expect(result.referrer).toBeNull();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  it("유효한 pageType 4가지 모두 성공해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { settings } = await createOwnerWithPublicPortfolio(tx, `types-${unique}`);

      const pageTypes = ["home", "experiences", "projects", "project_detail"] as const;

      for (const pageType of pageTypes) {
        const result = await service.recordPageView({
          publicSlug: settings.publicSlug,
          pageType,
        });
        expect(result.pageType).toBe(pageType);
      }
    });
  });

  it("pageSlug와 referrer가 올바르게 저장되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { settings } = await createOwnerWithPublicPortfolio(tx, `slug-${unique}`);

      // 실행: pageSlug + referrer 포함 기록
      const result = await service.recordPageView({
        publicSlug: settings.publicSlug,
        pageType: "project_detail",
        pageSlug: "my-project",
        referrer: "https://google.com/search?q=test",
      });

      // 검증: 선택값 저장 확인
      expect(result.pageSlug).toBe("my-project");
      expect(result.referrer).toBe("https://google.com/search?q=test");
    });
  });

  it("publicSlug → ownerId가 올바르게 결정되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user, settings } = await createOwnerWithPublicPortfolio(tx, `owner-${unique}`);

      await service.recordPageView({
        publicSlug: settings.publicSlug,
        pageType: "home",
      });

      // 검증: DB에서 직접 확인 — ownerId가 올바르게 바인딩
      const dbRecord = await tx.pageView.findFirst({
        where: { ownerId: user.id },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.ownerId).toBe(user.id);
      expect(dbRecord!.pageType).toBe("home");
    });
  });

  // ── B2: recordPageView() — 에러 케이스 ──

  it("무효한 pageType은 422 VALIDATION_ERROR를 반환해야 한다", async () => {
    await runWithRollback(async (service) => {
      await expect(
        service.recordPageView({
          publicSlug: "any-slug",
          pageType: "invalid_type",
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });
  });

  it("존재하지 않는 publicSlug은 404 NOT_FOUND를 반환해야 한다", async () => {
    await runWithRollback(async (service) => {
      await expect(
        service.recordPageView({
          publicSlug: "nonexistent-slug-xyz-999",
          pageType: "home",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("비공개 포트폴리오는 404 NOT_FOUND를 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const user = await tx.user.create({
        data: {
          email: `owner-private-${unique}@example.com`,
          isOwner: true,
        },
      });
      // 비공개 설정 (isPublic: false)
      await tx.portfolioSettings.create({
        data: {
          ownerId: user.id,
          publicSlug: `private-slug-${unique}`,
          isPublic: false,
        },
      });

      await expect(
        service.recordPageView({
          publicSlug: `private-slug-${unique}`,
          pageType: "home",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("publicSlug 빈 문자열은 422 VALIDATION_ERROR를 반환해야 한다", async () => {
    await runWithRollback(async (service) => {
      await expect(
        service.recordPageView({
          publicSlug: "",
          pageType: "home",
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });
  });

  // ── B3: getAnalytics() — 요약 + 일별 ──

  it("빈 데이터일 때 요약이 전부 0이어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user } = await createOwnerWithPublicPortfolio(tx, `empty-${unique}`);

      // 실행: 페이지뷰 없는 상태에서 분석
      const analytics = await service.getAnalytics(user.id);

      // 검증: 요약 전부 0
      expect(analytics.summary.totalViews).toBe(0);
      expect(analytics.summary.todayViews).toBe(0);
      expect(analytics.summary.weekViews).toBe(0);
      expect(analytics.summary.monthViews).toBe(0);
      expect(analytics.pageTypeBreakdown).toEqual([]);
      expect(analytics.topReferrers).toEqual([]);
      expect(analytics.recentViews).toEqual([]);
    });
  });

  it("기본 30일 범위로 요약을 정확하게 집계해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user, settings } = await createOwnerWithPublicPortfolio(tx, `summary-${unique}`);

      // 준비: 오늘 날짜로 페이지뷰 3개 기록
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "home" });
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "projects" });
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "home" });

      // 실행: 기본 30일 분석
      const analytics = await service.getAnalytics(user.id);

      // 검증: 오늘 기록 3개 → 요약 정확도
      expect(analytics.summary.totalViews).toBe(3);
      expect(analytics.summary.todayViews).toBe(3);
      expect(analytics.summary.weekViews).toBe(3);
      expect(analytics.summary.monthViews).toBe(3);
    });
  });

  it("커스텀 days 파라미터로 범위를 올바르게 계산해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user, settings } = await createOwnerWithPublicPortfolio(tx, `days-${unique}`);

      // 준비: 페이지뷰 기록
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "home" });

      // 실행: 7일 범위로 조회
      const analytics7 = await service.getAnalytics(user.id, 7);
      const analytics30 = await service.getAnalytics(user.id, 30);

      // 검증: days=7이면 dailyViews ≥ 7, days=30이면 ≥ 30 (오늘 뷰가 범위 밖일 수 있음)
      expect(analytics7.dailyViews.length).toBeGreaterThanOrEqual(7);
      expect(analytics30.dailyViews.length).toBeGreaterThanOrEqual(30);
      // 오늘 기록한 뷰가 포함되어야 함
      const today = new Date().toISOString().slice(0, 10);
      const todayEntry = analytics7.dailyViews.find((d) => d.date === today);
      expect(todayEntry).toBeDefined();
      expect(todayEntry!.count).toBe(1);
      expect(analytics7.summary.totalViews).toBe(1);
    });
  });

  // ── B4: getAnalytics() — 집계 상세 ──

  it("일별 히스토그램이 날짜 오름차순으로 정렬되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user, settings } = await createOwnerWithPublicPortfolio(tx, `daily-${unique}`);

      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "home" });

      const analytics = await service.getAnalytics(user.id, 7);

      // 검증: 날짜 오름차순 (YYYY-MM-DD 문자열 비교)
      const dates = analytics.dailyViews.map((d) => d.date);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    });
  });

  it("페이지 타입별 분포가 카운트 내림차순으로 정렬되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user, settings } = await createOwnerWithPublicPortfolio(tx, `breakdown-${unique}`);

      // 준비: home 3회, projects 1회 기록
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "home" });
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "home" });
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "home" });
      await service.recordPageView({ publicSlug: settings.publicSlug, pageType: "projects" });

      const analytics = await service.getAnalytics(user.id);

      // 검증: 카운트 내림차순 (home=3 > projects=1)
      expect(analytics.pageTypeBreakdown.length).toBeGreaterThanOrEqual(2);
      expect(analytics.pageTypeBreakdown[0].pageType).toBe("home");
      expect(analytics.pageTypeBreakdown[0].count).toBe(3);
      expect(analytics.pageTypeBreakdown[1].pageType).toBe("projects");
      expect(analytics.pageTypeBreakdown[1].count).toBe(1);
    });
  });

  it("Referrer 호스트를 올바르게 추출해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user, settings } = await createOwnerWithPublicPortfolio(tx, `ref-${unique}`);

      // 준비: 다양한 referrer 기록
      await service.recordPageView({
        publicSlug: settings.publicSlug,
        pageType: "home",
        referrer: "https://google.com/search?q=test",
      });
      await service.recordPageView({
        publicSlug: settings.publicSlug,
        pageType: "home",
        referrer: "https://google.com/maps",
      });
      await service.recordPageView({
        publicSlug: settings.publicSlug,
        pageType: "home",
        referrer: "https://github.com/user/repo",
      });

      const analytics = await service.getAnalytics(user.id);

      // 검증: 같은 호스트(google.com)는 합산, 카운트 내림차순
      const googleRef = analytics.topReferrers.find((r) => r.referrer === "google.com");
      const githubRef = analytics.topReferrers.find((r) => r.referrer === "github.com");
      expect(googleRef).toBeDefined();
      expect(googleRef!.count).toBe(2);
      expect(githubRef).toBeDefined();
      expect(githubRef!.count).toBe(1);
    });
  });

  it("최근 방문이 20개 제한, 최신순으로 정렬되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const { user, settings } = await createOwnerWithPublicPortfolio(tx, `recent-${unique}`);

      // 준비: 25개 페이지뷰 기록 (20개 제한 테스트)
      for (let i = 0; i < 25; i++) {
        await service.recordPageView({
          publicSlug: settings.publicSlug,
          pageType: "home",
        });
      }

      const analytics = await service.getAnalytics(user.id);

      // 검증: 최대 20개 제한
      expect(analytics.recentViews.length).toBeLessThanOrEqual(20);

      // 검증: 최신순 정렬
      for (let i = 1; i < analytics.recentViews.length; i++) {
        expect(analytics.recentViews[i - 1].createdAt.getTime())
          .toBeGreaterThanOrEqual(analytics.recentViews[i].createdAt.getTime());
      }
    });
  });
});
