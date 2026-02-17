import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { DomainLinkEntityType, Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import {
  createDomainLinksService,
  type DomainLinkServicePrismaClient,
} from "@/modules/domain-links";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("domain links service integration", () => {
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
    testFn: (service: ReturnType<typeof createDomainLinksService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createDomainLinksService({ prisma: tx as DomainLinkServicePrismaClient });
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
        email: `domain-link-service-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  async function createProject(tx: Prisma.TransactionClient, ownerId: string, suffix: string) {
    return tx.project.create({
      data: {
        ownerId,
        slug: `domain-link-service-project-${suffix}`,
        title: `프로젝트-${suffix}`,
        contentMd: "도메인 링크 서비스 테스트",
        techStack: ["typescript"],
      },
    });
  }

  async function createNote(tx: Prisma.TransactionClient, ownerId: string, suffix: string) {
    const notebook = await tx.notebook.create({
      data: {
        ownerId,
        name: `도메인노트북-${suffix}`,
      },
    });

    return tx.note.create({
      data: {
        ownerId,
        notebookId: notebook.id,
        title: `노트-${suffix}`,
        contentMd: "도메인 링크 서비스 테스트 노트",
        tags: ["domain-link"],
      },
    });
  }

  it("링크 생성 후 source 기준 조회 및 삭제가 가능해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, unique);
      const project = await createProject(tx, owner.id, unique);
      const note = await createNote(tx, owner.id, unique);

      const created = await service.createLinkForOwner(owner.id, {
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: project.id,
        targetType: DomainLinkEntityType.NOTE,
        targetId: note.id,
      });
      expect(created.sourceId).toBe(project.id);

      const listed = await service.listLinksForOwner(owner.id, {
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: project.id,
      });
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(created.id);

      const deleted = await service.deleteLinkForOwner(owner.id, created.id);
      expect(deleted.id).toBe(created.id);
      const remaining = await service.listLinksForOwner(owner.id, {
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: project.id,
      });
      expect(remaining).toHaveLength(0);
    });
  });

  it("동일 링크를 중복 생성하면 409를 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `duplicate-${unique}`);
      const project = await createProject(tx, owner.id, `duplicate-${unique}`);
      const note = await createNote(tx, owner.id, `duplicate-${unique}`);
      const payload = {
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: project.id,
        targetType: DomainLinkEntityType.NOTE,
        targetId: note.id,
      };

      await service.createLinkForOwner(owner.id, payload);
      await expect(service.createLinkForOwner(owner.id, payload)).rejects.toMatchObject({
        code: "CONFLICT",
        status: 409,
      });
    });
  });

  it("다른 사용자의 링크는 삭제할 수 없어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);
      const project = await createProject(tx, ownerA.id, `owner-a-${unique}`);
      const note = await createNote(tx, ownerA.id, `owner-a-${unique}`);

      const created = await service.createLinkForOwner(ownerA.id, {
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: project.id,
        targetType: DomainLinkEntityType.NOTE,
        targetId: note.id,
      });

      await expect(service.deleteLinkForOwner(ownerB.id, created.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
});

