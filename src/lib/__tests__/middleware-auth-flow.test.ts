import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import middleware from "../../../middleware";

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe("middleware auth flow", () => {
  beforeEach(() => {
    mockedGetToken.mockReset();
  });

  it("비로그인 사용자가 /app 접근 시 /login?next=...로 이동해야 한다", async () => {
    mockedGetToken.mockResolvedValueOnce(null);
    const request = new NextRequest("http://localhost:3000/app/projects?tab=all");

    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    const decoded = decodeURIComponent(location);
    expect(decoded).toContain("/login");
    expect(decoded).toContain("next=/app/projects?tab=all");
    expect(decoded).toContain("error=unauthorized");
  });

  it("로그인 사용자는 isOwner=false여도 /app 접근이 허용되어야 한다", async () => {
    mockedGetToken.mockResolvedValueOnce({
      sub: "user-1",
      isOwner: false,
    } as never);
    const request = new NextRequest("http://localhost:3000/app");

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("비로그인 사용자의 /api/app 요청은 401 JSON을 반환해야 한다", async () => {
    mockedGetToken.mockResolvedValueOnce(null);
    const request = new NextRequest("http://localhost:3000/api/app/projects");

    const response = await middleware(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual(
      expect.objectContaining({
        error: "인증이 필요합니다.",
        requestId: expect.any(String),
      }),
    );
  });
});

