import { createPortfolioSettingsService, parsePortfolioSettingsUpsertInput } from "@/modules/portfolio-settings/implementation";
import {
  type PortfolioSettingsServicePrismaClient,
  PortfolioSettingsServiceError,
} from "@/modules/portfolio-settings/interface";

describe("portfolio settings validation", () => {
  it("publicSlug 형식이 올바르지 않으면 422 에러를 발생시켜야 한다", () => {
    // 준비: 허용되지 않은 문자가 포함된 슬러그 입력
    const input = {
      publicSlug: "Invalid Slug!",
    };

    // 실행 및 검증: 검증 에러 확인
    expect(() => parsePortfolioSettingsUpsertInput(input)).toThrow(PortfolioSettingsServiceError);

    try {
      parsePortfolioSettingsUpsertInput(input);
    } catch (error) {
      expect(error).toMatchObject({
        code: "VALIDATION_ERROR",
        status: 422,
        fields: {
          publicSlug: "공개 슬러그 형식이 올바르지 않습니다.",
        },
      });
    }
  });

  it("최초 생성에서 publicSlug가 없으면 422 에러를 발생시켜야 한다", async () => {
    // 준비: 설정이 없는 오너와 슬러그 없는 입력
    const prisma = {
      portfolioSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as PortfolioSettingsServicePrismaClient;
    const service = createPortfolioSettingsService({ prisma });

    // 실행 및 검증: 최초 생성 시 슬러그 필수 검증
    await expect(
      service.upsertPortfolioSettingsForOwner("owner-id", {
        displayName: "홍길동",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("수정 입력이 비어 있으면 422 에러를 발생시켜야 한다", () => {
    // 준비: 빈 수정 입력
    const input = {};

    // 실행 및 검증: 최소 1개 필드 검증
    expect(() => parsePortfolioSettingsUpsertInput(input)).toThrow(PortfolioSettingsServiceError);
  });

  it("links 항목 검증에 실패하면 422 에러를 발생시켜야 한다", () => {
    // 준비: 링크 필드가 잘못된 입력
    const input = {
      links: [
        {
          label: "",
          url: "invalid-url",
          order: -1,
        },
      ],
    };

    // 실행 및 검증: 링크 필드 검증 에러 확인
    expect(() => parsePortfolioSettingsUpsertInput(input)).toThrow(PortfolioSettingsServiceError);
  });
});
