import {
  createExperienceStoriesService,
  ExperienceStoryServiceError,
  type ExperienceStoriesServicePrismaClient,
} from "@/modules/experience-stories";

function createMockPrisma(): ExperienceStoriesServicePrismaClient {
  return {
    experienceStory: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    experience: {
      findUnique: jest.fn(),
    },
  } as unknown as ExperienceStoriesServicePrismaClient;
}

describe("experience stories validation", () => {
  it("필수 필드가 누락되면 422를 반환해야 한다", async () => {
    const prisma = createMockPrisma();
    const service = createExperienceStoriesService({ prisma });

    await expect(service.createStory("owner-1", {})).rejects.toMatchObject<
      Partial<ExperienceStoryServiceError>
    >({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("다른 사용자의 STAR 스토리를 조회하려고 하면 403을 반환해야 한다", async () => {
    const prisma = createMockPrisma();
    (prisma.experienceStory.findUnique as jest.Mock).mockResolvedValue({
      id: "story-1",
      ownerId: "owner-a",
      experienceId: "exp-1",
      title: "title",
      situation: "s",
      task: "t",
      action: "a",
      result: "r",
      tags: [],
      metricsJson: null,
      linksJson: null,
      updatedAt: new Date(),
    });

    const service = createExperienceStoriesService({ prisma });
    await expect(service.getStoryForOwner("owner-b", "story-1")).rejects.toMatchObject<
      Partial<ExperienceStoryServiceError>
    >({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("수정 입력이 비어 있으면 422를 반환해야 한다", async () => {
    const prisma = createMockPrisma();
    (prisma.experienceStory.findUnique as jest.Mock).mockResolvedValue({
      id: "story-1",
      ownerId: "owner-1",
    });

    const service = createExperienceStoriesService({ prisma });
    await expect(service.updateStory("owner-1", "story-1", {})).rejects.toMatchObject<
      Partial<ExperienceStoryServiceError>
    >({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });
});

