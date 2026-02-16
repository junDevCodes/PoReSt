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

  it("釉붾줈洹?湲 ?앹꽦 ???섏젙?섍퀬 ??젣?????덉뼱???쒕떎", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `crud-${unique}`);

      const created = await service.createPost(owner.id, {
        title: `釉붾줈洹?${unique}`,
        contentMd: "珥덇린 蹂몃Ц",
        summary: "珥덇린 ?붿빟",
        tags: ["NextJS", "Prisma"],
      });

      expect(created.title).toBe(`釉붾줈洹?${unique}`);
      expect(created.tags).toEqual(["nextjs", "prisma"]);

      const updated = await service.updatePost(owner.id, created.id, {
        title: `釉붾줈洹??섏젙-${unique}`,
        visibility: Visibility.PUBLIC,
      });

      expect(updated.title).toBe(`釉붾줈洹??섏젙-${unique}`);
      expect(updated.visibility).toBe("PUBLIC");

      const deleted = await service.deletePost(owner.id, created.id);
      expect(deleted.id).toBe(created.id);

      await expect(service.getPostForOwner(owner.id, created.id)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("?ㅻⅨ ?ㅻ꼫??釉붾줈洹?湲???섏젙?섎젮怨??섎㈃ 403??諛섑솚?댁빞 ?쒕떎", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const created = await service.createPost(ownerA.id, {
        title: `釉붾줈洹?${unique}`,
        contentMd: "蹂몃Ц",
      });

      await expect(
        service.updatePost(ownerB.id, created.id, {
          title: "?섏젙 ?쒕룄",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });

  it("紐⑸줉 議고쉶??蹂몄씤 湲留?諛섑솚?섍퀬 ??젣??湲? ?쒖쇅?댁빞 ?쒕떎", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-list-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-list-${unique}`);

      const keep = await service.createPost(ownerA.id, {
        title: `?좎?-${unique}`,
        contentMd: "?좎? 蹂몃Ц",
      });

      const remove = await service.createPost(ownerA.id, {
        title: `??젣-${unique}`,
        contentMd: "??젣 蹂몃Ц",
      });

      await service.createPost(ownerB.id, {
        title: `??ㅻ꼫-${unique}`,
        contentMd: "??ㅻ꼫 蹂몃Ц",
      });

      await service.deletePost(ownerA.id, remove.id);

      const listed = await service.listPostsForOwner(ownerA.id);
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(keep.id);
    });
  });

  it("lint ?ㅽ뻾 ??蹂닿퀬?쒓? ??λ릺怨?lastLintedAt??媛깆떊?섏뼱???쒕떎", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `lint-${unique}`);

      const created = await service.createPost(owner.id, {
        title: `釉붾줈洹?lint-${unique}`,
        contentMd:
          "??臾몄옣? ?덉쭏 ?먭??먯꽌 湲?臾몄옣?쇰줈 ?몄떇??媛?μ꽦???믩룄濡?異⑸텇??湲멸쾶 ?묒꽦???뚯뒪??臾몄옣?낅땲??",
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

  it("?ㅻⅨ ?ㅻ꼫??湲??lint ?ㅽ뻾???쒕룄?섎㈃ 403??諛섑솚?댁빞 ?쒕떎", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `lint-owner-a-${unique}`);
      const ownerB = await createOwner(tx, `lint-owner-b-${unique}`);

      const created = await service.createPost(ownerA.id, {
        title: `釉붾줈洹?${unique}`,
        contentMd: "蹂몃Ц",
      });

      await expect(service.runLintForPost(ownerB.id, created.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
  it("export 생성 시 이력 조회/재다운로드가 가능해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `export-${unique}`);

      const created = await service.createPost(owner.id, {
        title: `블로그-export-${unique}`,
        contentMd: "export 테스트 본문",
      });

      const exported = await service.createExportForPost(owner.id, created.id, "md");
      expect(exported.blogPostId).toBe(created.id);
      expect(exported.format).toBe("md");
      expect(exported.fileName.endsWith(".md")).toBe(true);
      expect(exported.byteSize).toBeGreaterThan(0);
      expect(exported.snapshotHash.length).toBeGreaterThan(0);
      expect(Buffer.from(exported.payload).toString("utf8")).toContain("export 테스트 본문");

      const listed = await service.listExportsForPost(owner.id, created.id);
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(exported.id);

      const downloaded = await service.getExportForPost(owner.id, created.id, exported.id);
      expect(downloaded.id).toBe(exported.id);
      expect(Buffer.from(downloaded.payload).equals(Buffer.from(exported.payload))).toBe(true);
    });
  });

  it("다른 오너의 export 이력은 조회할 수 없어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `export-owner-a-${unique}`);
      const ownerB = await createOwner(tx, `export-owner-b-${unique}`);

      const created = await service.createPost(ownerA.id, {
        title: `블로그-export-${unique}`,
        contentMd: "다른 오너 공개 사용 글",
      });
      const exported = await service.createExportForPost(ownerA.id, created.id, "zip");

      await expect(service.listExportsForPost(ownerB.id, created.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });

      await expect(service.getExportForPost(ownerB.id, created.id, exported.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
});
