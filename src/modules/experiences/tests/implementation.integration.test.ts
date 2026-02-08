import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient, Visibility } from "@prisma/client";
import ws from "ws";
import { createExperiencesService, type ExperienceServicePrismaClient } from "@/modules/experiences";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("experiences service integration", () => {
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
      service: ReturnType<typeof createExperiencesService>,
      tx: Prisma.TransactionClient,
    ) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createExperiencesService({ prisma: tx as ExperienceServicePrismaClient });
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
        email: `owner-exp-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  it("경력 생성/목록/수정/삭제가 순서대로 동작해야 한다", async () => {
    // 준비: 오너와 생성 입력값을 준비한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `crud-${unique}`);
      const startDate = new Date("2024-01-01T00:00:00.000Z");

      // 실행: 생성 후 목록을 조회한다.
      const created = await service.createExperience(owner.id, {
        company: "회사A",
        role: "백엔드 개발자",
        startDate,
      });

      const listedAfterCreate = await service.listExperiencesForOwner(owner.id);

      // 검증: 생성 데이터가 목록에 포함되어야 한다.
      expect(created.company).toBe("회사A");
      expect(listedAfterCreate.some((experience) => experience.id === created.id)).toBe(true);

      // 실행: 경력을 수정한다.
      const updated = await service.updateExperience(owner.id, created.id, {
        role: "시니어 백엔드 개발자",
        isCurrent: true,
      });

      // 검증: 수정값이 반영되어야 한다.
      expect(updated.role).toBe("시니어 백엔드 개발자");
      expect(updated.isCurrent).toBe(true);

      // 실행: 경력을 삭제하고 목록을 다시 조회한다.
      const deleted = await service.deleteExperience(owner.id, created.id);
      const listedAfterDelete = await service.listExperiencesForOwner(owner.id);

      // 검증: 삭제된 ID가 목록에서 사라져야 한다.
      expect(deleted.id).toBe(created.id);
      expect(listedAfterDelete.some((experience) => experience.id === created.id)).toBe(false);
    });
  });

  it("다른 오너의 경력을 수정하려고 하면 403을 반환해야 한다", async () => {
    // 준비: 서로 다른 오너와 경력을 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const experience = await service.createExperience(ownerA.id, {
        company: "회사B",
        role: "개발자",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
      });

      // 실행 및 검증: 오너 불일치 수정은 403이어야 한다.
      await expect(
        service.updateExperience(ownerB.id, experience.id, {
          role: "수정 시도",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });

  it("isFeatured=true와 visibility=PRIVATE 조합은 422를 반환해야 한다", async () => {
    // 준비: 비공개 + 대표 노출 입력을 만든다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `featured-${unique}`);

      // 실행 및 검증: 검증 실패는 422여야 한다.
      await expect(
        service.createExperience(owner.id, {
          company: "회사C",
          role: "개발자",
          startDate: new Date("2024-01-01T00:00:00.000Z"),
          visibility: Visibility.PRIVATE,
          isFeatured: true,
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });
  });

  it("존재하지 않는 경력 수정/삭제는 404를 반환해야 한다", async () => {
    // 준비: 오너와 존재하지 않는 경력 ID를 준비한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `not-found-${unique}`);
      const experienceId = `missing-experience-${unique}`;

      // 실행 및 검증: 수정/삭제 모두 404여야 한다.
      await expect(
        service.updateExperience(owner.id, experienceId, {
          role: "수정 시도",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });

      await expect(service.deleteExperience(owner.id, experienceId)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });
});
