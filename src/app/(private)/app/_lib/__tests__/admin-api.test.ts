import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

function buildResponse(payload: unknown, options?: { ok?: boolean; status?: number }): Response {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => payload,
  } as Response;
}

describe("parseApiResponse", () => {
  it("성공 응답이면 data를 반환해야 한다", async () => {
    const result = await parseApiResponse<{ id: string }>(
      buildResponse({ data: { id: "item-1" } }, { ok: true, status: 200 }),
    );

    expect(result).toEqual({
      data: { id: "item-1" },
      error: null,
      fields: null,
    });
  });

  it("네트워크 예외가 전달되면 사용자 메시지를 반환해야 한다", async () => {
    const result = await parseApiResponse<{ id: string }>(new TypeError("fetch failed"));

    expect(result).toEqual({
      data: null,
      error: "네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.",
      fields: null,
    });
  });

  it("실패 응답이면 API 에러 메시지를 반환해야 한다", async () => {
    const result = await parseApiResponse<{ id: string }>(
      buildResponse(
        {
          error: {
            message: "유효하지 않은 요청입니다.",
            fields: {
              displayName: "표시 이름은 필수입니다.",
            },
          },
        },
        { ok: false, status: 400 },
      ),
    );

    expect(result).toEqual({
      data: null,
      error: "유효하지 않은 요청입니다.",
      fields: {
        displayName: "표시 이름은 필수입니다.",
      },
    });
  });
});
