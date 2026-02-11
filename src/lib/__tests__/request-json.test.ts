import { MAX_JSON_BODY_BYTES, parseJsonBodyWithLimit } from "@/lib/request-json";

describe("request json parser", () => {
  it("유효한 JSON 본문을 파싱해야 한다", async () => {
    // 준비: 정상 JSON 요청 본문 생성
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ title: "테스트" }),
    });

    // 실행: JSON 파싱
    const result = await parseJsonBodyWithLimit(request);

    // 검증: 파싱 성공과 값 확인
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ title: "테스트" });
    }
  });

  it("올바르지 않은 JSON 본문은 BAD_JSON을 반환해야 한다", async () => {
    // 준비: 잘못된 JSON 문자열 요청 생성
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: '{"title": "테스트"',
    });

    // 실행: JSON 파싱
    const result = await parseJsonBodyWithLimit(request);

    // 검증: BAD_JSON 반환 확인
    expect(result).toEqual({ ok: false, reason: "BAD_JSON" });
  });

  it("1MB를 초과한 본문은 PAYLOAD_TOO_LARGE를 반환해야 한다", async () => {
    // 준비: 제한 크기를 초과하는 본문 생성
    const largeBody = "a".repeat(MAX_JSON_BODY_BYTES + 1);
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: largeBody,
    });

    // 실행: JSON 파싱
    const result = await parseJsonBodyWithLimit(request);

    // 검증: 크기 초과 에러 반환 확인
    expect(result).toEqual({ ok: false, reason: "PAYLOAD_TOO_LARGE" });
  });
});
