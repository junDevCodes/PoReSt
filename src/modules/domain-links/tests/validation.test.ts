import { DomainLinkEntityType } from "@prisma/client";
import {
  createDomainLinksService,
  DomainLinkServiceError,
  type DomainLinkServicePrismaClient,
} from "@/modules/domain-links";

function createMockPrisma(): DomainLinkServicePrismaClient {
  return {
    domainLink: {
      findMany: jest.fn(),
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
    resume: {
      findFirst: jest.fn(),
    },
    note: {
      findFirst: jest.fn(),
    },
    blogPost: {
      findFirst: jest.fn(),
    },
  } as unknown as DomainLinkServicePrismaClient;
}

describe("domain links validation", () => {
  it("source와 target이 동일하면 검증 에러를 반환해야 한다", async () => {
    const service = createDomainLinksService({ prisma: createMockPrisma() });

    await expect(
      service.createLinkForOwner("owner-1", {
        sourceType: DomainLinkEntityType.NOTE,
        sourceId: "note-1",
        targetType: DomainLinkEntityType.NOTE,
        targetId: "note-1",
      }),
    ).rejects.toMatchObject<Partial<DomainLinkServiceError>>({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("sourceType/sourceId가 짝이 맞지 않으면 조회 검증 에러를 반환해야 한다", async () => {
    const service = createDomainLinksService({ prisma: createMockPrisma() });

    await expect(
      service.listLinksForOwner("owner-1", {
        sourceType: DomainLinkEntityType.PROJECT,
      }),
    ).rejects.toMatchObject<Partial<DomainLinkServiceError>>({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });
});

