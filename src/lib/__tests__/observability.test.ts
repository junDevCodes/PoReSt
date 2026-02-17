import { resolveRequestIdFromHeaders, writeStructuredLog } from "@/lib/observability";

describe("observability", () => {
  it("유효한 request id 헤더가 있으면 그대로 반환해야 한다", () => {
    const headers = new Headers();
    headers.set("x-request-id", "req-abc-123456");

    const requestId = resolveRequestIdFromHeaders(headers);
    expect(requestId).toBe("req-abc-123456");
  });

  it("유효하지 않은 request id 헤더면 새 값을 생성해야 한다", () => {
    const headers = new Headers();
    headers.set("x-request-id", "bad");

    const requestId = resolveRequestIdFromHeaders(headers);
    expect(requestId).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
    expect(requestId).not.toBe("bad");
  });

  it("구조화 로그는 JSON 문자열로 출력해야 한다", () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    writeStructuredLog("info", "test.event", { requestId: "req-1", value: 1 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(infoSpy.mock.calls[0][0])) as {
      ts: string;
      level: string;
      event: string;
      requestId: string;
      value: number;
    };
    expect(payload.level).toBe("info");
    expect(payload.event).toBe("test.event");
    expect(payload.requestId).toBe("req-1");
    expect(payload.value).toBe(1);

    infoSpy.mockRestore();
  });
});

