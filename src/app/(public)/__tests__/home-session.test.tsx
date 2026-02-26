import { getServerSession } from "next-auth";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "@/app/(public)/page";

const mockGetHomeShowcase = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

jest.mock("@/modules/projects", () => ({
  createProjectsService: () => ({
    getHomeShowcase: (...args: unknown[]) => mockGetHomeShowcase(...args),
  }),
}));

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("Test-M6-08 홈 이동 세션 유지", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockGetHomeShowcase.mockReset();
    mockGetHomeShowcase.mockResolvedValue({
      recommended: [],
      latest: [],
    });
  });

  it("로그인 세션이 있으면 홈에서 워크스페이스 이동 CTA를 노출해야 한다", async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: {
        id: "user-1",
        isOwner: false,
        name: "테스터",
        email: "tester@example.com",
      },
      expires: "2099-01-01T00:00:00.000Z",
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain('href="/app"');
    expect(html).toContain("워크스페이스로 이동");
  });

  it("Test-M6-09 로그인 세션이 있으면 회원가입 CTA를 노출하지 않아야 한다", async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: {
        id: "user-1",
        isOwner: false,
        name: "테스터",
        email: "tester@example.com",
      },
      expires: "2099-01-01T00:00:00.000Z",
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).not.toContain('href="/signup"');
  });
});
