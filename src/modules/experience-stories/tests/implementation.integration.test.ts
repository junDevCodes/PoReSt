import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import {
  createExperienceStoriesService,
  type ExperienceStoriesServicePrismaClient,
} from "@/modules/experience-stories";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("experience stories service integration", () => {
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
      service: ReturnType<typeof createExperienceStoriesService>,
      tx: Prisma.TransactionClient,
    ) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createExperienceStoriesService({
          prisma: tx as ExperienceStoriesServicePrismaClient,
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
        email: `experience-story-owner-${suffix}@example.com`,
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
        endDate: null,
        isCurrent: false,
        summary: null,
        bulletsJson: null,
        metricsJson: null,
        techTags: ["typescript"],
        order: 0,
      },
    });
  }

  it("STAR 스토리를 생성/조회/수정/삭제할 수 있어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, unique);
      const experience = await createExperience(tx, owner.id, unique);

      const created = await service.createStory(owner.id, {
        experienceId: experience.id,
        title: `제목-${unique}`,
        situation: "상황",
        task: "과업",
        action: "행동",
        result: "결과",
        tags: ["star"],
      });
      expect(created.experienceId).toBe(experience.id);

      const fetched = await service.getStoryForOwner(owner.id, created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.title).toContain(unique);

      const updated = await service.updateStory(owner.id, created.id, {
        title: `수정-${unique}`,
        result: "수정 결과",
      });
      expect(updated.title).toContain(`수정-${unique}`);

      const deleted = await service.deleteStory(owner.id, created.id);
      expect(deleted.id).toBe(created.id);
    });
  });

  it("다른 사용자의 STAR 스토리를 수정하려고 하면 403을 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `a-${unique}`);
      const ownerB = await createOwner(tx, `b-${unique}`);
      const experience = await createExperience(tx, ownerA.id, unique);

      const created = await service.createStory(ownerA.id, {
        experienceId: experience.id,
        title: `제목-${unique}`,
        situation: "상황",
        task: "과업",
        action: "행동",
        result: "결과",
      });

      await expect(service.updateStory(ownerB.id, created.id, { title: "수정" })).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
});

