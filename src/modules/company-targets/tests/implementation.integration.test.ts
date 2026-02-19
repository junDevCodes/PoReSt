import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { CompanyTargetStatus, Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import {
  createCompanyTargetsService,
  type CompanyTargetsServicePrismaClient,
} from "@/modules/company-targets";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("company targets service integration", () => {
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
      service: ReturnType<typeof createCompanyTargetsService>,
      tx: Prisma.TransactionClient,
    ) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createCompanyTargetsService({
          prisma: tx as CompanyTargetsServicePrismaClient,
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

  async function createOwner(tx: Prisma.TransactionClient, suffix: string) {
    return tx.user.create({
      data: {
        email: `company-target-owner-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  it("기업 분석 카드를 생성/조회/수정/삭제할 수 있어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, unique);

      const created = await service.createTarget(owner.id, {
        company: `회사-${unique}`,
        role: `직무-${unique}`,
        status: CompanyTargetStatus.INTERESTED,
        priority: 10,
        summary: "요약",
        analysisMd: "분석",
        tags: ["target"],
      });
      expect(created.company).toContain(unique);

      const fetched = await service.getTargetForOwner(owner.id, created.id);
      expect(fetched.id).toBe(created.id);

      const updated = await service.updateTarget(owner.id, created.id, {
        status: CompanyTargetStatus.APPLIED,
        priority: 20,
      });
      expect(updated.status).toBe(CompanyTargetStatus.APPLIED);
      expect(updated.priority).toBe(20);

      const deleted = await service.deleteTarget(owner.id, created.id);
      expect(deleted.id).toBe(created.id);
    });
  });

  it("동일 회사+직무를 중복 생성하면 409를 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `dup-${unique}`);
      const payload = {
        company: `회사-${unique}`,
        role: `직무-${unique}`,
      };

      await service.createTarget(owner.id, payload);
      await expect(service.createTarget(owner.id, payload)).rejects.toMatchObject({
        code: "CONFLICT",
        status: 409,
      });
    });
  });

  it("다른 사용자의 기업 분석 카드는 삭제할 수 없어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `a-${unique}`);
      const ownerB = await createOwner(tx, `b-${unique}`);

      const created = await service.createTarget(ownerA.id, {
        company: `회사-${unique}`,
        role: `직무-${unique}`,
      });

      await expect(service.deleteTarget(ownerB.id, created.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
});

