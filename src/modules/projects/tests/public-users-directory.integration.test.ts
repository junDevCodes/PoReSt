import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient, Visibility } from "@prisma/client";
import ws from "ws";
import { createProjectsService, type ProjectServicePrismaClient } from "@/modules/projects";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("projects public users directory integration", () => {
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
        email: `directory-owner-${suffix}@example.com`,
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

  it("공개 사용자 디렉토리는 공개 프로젝트가 있는 공개 프로필만 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const visibleA = await createOwner(tx, `visible-a-${unique}`);
      const visibleB = await createOwner(tx, `visible-b-${unique}`);
      const hidden = await createOwner(tx, `hidden-${unique}`);
      const noProject = await createOwner(tx, `no-project-${unique}`);

      await tx.portfolioSettings.update({
        where: { ownerId: visibleA.id },
        data: {
          displayName: `Visible A ${unique}`,
          headline: "Backend Engineer",
        },
      });
      await tx.portfolioSettings.update({
        where: { ownerId: visibleB.id },
        data: {
          displayName: `Visible B ${unique}`,
          headline: "Fullstack Developer",
        },
      });
      await tx.portfolioSettings.update({
        where: { ownerId: hidden.id },
        data: {
          isPublic: false,
          displayName: `Hidden ${unique}`,
        },
      });
      await tx.portfolioSettings.update({
        where: { ownerId: noProject.id },
        data: {
          displayName: `No Project ${unique}`,
        },
      });

      await service.createProject(visibleA.id, {
        title: `Visible A Project ${unique}`,
        slug: `visible-a-project-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      });
      await service.createProject(visibleB.id, {
        title: `Visible B Project ${unique}`,
        slug: `visible-b-project-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      });
      await service.createProject(hidden.id, {
        title: `Hidden Project ${unique}`,
        slug: `hidden-project-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PUBLIC,
      });
      await service.createProject(noProject.id, {
        title: `No Project ${unique}`,
        slug: `no-project-${unique}`,
        contentMd: "본문",
        visibility: Visibility.PRIVATE,
      });

      const firstPage = await service.searchPublicUsersDirectory({ q: "Visible", limit: 1 });
      expect(firstPage.items).toHaveLength(1);
      expect(firstPage.nextCursor).not.toBeNull();
      expect(firstPage.items[0]?.projectCount).toBe(1);

      const secondPage = await service.searchPublicUsersDirectory({
        q: "Visible",
        limit: 1,
        cursor: firstPage.nextCursor ?? undefined,
      });
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.items[0]?.publicSlug).not.toBe(firstPage.items[0]?.publicSlug);

      const allUsers = await service.searchPublicUsersDirectory({ limit: 20 });
      const slugs = allUsers.items.map((item) => item.publicSlug);

      expect(slugs).toContain(`owner-visible-a-${unique}`);
      expect(slugs).toContain(`owner-visible-b-${unique}`);
      expect(slugs).not.toContain(`owner-hidden-${unique}`);
      expect(slugs).not.toContain(`owner-no-project-${unique}`);
    });
  });
});
