import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient, Visibility } from "@prisma/client";
import ws from "ws";
import { createProjectsService, type ProjectServicePrismaClient } from "@/modules/projects";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("projects service integration", () => {
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
    const owner = await tx.user.create({
      data: {
        email: `owner-${suffix}@example.com`,
        isOwner: true,
      },
    });

    await tx.portfolioSettings.create({
      data: {
        ownerId: owner.id,
        publicSlug: `owner-${suffix}`,
        isPublic: true,
      },
    });

    return owner;
  }

  it("동일 slug로 프로젝트를 두 번 생성하면 409 에러를 반환해야 한다", async () => {
    // 준비: 동일 슬러그를 가진 두 입력 준비
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `slug-${unique}`);
      const input = {
        title: `중복 슬러그 테스트 ${unique}`,
        slug: `duplicate-slug-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      };

      // 실행: 첫 생성 후 동일 슬러그로 재생성
      await service.createProject(owner.id, input);

      // 검증: 409 충돌 확인
      await expect(service.createProject(owner.id, input)).rejects.toMatchObject({
        code: "CONFLICT",
        status: 409,
      });
    });
  });

  it("PUBLIC 프로젝트만 공개 목록에서 조회되어야 한다", async () => {
    // 준비: PUBLIC/PRIVATE/UNLISTED 프로젝트 생성
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `visibility-${unique}`);
      const publicSlug = `public-${unique}`;
      const privateSlug = `private-${unique}`;
      const unlistedSlug = `unlisted-${unique}`;

      await service.createProject(owner.id, {
        title: "공개 프로젝트",
        slug: publicSlug,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      });
      await service.createProject(owner.id, {
        title: "비공개 프로젝트",
        slug: privateSlug,
        contentMd: "본문",
        visibility: Visibility.PRIVATE,
      });
      await service.createProject(owner.id, {
        title: "언리스트 프로젝트",
        slug: unlistedSlug,
        contentMd: "본문",
        visibility: Visibility.UNLISTED,
      });

      // 실행: 공개 목록 조회
      const projects = await service.listPublicProjects();
      const slugs = projects.map((project) => project.slug);

      // 검증: PUBLIC만 노출 확인
      expect(slugs).toContain(publicSlug);
      expect(slugs).not.toContain(privateSlug);
      expect(slugs).not.toContain(unlistedSlug);
    });
  });

  it("공개 프로젝트 검색/필터/커서 페이지네이션이 동작해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `search-a-${unique}`);
      const ownerB = await createOwner(tx, `search-b-${unique}`);
      const ownerAPublicSlug = `owner-search-a-${unique}`;

      await service.createProject(ownerA.id, {
        title: `검색 대상 React ${unique}`,
        slug: `search-react-${unique}`,
        description: "React 기반 프로젝트",
        contentMd: "React와 Next.js를 사용한 공개 프로젝트",
        techStack: ["react", "nextjs"],
        visibility: Visibility.PUBLIC,
      });
      await service.createProject(ownerA.id, {
        title: `검색 대상 Node ${unique}`,
        slug: `search-node-${unique}`,
        description: "Node 기반 프로젝트",
        contentMd: "Node.js와 Prisma를 사용한 공개 프로젝트",
        techStack: ["nodejs", "prisma"],
        visibility: Visibility.PUBLIC,
      });
      await service.createProject(ownerA.id, {
        title: `검색 대상 Data ${unique}`,
        slug: `search-data-${unique}`,
        description: "데이터 파이프라인 프로젝트",
        contentMd: "ETL 파이프라인과 대시보드 구성",
        techStack: ["python", "etl"],
        visibility: Visibility.PUBLIC,
      });
      await service.createProject(ownerA.id, {
        title: `비공개 검색 제외 ${unique}`,
        slug: `search-private-${unique}`,
        contentMd: "비공개 프로젝트",
        techStack: ["react"],
        visibility: Visibility.PRIVATE,
      });
      await service.createProject(ownerB.id, {
        title: `다른 사용자 공개 ${unique}`,
        slug: `search-other-${unique}`,
        contentMd: "다른 사용자 프로젝트",
        techStack: ["react"],
        visibility: Visibility.PUBLIC,
      });

      const firstPage = await service.searchPublicProjects({
        q: "검색 대상",
        limit: 2,
        publicSlug: ownerAPublicSlug,
      });

      expect(firstPage.items).toHaveLength(2);
      expect(firstPage.items.every((item) => item.publicSlug === ownerAPublicSlug)).toBe(true);
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await service.searchPublicProjects({
        q: "검색 대상",
        limit: 2,
        publicSlug: ownerAPublicSlug,
        cursor: firstPage.nextCursor ?? undefined,
      });

      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.items.every((item) => item.publicSlug === ownerAPublicSlug)).toBe(true);
      expect(secondPage.items[0]?.slug).not.toBe(firstPage.items[0]?.slug);

      const byTag = await service.searchPublicProjects({
        tag: "react",
        limit: 10,
      });
      expect(byTag.items.some((item) => item.slug === `search-react-${unique}`)).toBe(true);
      expect(byTag.items.some((item) => item.slug === `search-private-${unique}`)).toBe(false);
    });
  });

  it("isFeatured=true와 visibility=PRIVATE 조합은 422 에러를 반환해야 한다", async () => {
    // 준비: 비공개 + 대표 노출 입력 준비
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `featured-${unique}`);

      // 실행 및 검증: 422 검증 에러 확인
      await expect(
        service.createProject(owner.id, {
          title: "대표 비공개 프로젝트",
          slug: `featured-private-${unique}`,
          contentMd: "본문",
          visibility: Visibility.PRIVATE,
          isFeatured: true,
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
      });
    });
  });

  it("존재하지 않는 slug 조회 시 404 에러를 반환해야 한다", async () => {
    // 준비: 존재하지 않는 slug 준비
    await runWithRollback(async (service) => {
      const slug = `not-found-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // 실행 및 검증: 404 확인
      await expect(service.getPublicProjectBySlug(slug)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("ownerId가 다른 사용자가 수정 시도하면 403 에러를 반환해야 한다", async () => {
    // 준비: 서로 다른 오너 2명 생성
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const project = await service.createProject(ownerA.id, {
        title: "오너 A 프로젝트",
        slug: `owner-a-project-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      });

      // 실행 및 검증: owner 불일치 403 확인
      await expect(
        service.updateProject(ownerB.id, project.id, {
          title: "수정 시도",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
});
