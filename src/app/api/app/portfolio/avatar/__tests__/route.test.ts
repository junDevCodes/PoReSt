jest.mock("@/lib/auth-guard", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@vercel/blob", () => ({
  put: jest.fn(),
}));

import { requireAuth } from "@/lib/auth-guard";
import { put } from "@vercel/blob";
import { POST } from "@/app/api/app/portfolio/avatar/route";

const mockRequireAuth = requireAuth as jest.Mock;
const mockPut = put as jest.Mock;

const AUTHED_RESULT = {
  session: { user: { id: "user-1", isOwner: true } },
};

function buildFormDataRequest(file: File): Request {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost/api/app/portfolio/avatar", {
    method: "POST",
    body: formData,
  });
}

describe("Test-M6-13 POST /api/app/portfolio/avatar", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockPut.mockReset();
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("인증 없이 요청 시 401을 반환한다", async () => {
    mockRequireAuth.mockResolvedValue({
      response: new Response(JSON.stringify({ error: "인증이 필요합니다." }), { status: 401 }),
    });

    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const req = buildFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("허용 MIME 타입이 아닌 파일 업로드 시 415를 반환한다", async () => {
    mockRequireAuth.mockResolvedValue(AUTHED_RESULT);
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    const file = new File(["data"], "script.pdf", { type: "application/pdf" });
    const req = buildFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(415);
  });

  it("5MB 초과 파일 업로드 시 413을 반환한다", async () => {
    mockRequireAuth.mockResolvedValue(AUTHED_RESULT);
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    const bigBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([bigBuffer], "big.png", { type: "image/png" });
    const req = buildFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(413);
  });

  it("BLOB_READ_WRITE_TOKEN 미설정 시 500을 반환한다", async () => {
    mockRequireAuth.mockResolvedValue(AUTHED_RESULT);
    // BLOB_READ_WRITE_TOKEN not set

    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const req = buildFormDataRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(500);
  });

  it("정상 업로드 시 200과 blob URL을 반환한다", async () => {
    mockRequireAuth.mockResolvedValue(AUTHED_RESULT);
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    mockPut.mockResolvedValue({ url: "https://blob.vercel-storage.com/avatar.png" });

    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const req = buildFormDataRequest(file);
    const res = await POST(req);
    const body = (await res.json()) as { data: { url: string } };

    expect(res.status).toBe(200);
    expect(body.data.url).toBe("https://blob.vercel-storage.com/avatar.png");
  });
});
