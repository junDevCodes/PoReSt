import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import { createResumesService, type ResumeServicePrismaClient } from "@/modules/resumes";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("resumes service integration", () => {
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
    testFn: (service: ReturnType<typeof createResumesService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createResumesService({ prisma: tx as ResumeServicePrismaClient });
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
        email: `owner-resume-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  async function createExperience(tx: Prisma.TransactionClient, ownerId: string, suffix: string) {
    return tx.experience.create({
      data: {
        ownerId,
        company: `회사-${suffix}`,
        role: `역할-${suffix}`,
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        techTags: [],
      },
    });
  }

  it("이력서 생성 후 수정하고 삭제할 수 있어야 한다", async () => {
    // 준비: 오너 계정을 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `crud-${unique}`);

      // 실행: 이력서를 생성한다.
      const created = await service.createResume(owner.id, {
        title: `이력서-${unique}`,
        targetCompany: "테스트 회사",
      });

      // 검증: 생성된 이력서가 목록에 포함되어야 한다.
      const listed = await service.listResumesForOwner(owner.id);
      expect(listed.some((item) => item.id === created.id)).toBe(true);

      // 실행: 이력서를 수정한다.
      const updated = await service.updateResume(owner.id, created.id, {
        targetRole: "백엔드 개발자",
      });
      expect(updated.targetRole).toBe("백엔드 개발자");

      // 실행: 이력서를 삭제한다.
      const deleted = await service.deleteResume(owner.id, created.id);
      expect(deleted.id).toBe(created.id);

      // 검증: 삭제 후 상세 조회는 404여야 한다.
      await expect(service.getResumeForOwner(owner.id, created.id)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("다른 오너의 이력서를 수정하려고 하면 403을 반환해야 한다", async () => {
    // 준비: 서로 다른 오너 2명을 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const created = await service.createResume(ownerA.id, {
        title: `이력서-${unique}`,
      });

      // 실행 및 검증: 소유권 불일치 시 403이어야 한다.
      await expect(
        service.updateResume(ownerB.id, created.id, {
          title: "수정 시도",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });

  it("동일 경력을 같은 이력서에 중복 추가하면 409를 반환해야 한다", async () => {
    // 준비: 오너, 이력서, 경력을 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `duplicate-item-${unique}`);
      const resume = await service.createResume(owner.id, { title: `이력서-${unique}` });
      const experience = await createExperience(tx, owner.id, `exp-${unique}`);

      // 실행: 동일 경력을 두 번 추가한다.
      await service.createResumeItem(owner.id, resume.id, {
        experienceId: experience.id,
        sortOrder: 1,
      });

      // 검증: 두 번째 추가는 409 충돌이어야 한다.
      await expect(
        service.createResumeItem(owner.id, resume.id, {
          experienceId: experience.id,
          sortOrder: 2,
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        status: 409,
      });
    });
  });

  it("프리뷰는 오버라이드 값을 우선 반영해야 한다", async () => {
    // 준비: 이력서와 경력을 생성하고 항목을 추가한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `preview-${unique}`);
      const resume = await service.createResume(owner.id, { title: `이력서-${unique}` });
      const experience = await tx.experience.create({
        data: {
          ownerId: owner.id,
          company: `회사-${unique}`,
          role: "개발자",
          startDate: new Date("2024-01-01T00:00:00.000Z"),
          bulletsJson: ["원본 불릿"],
          metricsJson: { kpi: "원본 수치" },
          techTags: ["TypeScript", "Prisma"],
        },
      });

      await service.createResumeItem(owner.id, resume.id, {
        experienceId: experience.id,
        sortOrder: 1,
        overrideBulletsJson: ["오버라이드 불릿"],
        overrideTechTags: ["Next.js"],
      });

      // 실행: 프리뷰를 조회한다.
      const preview = await service.getResumePreviewForOwner(owner.id, resume.id);
      const firstItem = preview.items[0];

      // 검증: 오버라이드 값이 우선 적용되어야 한다.
      expect(firstItem?.resolvedBulletsJson).toEqual(["오버라이드 불릿"]);
      expect(firstItem?.resolvedTechTags).toEqual(["Next.js"]);
    });
  });
});
