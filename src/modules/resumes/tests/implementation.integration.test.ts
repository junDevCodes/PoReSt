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

  it("이력서를 생성 후 수정하고 삭제할 수 있어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `crud-${unique}`);

      const created = await service.createResume(owner.id, {
        title: `이력서-${unique}`,
        targetCompany: "테스트 회사",
      });

      const listed = await service.listResumesForOwner(owner.id);
      expect(listed.some((item) => item.id === created.id)).toBe(true);

      const updated = await service.updateResume(owner.id, created.id, {
        targetRole: "백엔드 개발자",
      });
      expect(updated.targetRole).toBe("백엔드 개발자");

      const deleted = await service.deleteResume(owner.id, created.id);
      expect(deleted.id).toBe(created.id);

      await expect(service.getResumeForOwner(owner.id, created.id)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("다른 오너의 이력서를 수정하려고 하면 403을 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const created = await service.createResume(ownerA.id, {
        title: `이력서-${unique}`,
      });

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
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `duplicate-item-${unique}`);
      const resume = await service.createResume(owner.id, { title: `이력서-${unique}` });
      const experience = await createExperience(tx, owner.id, `exp-${unique}`);

      await service.createResumeItem(owner.id, resume.id, {
        experienceId: experience.id,
        sortOrder: 1,
      });

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
          bulletsJson: ["기본 불릿"],
          metricsJson: { kpi: "기본 수치" },
          techTags: ["TypeScript", "Prisma"],
        },
      });

      await service.createResumeItem(owner.id, resume.id, {
        experienceId: experience.id,
        sortOrder: 1,
        overrideBulletsJson: ["오버라이드 불릿"],
        overrideTechTags: ["Next.js"],
      });

      const preview = await service.getResumePreviewForOwner(owner.id, resume.id);
      const firstItem = preview.items[0];

      expect(firstItem?.resolvedBulletsJson).toEqual(["오버라이드 불릿"]);
      expect(firstItem?.resolvedTechTags).toEqual(["Next.js"]);
    });
  });

  it("공유 링크 생성/조회/회수 후 토큰 접근 제어가 동작해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `share-${unique}`);
      const resume = await service.createResume(owner.id, { title: `이력서-${unique}` });

      const link = await service.createResumeShareLink(owner.id, resume.id, {
        expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      });

      const links = await service.listResumeShareLinksForOwner(owner.id, resume.id);
      expect(links.some((item) => item.id === link.id)).toBe(true);

      const sharedPreview = await service.getResumePreviewByShareToken(link.token);
      expect(sharedPreview.resume.id).toBe(resume.id);

      const revoked = await service.revokeResumeShareLink(owner.id, resume.id, link.id);
      expect(revoked.id).toBe(link.id);

      await expect(service.getResumePreviewByShareToken(link.token)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("만료된 공유 링크는 조회할 수 없어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `expired-share-${unique}`);
      const resume = await service.createResume(owner.id, { title: `이력서-${unique}` });

      const link = await service.createResumeShareLink(owner.id, resume.id, {
        expiresAt: new Date(Date.now() + 1000).toISOString(),
      });

      await tx.resumeShareLink.update({
        where: { id: link.id },
        data: {
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      await expect(service.getResumePreviewByShareToken(link.token)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });
});
