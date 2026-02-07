import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient, Visibility } from "@prisma/client";
import ws from "ws";
import { createProjectsService, type ProjectServicePrismaClient } from "@/modules/projects";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("projects delete integration", () => {
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
    testFn: (service: ReturnType<typeof createProjectsService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createProjectsService({ prisma: tx as ProjectServicePrismaClient });
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
        email: `owner-delete-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  it("오너가 자신의 프로젝트를 삭제할 수 있어야 한다", async () => {
    // 준비: 오너와 프로젝트를 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `success-${unique}`);

      const project = await service.createProject(owner.id, {
        title: `삭제 테스트 ${unique}`,
        slug: `delete-success-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      });

      // 실행: 프로젝트를 삭제한다.
      const deleted = await service.deleteProject(owner.id, project.id);

      // 검증: 삭제 응답과 재조회 404를 확인한다.
      expect(deleted.id).toBe(project.id);
      await expect(service.getProjectForOwner(owner.id, project.id)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("다른 오너의 프로젝트는 삭제할 수 없어야 한다", async () => {
    // 준비: 서로 다른 오너와 프로젝트를 생성한다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const project = await service.createProject(ownerA.id, {
        title: `삭제 권한 테스트 ${unique}`,
        slug: `delete-forbidden-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      });

      // 실행 및 검증: 권한 없는 삭제 시도는 403이어야 한다.
      await expect(service.deleteProject(ownerB.id, project.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });

  it("존재하지 않는 프로젝트 삭제 시 404를 반환해야 한다", async () => {
    // 준비: 존재하지 않는 프로젝트 ID를 만든다.
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `not-found-${unique}`);
      const projectId = `missing-project-${unique}`;

      // 실행 및 검증: 없는 프로젝트 삭제는 404여야 한다.
      await expect(service.deleteProject(owner.id, projectId)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });
});
