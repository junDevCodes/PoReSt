import {
  CompanyTargetServiceError,
  createCompanyTargetsService,
  type CompanyTargetsServicePrismaClient,
} from "@/modules/company-targets";

function createMockPrisma(): CompanyTargetsServicePrismaClient {
  return {
    companyTarget: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as CompanyTargetsServicePrismaClient;
}

describe("company targets validation", () => {
  it("필수 필드가 누락되면 422를 반환해야 한다", async () => {
    const prisma = createMockPrisma();
    const service = createCompanyTargetsService({ prisma });

    await expect(service.createTarget("owner-1", {})).rejects.toMatchObject<
      Partial<CompanyTargetServiceError>
    >({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("다른 사용자의 기업 분석 카드를 조회하려고 하면 403을 반환해야 한다", async () => {
    const prisma = createMockPrisma();
    (prisma.companyTarget.findUnique as jest.Mock).mockResolvedValue({
      id: "target-1",
      ownerId: "owner-a",
      company: "A",
      role: "Backend",
      status: "INTERESTED",
      priority: 0,
      summary: null,
      analysisMd: null,
      linksJson: null,
      tags: [],
      updatedAt: new Date(),
    });

    const service = createCompanyTargetsService({ prisma });

    await expect(service.getTargetForOwner("owner-b", "target-1")).rejects.toMatchObject<
      Partial<CompanyTargetServiceError>
    >({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("수정 입력이 비어 있으면 422를 반환해야 한다", async () => {
    const prisma = createMockPrisma();
    (prisma.companyTarget.findUnique as jest.Mock).mockResolvedValue({
      id: "target-1",
      ownerId: "owner-1",
      status: "INTERESTED",
    });

    const service = createCompanyTargetsService({ prisma });

    await expect(service.updateTarget("owner-1", "target-1", {})).rejects.toMatchObject<
      Partial<CompanyTargetServiceError>
    >({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });
});

