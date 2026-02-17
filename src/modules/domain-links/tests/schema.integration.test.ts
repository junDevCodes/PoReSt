import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { DomainLinkEntityType, Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("domain link schema integration", () => {
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

  async function runWithRollback(testFn: (tx: Prisma.TransactionClient) => Promise<void>) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        await testFn(tx);
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
        email: `domain-link-owner-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  async function createProject(tx: Prisma.TransactionClient, ownerId: string, suffix: string) {
    return tx.project.create({
      data: {
        ownerId,
        slug: `domain-link-project-${suffix}`,
        title: `프로젝트-${suffix}`,
        contentMd: "도메인 링크 테스트 프로젝트",
        techStack: ["typescript"],
      },
    });
  }

  async function createNote(tx: Prisma.TransactionClient, ownerId: string, suffix: string) {
    const notebook = await tx.notebook.create({
      data: {
        ownerId,
        name: `노트북-${suffix}`,
      },
    });

    return tx.note.create({
      data: {
        ownerId,
        notebookId: notebook.id,
        title: `노트-${suffix}`,
        contentMd: "도메인 링크 테스트 노트",
        tags: ["domain-link"],
      },
    });
  }

  it("프로젝트와 노트를 연결하는 링크를 저장해야 한다", async () => {
    await runWithRollback(async (tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, unique);
      const project = await createProject(tx, owner.id, unique);
      const note = await createNote(tx, owner.id, unique);

      const created = await tx.domainLink.create({
        data: {
          ownerId: owner.id,
          sourceType: DomainLinkEntityType.PROJECT,
          sourceId: project.id,
          targetType: DomainLinkEntityType.NOTE,
          targetId: note.id,
          context: "프로젝트 상세 설명과 연관된 노트",
        },
      });

      expect(created.ownerId).toBe(owner.id);
      expect(created.sourceType).toBe(DomainLinkEntityType.PROJECT);
      expect(created.targetType).toBe(DomainLinkEntityType.NOTE);
      expect(created.context).toContain("연관된 노트");
    });
  });

  it("동일 owner/source/target 조합 링크는 중복 생성되면 안 된다", async () => {
    await runWithRollback(async (tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, unique);
      const project = await createProject(tx, owner.id, unique);
      const note = await createNote(tx, owner.id, unique);

      const payload = {
        ownerId: owner.id,
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: project.id,
        targetType: DomainLinkEntityType.NOTE,
        targetId: note.id,
      };

      await tx.domainLink.create({ data: payload });
      await expect(tx.domainLink.create({ data: payload })).rejects.toMatchObject({
        code: "P2002",
      });
    });
  });
});

