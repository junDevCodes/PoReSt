import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient, Visibility } from "@prisma/client";
import ws from "ws";
import { createBlogService, type BlogServicePrismaClient } from "@/modules/blog";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("blog service integration", () => {
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
    testFn: (service: ReturnType<typeof createBlogService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createBlogService({ prisma: tx as BlogServicePrismaClient });
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
        email: `owner-blog-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  it("블로그 글 생성 후 수정하고 삭제할 수 있어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `crud-${unique}`);

      const created = await service.createPost(owner.id, {
        title: `블로그-${unique}`,
        contentMd: "초기 본문",
        summary: "초기 요약",
        tags: ["NextJS", "Prisma"],
      });

      expect(created.title).toBe(`블로그-${unique}`);
      expect(created.tags).toEqual(["nextjs", "prisma"]);

      const updated = await service.updatePost(owner.id, created.id, {
        title: `블로그-수정-${unique}`,
        visibility: Visibility.PUBLIC,
      });

      expect(updated.title).toBe(`블로그-수정-${unique}`);
      expect(updated.visibility).toBe("PUBLIC");

      const deleted = await service.deletePost(owner.id, created.id);
      expect(deleted.id).toBe(created.id);

      await expect(service.getPostForOwner(owner.id, created.id)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("다른 오너의 블로그 글을 수정하려고 하면 403을 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const created = await service.createPost(ownerA.id, {
        title: `블로그-${unique}`,
        contentMd: "본문",
      });

      await expect(
        service.updatePost(ownerB.id, created.id, {
          title: "수정 시도",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });

  it("목록 조회는 본인 글만 반환하고 삭제된 글은 제외해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-list-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-list-${unique}`);

      const keep = await service.createPost(ownerA.id, {
        title: `유지-${unique}`,
        contentMd: "유지 본문",
      });

      const remove = await service.createPost(ownerA.id, {
        title: `삭제-${unique}`,
        contentMd: "삭제 본문",
      });

      await service.createPost(ownerB.id, {
        title: `타오너-${unique}`,
        contentMd: "타오너 본문",
      });

      await service.deletePost(ownerA.id, remove.id);

      const listed = await service.listPostsForOwner(ownerA.id);
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(keep.id);
    });
  });

  it("lint 실행 시 보고서가 저장되고 lastLintedAt이 갱신되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `lint-${unique}`);

      const created = await service.createPost(owner.id, {
        title: `블로그-lint-${unique}`,
        contentMd:
          "이 문장은 품질 점검에서 긴 문장으로 인식될 가능성이 높도록 충분히 길게 작성된 테스트 문장입니다.",
      });

      const linted = await service.runLintForPost(owner.id, created.id);

      expect(linted.lastLintedAt).not.toBeNull();
      expect(linted.lintReportJson).toEqual(
        expect.objectContaining({
          issues: expect.any(Array),
          summary: expect.objectContaining({
            total: expect.any(Number),
          }),
        }),
      );
    });
  });

  it("다른 오너의 글에 lint 실행을 시도하면 403을 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `lint-owner-a-${unique}`);
      const ownerB = await createOwner(tx, `lint-owner-b-${unique}`);

      const created = await service.createPost(ownerA.id, {
        title: `블로그-${unique}`,
        contentMd: "본문",
      });

      await expect(service.runLintForPost(ownerB.id, created.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
});
