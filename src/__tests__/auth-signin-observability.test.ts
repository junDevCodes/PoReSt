jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
      upsert: jest.fn(),
    },
    portfolioSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/observability", () => ({
  writeStructuredLog: jest.fn(),
}));

jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

jest.mock("next-auth/providers/github", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "github", name: "GitHub", type: "oauth" })),
}));

import { authOptions } from "@/auth";

type MockPrismaClient = {
  user: {
    update: jest.Mock;
    upsert: jest.Mock;
  };
  portfolioSettings: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

type SignInEventInput = Parameters<
  NonNullable<NonNullable<typeof authOptions.events>["signIn"]>
>[0];

const { prisma: mockPrisma } = jest.requireMock("@/lib/prisma") as {
  prisma: MockPrismaClient;
};
const { writeStructuredLog: mockWriteStructuredLog } = jest.requireMock("@/lib/observability") as {
  writeStructuredLog: jest.Mock;
};
const { PrismaAdapter: mockPrismaAdapter } = jest.requireMock("@auth/prisma-adapter") as {
  PrismaAdapter: jest.Mock;
};
const { default: mockGitHubProvider } = jest.requireMock("next-auth/providers/github") as {
  default: jest.Mock;
};

describe("Test-M6-05 로그인 후처리 관측", () => {
  const signInEvent = authOptions.events?.signIn;

  beforeEach(() => {
    mockPrisma.user.update.mockReset();
    mockPrisma.user.upsert.mockReset();
    mockPrisma.portfolioSettings.findUnique.mockReset();
    mockPrisma.portfolioSettings.create.mockReset();
    mockWriteStructuredLog.mockReset();
    mockPrismaAdapter.mockClear();
    mockGitHubProvider.mockClear();

    mockPrisma.user.update.mockResolvedValue({ id: "user-1" });
    mockPrisma.user.upsert.mockResolvedValue({ id: "user-1" });
    mockPrisma.portfolioSettings.findUnique.mockResolvedValue({ id: "ps-1" });
    mockPrisma.portfolioSettings.create.mockResolvedValue({ id: "ps-1" });
  });

  it("User 정합성 보장이 실패하면 관측 이벤트를 기록해야 한다", async () => {
    if (!signInEvent) {
      throw new Error("authOptions.events.signIn이 정의되지 않았습니다.");
    }

    mockPrisma.user.upsert.mockRejectedValueOnce(new Error("사용자 upsert 실패"));

    await expect(
      signInEvent({
        user: {
          email: "user-fail@example.com",
          name: "실패 사용자",
          isOwner: false,
        },
      } as SignInEventInput),
    ).resolves.toBeUndefined();

    expect(mockWriteStructuredLog).toHaveBeenCalledTimes(1);
    expect(mockWriteStructuredLog).toHaveBeenCalledWith(
      "error",
      "auth.signin.postprocess.failed",
      expect.objectContaining({
        step: "ensureUserRecord",
        userId: null,
        userEmail: "user-fail@example.com",
        errorName: "Error",
        errorMessage: "사용자 upsert 실패",
      }),
    );
  });

  it("PortfolioSettings 정합성 보장이 실패하면 관측 이벤트를 기록해야 한다", async () => {
    if (!signInEvent) {
      throw new Error("authOptions.events.signIn이 정의되지 않았습니다.");
    }

    mockPrisma.portfolioSettings.findUnique.mockResolvedValueOnce(null);
    mockPrisma.portfolioSettings.create.mockRejectedValueOnce(
      new Error("포트폴리오 설정 생성 실패"),
    );

    await expect(
      signInEvent({
        user: {
          id: "user-2",
          email: "settings-fail@example.com",
          name: "설정 실패 사용자",
          isOwner: false,
        },
      } as SignInEventInput),
    ).resolves.toBeUndefined();

    expect(mockWriteStructuredLog).toHaveBeenCalledTimes(1);
    expect(mockWriteStructuredLog).toHaveBeenCalledWith(
      "error",
      "auth.signin.postprocess.failed",
      expect.objectContaining({
        step: "ensurePortfolioSettingsForUser",
        userId: "user-2",
        userEmail: "settings-fail@example.com",
        errorName: "Error",
        errorMessage: "포트폴리오 설정 생성 실패",
      }),
    );
  });
});
