import { TestimonialStatus } from "@prisma/client";
import {
  createTestimonialService,
  TestimonialServiceError,
  type TestimonialServicePrismaClient,
  createSchema,
  updateSchema,
  submitSchema,
  generateShareToken,
  RELATIONSHIP_PRESETS,
  isTestimonialServiceError,
} from "@/modules/testimonials";

function createMockPrisma(): TestimonialServicePrismaClient {
  return {
    testimonial: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    portfolioSettings: {
      findUnique: jest.fn(),
    },
  } as unknown as TestimonialServicePrismaClient;
}

describe("T85 추천서/동료 평가", () => {
  describe("generateShareToken", () => {
    it("16자 길이의 토큰을 생성해야 한다", () => {
      const token = generateShareToken();
      expect(token).toHaveLength(16);
      expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
    });

    it("매 호출마다 다른 토큰이 생성되어야 한다", () => {
      const tokens = new Set(Array.from({ length: 100 }, () => generateShareToken()));
      expect(tokens.size).toBe(100);
    });
  });

  describe("createSchema", () => {
    it("빈 객체도 유효해야 한다", () => {
      const result = createSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("authorName과 authorEmail을 받아야 한다", () => {
      const result = createSchema.safeParse({
        authorName: "홍길동",
        authorEmail: "hong@test.com",
        relationship: "동료",
      });
      expect(result.success).toBe(true);
    });

    it("잘못된 이메일은 거부해야 한다", () => {
      const result = createSchema.safeParse({ authorEmail: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateSchema", () => {
    it("상태 변경을 검증해야 한다", () => {
      const result = updateSchema.safeParse({ status: "APPROVED" });
      expect(result.success).toBe(true);
    });

    it("잘못된 상태는 거부해야 한다", () => {
      const result = updateSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("isPublic과 displayOrder를 받아야 한다", () => {
      const result = updateSchema.safeParse({ isPublic: true, displayOrder: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe("submitSchema", () => {
    it("유효한 제출 데이터를 받아야 한다", () => {
      const result = submitSchema.safeParse({
        authorName: "홍길동",
        content: "훌륭한 개발자입니다. 함께 일하면서 많이 배웠습니다.",
        rating: 5,
      });
      expect(result.success).toBe(true);
    });

    it("이름 누락 시 거부해야 한다", () => {
      const result = submitSchema.safeParse({
        content: "좋은 사람입니다.",
      });
      expect(result.success).toBe(false);
    });

    it("내용이 10자 미만이면 거부해야 한다", () => {
      const result = submitSchema.safeParse({
        authorName: "홍길동",
        content: "짧아",
      });
      expect(result.success).toBe(false);
    });

    it("rating은 1~5 사이여야 한다", () => {
      expect(submitSchema.safeParse({ authorName: "A", content: "a".repeat(10), rating: 0 }).success).toBe(false);
      expect(submitSchema.safeParse({ authorName: "A", content: "a".repeat(10), rating: 6 }).success).toBe(false);
      expect(submitSchema.safeParse({ authorName: "A", content: "a".repeat(10), rating: 3 }).success).toBe(true);
    });

    it("5000자 초과 내용은 거부해야 한다", () => {
      const result = submitSchema.safeParse({
        authorName: "홍길동",
        content: "a".repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createRequest", () => {
    it("추천서 요청을 생성해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.create as jest.Mock).mockResolvedValue({
        id: "test-1",
        ownerId: "owner-1",
        authorName: "홍길동",
        authorTitle: null,
        authorCompany: null,
        authorEmail: "hong@test.com",
        relationship: "동료",
        content: null,
        rating: null,
        status: TestimonialStatus.PENDING,
        shareToken: "abcd1234ABCD5678",
        isPublic: false,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createRequest("owner-1", {
        authorName: "홍길동",
        authorEmail: "hong@test.com",
        relationship: "동료",
      });

      expect(result.authorName).toBe("홍길동");
      expect(result.status).toBe(TestimonialStatus.PENDING);
      expect(result.shareToken).toBeTruthy();
    });
  });

  describe("updateForOwner", () => {
    it("소유자가 아닌 경우 FORBIDDEN", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue({
        id: "test-1",
        ownerId: "other-owner",
        status: TestimonialStatus.SUBMITTED,
      });

      await expect(
        service.updateForOwner("owner-1", "test-1", { status: "APPROVED" }),
      ).rejects.toThrow(TestimonialServiceError);

      try {
        await service.updateForOwner("owner-1", "test-1", { status: "APPROVED" });
      } catch (e) {
        expect((e as TestimonialServiceError).code).toBe("FORBIDDEN");
      }
    });

    it("존재하지 않는 추천서는 NOT_FOUND", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateForOwner("owner-1", "nonexistent", { status: "APPROVED" }),
      ).rejects.toThrow(TestimonialServiceError);
    });

    it("승인 시 isPublic이 자동 true 설정되어야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue({
        id: "test-1",
        ownerId: "owner-1",
        status: TestimonialStatus.SUBMITTED,
      });

      (prisma.testimonial.update as jest.Mock).mockResolvedValue({
        id: "test-1",
        ownerId: "owner-1",
        authorName: "홍길동",
        authorTitle: null,
        authorCompany: null,
        authorEmail: null,
        relationship: null,
        content: "좋은 개발자",
        rating: 5,
        status: TestimonialStatus.APPROVED,
        shareToken: "token123",
        isPublic: true,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateForOwner("owner-1", "test-1", { status: "APPROVED" });
      expect(result.status).toBe(TestimonialStatus.APPROVED);

      const updateCall = (prisma.testimonial.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.isPublic).toBe(true);
    });
  });

  describe("deleteForOwner", () => {
    it("소유자의 추천서를 삭제해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue({
        id: "test-1",
        ownerId: "owner-1",
      });
      (prisma.testimonial.delete as jest.Mock).mockResolvedValue({});

      await service.deleteForOwner("owner-1", "test-1");
      expect(prisma.testimonial.delete).toHaveBeenCalledWith({ where: { id: "test-1" } });
    });

    it("다른 소유자의 추천서 삭제 시 FORBIDDEN", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue({
        id: "test-1",
        ownerId: "other-owner",
      });

      await expect(service.deleteForOwner("owner-1", "test-1")).rejects.toThrow(TestimonialServiceError);
    });
  });

  describe("submitByShareToken", () => {
    it("PENDING 상태의 추천서에 내용을 제출해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue({
        id: "test-1",
        status: TestimonialStatus.PENDING,
      });
      (prisma.testimonial.update as jest.Mock).mockResolvedValue({});

      await service.submitByShareToken("token123", {
        authorName: "김철수",
        authorTitle: "시니어 엔지니어",
        authorCompany: "테크회사",
        content: "뛰어난 문제 해결 능력을 가진 개발자입니다.",
        rating: 5,
      });

      const updateCall = (prisma.testimonial.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.authorName).toBe("김철수");
      expect(updateCall.data.status).toBe(TestimonialStatus.SUBMITTED);
    });

    it("이미 제출된 추천서는 ALREADY_SUBMITTED", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue({
        id: "test-1",
        status: TestimonialStatus.SUBMITTED,
      });

      await expect(
        service.submitByShareToken("token123", {
          authorName: "김철수",
          content: "중복 제출 시도입니다. 이건 거부되어야 합니다.",
        }),
      ).rejects.toThrow(TestimonialServiceError);
    });

    it("존재하지 않는 토큰은 NOT_FOUND", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.submitByShareToken("invalid-token", {
          authorName: "김철수",
          content: "이건 에러가 나야 합니다. 토큰이 없으니까요.",
        }),
      ).rejects.toThrow(TestimonialServiceError);
    });
  });

  describe("listPublicBySlug", () => {
    it("승인된 공개 추천서만 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue({
        ownerId: "owner-1",
        isPublic: true,
      });

      (prisma.testimonial.findMany as jest.Mock).mockResolvedValue([
        {
          id: "t-1",
          authorName: "김철수",
          authorTitle: "CTO",
          authorCompany: "테크회사",
          relationship: "상사",
          content: "훌륭합니다.",
          rating: 5,
        },
      ]);

      const result = await service.listPublicBySlug("test-slug");
      expect(result).toHaveLength(1);
      expect(result[0].authorName).toBe("김철수");
    });

    it("비공개 포트폴리오는 빈 배열 반환", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue({
        ownerId: "owner-1",
        isPublic: false,
      });

      const result = await service.listPublicBySlug("private-slug");
      expect(result).toEqual([]);
    });

    it("존재하지 않는 slug는 빈 배열 반환", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.portfolioSettings.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.listPublicBySlug("nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("getByShareToken", () => {
    it("유효한 토큰으로 정보를 조회해야 한다", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue({
        status: TestimonialStatus.PENDING,
        authorName: null,
        owner: {
          portfolioSettings: {
            displayName: "이준영",
            avatarUrl: "https://example.com/avatar.jpg",
          },
        },
      });

      const result = await service.getByShareToken("valid-token");
      expect(result.ownerDisplayName).toBe("이준영");
      expect(result.status).toBe(TestimonialStatus.PENDING);
    });

    it("존재하지 않는 토큰은 NOT_FOUND", async () => {
      const prisma = createMockPrisma();
      const service = createTestimonialService({ prisma });

      (prisma.testimonial.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getByShareToken("invalid")).rejects.toThrow(TestimonialServiceError);
    });
  });

  describe("TestimonialServiceError", () => {
    it("에러 객체를 올바르게 생성해야 한다", () => {
      const error = new TestimonialServiceError("NOT_FOUND", 404, "찾을 수 없음");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.status).toBe(404);
      expect(error.message).toBe("찾을 수 없음");
    });

    it("필드 에러를 포함해야 한다", () => {
      const error = new TestimonialServiceError("VALIDATION_ERROR", 422, "검증 실패", { content: "필수" });
      expect(error.fields).toEqual({ content: "필수" });
    });

    it("isTestimonialServiceError 타입 가드가 동작해야 한다", () => {
      const error = new TestimonialServiceError("NOT_FOUND", 404, "에러");
      expect(isTestimonialServiceError(error)).toBe(true);
      expect(isTestimonialServiceError(new Error("일반 에러"))).toBe(false);
    });
  });

  describe("RELATIONSHIP_PRESETS", () => {
    it("기본 관계 프리셋이 정의되어야 한다", () => {
      expect(RELATIONSHIP_PRESETS).toContain("동료");
      expect(RELATIONSHIP_PRESETS).toContain("상사");
      expect(RELATIONSHIP_PRESETS).toContain("멘토");
      expect(RELATIONSHIP_PRESETS).toContain("클라이언트");
      expect(RELATIONSHIP_PRESETS.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("TestimonialStatus enum", () => {
    it("4개 상태가 정의되어야 한다", () => {
      expect(TestimonialStatus.PENDING).toBe("PENDING");
      expect(TestimonialStatus.SUBMITTED).toBe("SUBMITTED");
      expect(TestimonialStatus.APPROVED).toBe("APPROVED");
      expect(TestimonialStatus.REJECTED).toBe("REJECTED");
    });
  });
});
