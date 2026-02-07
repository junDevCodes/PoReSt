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
    // 준비: 세션 토큰 없음
    mockedGetToken.mockResolvedValueOnce(null);
    const request = new NextRequest("http://localhost:3000/app/projects?tab=all");

    // 실행: 미들웨어 통과
    const response = await middleware(request);

    // 검증: 로그인 경로 및 next 파라미터 확인
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    const decoded = decodeURIComponent(location);
    expect(decoded).toContain("/login");
    expect(decoded).toContain("next=/app/projects?tab=all");
    expect(decoded).toContain("error=unauthorized");
  });

  it("오너가 아닌 사용자는 /login?error=owner로 이동해야 한다", async () => {
    // 준비: 로그인되어 있으나 오너 권한 없음
    mockedGetToken.mockResolvedValueOnce({
      sub: "user-1",
      isOwner: false,
    } as never);
    const request = new NextRequest("http://localhost:3000/app");

    // 실행: 미들웨어 통과
    const response = await middleware(request);

    // 검증: 오너 권한 에러 확인
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("error=owner");
  });

  it("비로그인 사용자의 /api/app 요청은 401 JSON을 반환해야 한다", async () => {
    // 준비: 세션 토큰 없음
    mockedGetToken.mockResolvedValueOnce(null);
    const request = new NextRequest("http://localhost:3000/api/app/projects");

    // 실행: 미들웨어 통과
    const response = await middleware(request);
    const body = await response.json();

    // 검증: API 인증 에러 응답 확인
    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "인증이 필요합니다.",
    });
  });
});
