import { DomainLinkEntityType } from "@prisma/client";
import {
  createDomainLinksService,
  DomainLinkServiceError,
  type DomainLinkServicePrismaClient,
} from "@/modules/domain-links";

function createMockPrisma(): DomainLinkServicePrismaClient {
  return {
    domainLink: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
    experience: {
      findFirst: jest.fn(),
    },
    skill: {
      findFirst: jest.fn(),
    },
    resume: {
      findFirst: jest.fn(),
    },
    note: {
      findFirst: jest.fn(),
    },
    blogPost: {
      findFirst: jest.fn(),
    },
    portfolioSettings: {
      findUnique: jest.fn(),
    },
  } as unknown as DomainLinkServicePrismaClient;
}

describe("T83 엔티티 연결 (Experience ↔ Project ↔ Skill)", () => {
  describe("SKILL 엔티티 타입 지원", () => {
    it("SKILL 타입의 엔티티로 링크를 생성할 수 있어야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: "exp-1" });
      (prisma.skill.findFirst as jest.Mock).mockResolvedValue({ id: "skill-1" });
      (prisma.domainLink.create as jest.Mock).mockResolvedValue({
        id: "link-1",
        ownerId: "owner-1",
        sourceType: DomainLinkEntityType.EXPERIENCE,
        sourceId: "exp-1",
        targetType: DomainLinkEntityType.SKILL,
        targetId: "skill-1",
        context: "React 사용 경력",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createLinkForOwner("owner-1", {
        sourceType: DomainLinkEntityType.EXPERIENCE,
        sourceId: "exp-1",
        targetType: DomainLinkEntityType.SKILL,
        targetId: "skill-1",
        context: "React 사용 경력",
      });

      expect(result.sourceType).toBe(DomainLinkEntityType.EXPERIENCE);
      expect(result.targetType).toBe(DomainLinkEntityType.SKILL);
      expect(result.context).toBe("React 사용 경력");
    });

    it("존재하지 않는 SKILL에 링크 생성 시 NOT_FOUND 에러를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
      (prisma.skill.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createLinkForOwner("owner-1", {
          sourceType: DomainLinkEntityType.PROJECT,
          sourceId: "proj-1",
          targetType: DomainLinkEntityType.SKILL,
          targetId: "nonexistent",
        }),
      ).rejects.toMatchObject<Partial<DomainLinkServiceError>>({
        code: "NOT_FOUND",
        status: 404,
      });
    });

    it("Project ↔ Skill 링크를 생성할 수 있어야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
      (prisma.skill.findFirst as jest.Mock).mockResolvedValue({ id: "skill-1" });
      (prisma.domainLink.create as jest.Mock).mockResolvedValue({
        id: "link-2",
        ownerId: "owner-1",
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: "proj-1",
        targetType: DomainLinkEntityType.SKILL,
        targetId: "skill-1",
        context: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createLinkForOwner("owner-1", {
        sourceType: DomainLinkEntityType.PROJECT,
        sourceId: "proj-1",
        targetType: DomainLinkEntityType.SKILL,
        targetId: "skill-1",
      });

      expect(result.id).toBe("link-2");
      expect(result.targetType).toBe(DomainLinkEntityType.SKILL);
    });
  });

  describe("양방향 조회", () => {
    it("entityType/entityId가 source 또는 target에 있는 모든 링크를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      const mockLinks = [
        {
          id: "link-1",
          ownerId: "owner-1",
          sourceType: DomainLinkEntityType.EXPERIENCE,
          sourceId: "exp-1",
          targetType: DomainLinkEntityType.PROJECT,
          targetId: "proj-1",
          context: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "link-2",
          ownerId: "owner-1",
          sourceType: DomainLinkEntityType.PROJECT,
          sourceId: "proj-2",
          targetType: DomainLinkEntityType.EXPERIENCE,
          targetId: "exp-1",
          context: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.domainLink.findMany as jest.Mock).mockResolvedValue(mockLinks);

      const result = await service.listBidirectionalLinksForOwner(
        "owner-1",
        DomainLinkEntityType.EXPERIENCE,
        "exp-1",
      );

      expect(result).toHaveLength(2);
      expect(prisma.domainLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: "owner-1",
            OR: [
              { sourceType: DomainLinkEntityType.EXPERIENCE, sourceId: "exp-1" },
              { targetType: DomainLinkEntityType.EXPERIENCE, targetId: "exp-1" },
            ],
          }),
        }),
      );
    });

    it("연결 없으면 빈 배열을 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.domainLink.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.listBidirectionalLinksForOwner(
        "owner-1",
        DomainLinkEntityType.PROJECT,
        "proj-1",
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("공개 엔티티 링크 조회", () => {
    it("공개 포트폴리오의 엔티티 링크를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue({
        ownerId: "owner-1",
        isPublic: true,
      });

      const mockLinks = [
        {
          id: "link-1",
          sourceType: DomainLinkEntityType.EXPERIENCE,
          sourceId: "exp-1",
          targetType: DomainLinkEntityType.PROJECT,
          targetId: "proj-1",
          context: "프로젝트 경험",
        },
      ];
      (prisma.domainLink.findMany as jest.Mock).mockResolvedValue(mockLinks);

      const result = await service.listPublicLinksForEntity(
        "test-slug",
        DomainLinkEntityType.EXPERIENCE,
        "exp-1",
      );

      expect(result).toHaveLength(1);
      expect(result[0].context).toBe("프로젝트 경험");
    });

    it("비공개 포트폴리오이면 빈 배열을 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue({
        ownerId: "owner-1",
        isPublic: false,
      });

      const result = await service.listPublicLinksForEntity(
        "test-slug",
        DomainLinkEntityType.EXPERIENCE,
        "exp-1",
      );

      expect(result).toHaveLength(0);
    });

    it("존재하지 않는 slug이면 빈 배열을 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.listPublicLinksForEntity(
        "nonexistent",
        DomainLinkEntityType.PROJECT,
        "proj-1",
      );

      expect(result).toHaveLength(0);
    });

    it("listPublicLinksForOwner는 PROJECT/EXPERIENCE/SKILL 링크만 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue({
        ownerId: "owner-1",
        isPublic: true,
      });

      const mockLinks = [
        {
          id: "link-1",
          sourceType: DomainLinkEntityType.EXPERIENCE,
          sourceId: "exp-1",
          targetType: DomainLinkEntityType.PROJECT,
          targetId: "proj-1",
          context: null,
        },
        {
          id: "link-2",
          sourceType: DomainLinkEntityType.PROJECT,
          sourceId: "proj-1",
          targetType: DomainLinkEntityType.SKILL,
          targetId: "skill-1",
          context: null,
        },
      ];
      (prisma.domainLink.findMany as jest.Mock).mockResolvedValue(mockLinks);

      const result = await service.listPublicLinksForOwner("test-slug");

      expect(result).toHaveLength(2);
      expect(prisma.domainLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sourceType: { in: [DomainLinkEntityType.PROJECT, DomainLinkEntityType.EXPERIENCE, DomainLinkEntityType.SKILL] },
            targetType: { in: [DomainLinkEntityType.PROJECT, DomainLinkEntityType.EXPERIENCE, DomainLinkEntityType.SKILL] },
          }),
        }),
      );
    });

    it("listPublicLinksForOwner 비공개 포트폴리오이면 빈 배열 반환", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue({
        ownerId: "owner-1",
        isPublic: false,
      });

      const result = await service.listPublicLinksForOwner("private-slug");
      expect(result).toHaveLength(0);
    });
  });

  describe("Experience ↔ Project 연결", () => {
    it("경력에서 프로젝트로 링크를 생성할 수 있어야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: "exp-1" });
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: "proj-1" });
      (prisma.domainLink.create as jest.Mock).mockResolvedValue({
        id: "link-ep-1",
        ownerId: "owner-1",
        sourceType: DomainLinkEntityType.EXPERIENCE,
        sourceId: "exp-1",
        targetType: DomainLinkEntityType.PROJECT,
        targetId: "proj-1",
        context: "이 경력에서 수행한 프로젝트",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createLinkForOwner("owner-1", {
        sourceType: DomainLinkEntityType.EXPERIENCE,
        sourceId: "exp-1",
        targetType: DomainLinkEntityType.PROJECT,
        targetId: "proj-1",
        context: "이 경력에서 수행한 프로젝트",
      });

      expect(result.sourceType).toBe(DomainLinkEntityType.EXPERIENCE);
      expect(result.targetType).toBe(DomainLinkEntityType.PROJECT);
    });
  });

  describe("소유권 격리", () => {
    it("다른 소유자의 엔티티에 링크 생성 시 NOT_FOUND를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      // owner-1의 experience는 찾지만, owner-1의 project는 없음 (다른 소유자의 프로젝트)
      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({ id: "exp-1" });
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createLinkForOwner("owner-1", {
          sourceType: DomainLinkEntityType.EXPERIENCE,
          sourceId: "exp-1",
          targetType: DomainLinkEntityType.PROJECT,
          targetId: "other-owner-proj",
        }),
      ).rejects.toMatchObject<Partial<DomainLinkServiceError>>({
        code: "NOT_FOUND",
        status: 404,
      });
    });

    it("다른 소유자의 링크 삭제 시 FORBIDDEN을 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createDomainLinksService({ prisma });

      (prisma.domainLink.findUnique as jest.Mock).mockResolvedValue({
        id: "link-1",
        ownerId: "other-owner",
      });

      await expect(
        service.deleteLinkForOwner("owner-1", "link-1"),
      ).rejects.toMatchObject<Partial<DomainLinkServiceError>>({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });
});
