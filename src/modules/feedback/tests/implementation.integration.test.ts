import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import { createFeedbackService, type FeedbackServicePrismaClient } from "@/modules/feedback";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("feedback service integration", () => {
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
    testFn: (service: ReturnType<typeof createFeedbackService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createFeedbackService({ prisma: tx as FeedbackServicePrismaClient });
        await testFn(service, tx);
        throw rollbackError;
      });
    } catch (error) {
      if (!(error instanceof Error && error.message === ROLLBACK_ERROR_MESSAGE)) {
        throw error;
      }
    }
  }

  async function createOwner(tx: Prisma.TransactionClient, suffix: string) {
    return tx.user.create({
      data: {
        email: `owner-feedback-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  async function createExperience(tx: Prisma.TransactionClient, ownerId: string, suffix: string) {
    return tx.experience.create({
      data: {
        ownerId,
        visibility: "PUBLIC",
        isFeatured: false,
        company: `회사-${suffix}`,
        role: "Backend Engineer",
        startDate: new Date("2022-01-01T00:00:00.000Z"),
        endDate: null,
        isCurrent: true,
        summary: "백엔드 서비스 개발",
        bulletsJson: ["성능 개선"],
        metricsJson: { latencyReduction: "35%" },
        techTags: ["typescript", "postgresql"],
        order: 0,
      },
    });
  }

  async function createResume(tx: Prisma.TransactionClient, ownerId: string, suffix: string) {
    return tx.resume.create({
      data: {
        ownerId,
        status: "DRAFT",
        title: `이력서-${suffix}`,
        targetCompany: "테스트 회사",
        targetRole: "백엔드 개발자",
        summaryMd: null,
      },
    });
  }

  it("피드백 요청 생성 후 목록/상세 조회가 가능해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `crud-${unique}`);
      const resume = await createResume(tx, owner.id, unique);

      const created = await service.createFeedbackRequest(owner.id, {
        targetType: "RESUME",
        targetId: resume.id,
        contextJson: {
          company: "테스트 회사",
        },
      });

      const listed = await service.listFeedbackRequestsForOwner(owner.id);
      expect(listed.some((item) => item.id === created.id)).toBe(true);

      const detail = await service.getFeedbackRequestForOwner(owner.id, created.id);
      expect(detail.id).toBe(created.id);
      expect(detail.status).toBe("QUEUED");
      expect(detail.items).toHaveLength(0);
    });
  });

  it("이력서 피드백 실행 시 항목을 생성하고 DONE 상태로 변경해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `run-${unique}`);
      const resume = await createResume(tx, owner.id, unique);

      const request = await service.createFeedbackRequest(owner.id, {
        targetType: "RESUME",
        targetId: resume.id,
      });

      const executed = await service.runFeedbackRequestForOwner(owner.id, request.id);

      expect(executed.status).toBe("DONE");
      expect(executed.items.length).toBeGreaterThan(0);
      expect(executed.items.every((item) => item.requestId === request.id)).toBe(true);
    });
  });

  it("다른 오너의 피드백 요청 실행 시도는 403을 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);
      const resume = await createResume(tx, ownerA.id, unique);

      const request = await service.createFeedbackRequest(ownerA.id, {
        targetType: "RESUME",
        targetId: resume.id,
      });

      await expect(service.runFeedbackRequestForOwner(ownerB.id, request.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });

  it("대상 타입별 선택 목록을 조회할 수 있어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `targets-${unique}`);
      const resume = await createResume(tx, owner.id, unique);

      await tx.portfolioSettings.create({
        data: {
          ownerId: owner.id,
          publicSlug: `feedback-targets-${unique}`,
          isPublic: true,
          displayName: "테스트 포트폴리오",
        },
      });

      const notebook = await tx.notebook.create({
        data: {
          ownerId: owner.id,
          name: `Notebook-${unique}`,
        },
      });

      const note = await tx.note.create({
        data: {
          ownerId: owner.id,
          notebookId: notebook.id,
          visibility: "PRIVATE",
          title: `노트-${unique}`,
          contentMd: "노트 본문",
          tags: [],
        },
      });

      const blog = await tx.blogPost.create({
        data: {
          ownerId: owner.id,
          status: "DRAFT",
          visibility: "PRIVATE",
          title: `블로그-${unique}`,
          contentMd: "블로그 본문",
          tags: [],
        },
      });

      const portfolioTargets = await service.listFeedbackTargetsForOwner(owner.id, "PORTFOLIO");
      const resumeTargets = await service.listFeedbackTargetsForOwner(owner.id, "RESUME");
      const noteTargets = await service.listFeedbackTargetsForOwner(owner.id, "NOTE");
      const blogTargets = await service.listFeedbackTargetsForOwner(owner.id, "BLOG");

      expect(portfolioTargets).toHaveLength(1);
      expect(resumeTargets.some((target) => target.id === resume.id)).toBe(true);
      expect(noteTargets.some((target) => target.id === note.id)).toBe(true);
      expect(blogTargets.some((target) => target.id === blog.id)).toBe(true);
    });
  });

  it("두 실행 결과 비교 시 추가/해결 항목 차이를 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `compare-${unique}`);
      const resume = await createResume(tx, owner.id, unique);

      const firstRequest = await service.createFeedbackRequest(owner.id, {
        targetType: "RESUME",
        targetId: resume.id,
      });
      await service.runFeedbackRequestForOwner(owner.id, firstRequest.id);

      const experience = await createExperience(tx, owner.id, unique);
      await tx.resume.update({
        where: { id: resume.id },
        data: {
          summaryMd: "핵심 성과를 포함한 요약",
        },
      });
      await tx.resumeItem.create({
        data: {
          resumeId: resume.id,
          experienceId: experience.id,
          sortOrder: 0,
          overrideBulletsJson: Prisma.JsonNull,
          overrideMetricsJson: Prisma.JsonNull,
          overrideTechTags: [],
          notes: null,
        },
      });

      const secondRequest = await service.createFeedbackRequest(owner.id, {
        targetType: "RESUME",
        targetId: resume.id,
      });
      await service.runFeedbackRequestForOwner(owner.id, secondRequest.id);

      const compared = await service.compareFeedbackRequestsForOwner(owner.id, {
        currentRequestId: secondRequest.id,
        previousRequestId: firstRequest.id,
      });

      expect(compared.currentRequestId).toBe(secondRequest.id);
      expect(compared.previousRequestId).toBe(firstRequest.id);
      expect(compared.summary.resolved).toBeGreaterThan(0);
    });
  });
});
