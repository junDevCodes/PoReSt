import { requireAuth, requireOwner } from "@/lib/auth-guard";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/auth", () => ({
  authOptions: {},
}));

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("auth-guard", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
  });

  it("세션이 없으면 requireAuth가 401을 반환해야 한다", async () => {
    // Arrange: 세션 없음
    mockedGetServerSession.mockResolvedValueOnce(null);

    // Act: 인증 요구 실행
    const result = await requireAuth();

    // Assert: 401 응답 확인
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        error: "인증이 필요합니다.",
      });
    }
  });

  it("오너가 아니면 requireOwner가 403을 반환해야 한다", async () => {
    // Arrange: 오너가 아닌 세션
    const session = {
      user: { id: "user-1", isOwner: false, email: "user@example.com" },
    } as Session;
    mockedGetServerSession.mockResolvedValueOnce(session);

    // Act: 오너 요구 실행
    const result = await requireOwner();

    // Assert: 403 응답 확인
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        error: "오너 권한이 필요합니다.",
      });
    }
  });

  it("오너이면 requireOwner가 세션을 반환해야 한다", async () => {
    // Arrange: 오너 세션
    const session = {
      user: { id: "owner-1", isOwner: true, email: "owner@example.com" },
    } as Session;
    mockedGetServerSession.mockResolvedValueOnce(session);

    // Act: 오너 요구 실행
    const result = await requireOwner();

    // Assert: 세션 반환 확인
    expect("session" in result).toBe(true);
    if ("session" in result) {
      expect(result.session.user.id).toBe("owner-1");
      expect(result.session.user.isOwner).toBe(true);
    }
  });
});
