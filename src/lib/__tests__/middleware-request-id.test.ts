import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import middleware from "../../../middleware";

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

const REQUEST_ID_HEADER = "x-request-id";

function readRequestId(response: Response): string {
  return response.headers.get(REQUEST_ID_HEADER) ?? "";
}

describe("middleware request id", () => {
  beforeEach(() => {
    mockedGetToken.mockReset();
  });

  it("비로그인 API 요청은 request id를 헤더/바디에 함께 반환해야 한다", async () => {
    mockedGetToken.mockResolvedValueOnce(null);
    const request = new NextRequest("http://localhost:3000/api/app/projects");

    const response = await middleware(request);
    const body = await response.json();
    const requestId = readRequestId(response);

    expect(response.status).toBe(401);
    expect(requestId).not.toHaveLength(0);
    expect(body).toEqual({
      error: "인증이 필요합니다.",
      requestId,
    });
  });

  it("요청 헤더에 request id가 있으면 그대로 유지해야 한다", async () => {
    mockedGetToken.mockResolvedValueOnce({
      sub: "user-1",
      isOwner: false,
    } as never);

    const headers = new Headers();
    headers.set(REQUEST_ID_HEADER, "req-test-12345678");
    const request = new NextRequest("http://localhost:3000/app/projects", { headers });

    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(readRequestId(response)).toBe("req-test-12345678");
  });

  it("요청 헤더에 request id가 없으면 새 request id를 생성해야 한다", async () => {
    mockedGetToken.mockResolvedValueOnce({
      sub: "user-1",
      isOwner: false,
    } as never);
    const request = new NextRequest("http://localhost:3000/app/projects");

    const response = await middleware(request);
    const requestId = readRequestId(response);

    expect(response.status).toBe(200);
    expect(requestId).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
  });
});

