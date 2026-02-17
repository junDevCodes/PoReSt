import { reportServerError } from "@/lib/monitoring";

describe("monitoring", () => {
  const originalEnv = process.env;
  let fetchSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };
    fetchSpy = jest.spyOn(global, "fetch");
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    process.env = originalEnv;
  });

  it("Sentry/운영 알림이 비활성화면 외부 전송 없이 종료해야 한다", async () => {
    delete process.env.SENTRY_DSN;
    delete process.env.OPS_ALERT_WEBHOOK_URL;
    fetchSpy.mockImplementation(async () => new Response("", { status: 200 }));

    const result = await reportServerError(
      {
        request: new Request("http://localhost:3000/api/app/test"),
        scope: "api.test",
      },
      new Error("테스트 에러"),
    );

    expect(result.sentryEnabled).toBe(false);
    expect(result.sentryDelivered).toBe(false);
    expect(result.opsAlertEnabled).toBe(false);
    expect(result.opsAlertDelivered).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Sentry DSN이 있으면 Sentry envelope 전송을 시도해야 한다", async () => {
    process.env.SENTRY_DSN = "https://public-key@example.ingest.sentry.io/123456";
    delete process.env.OPS_ALERT_WEBHOOK_URL;
    fetchSpy.mockImplementation(async () => new Response("", { status: 200 }));

    const result = await reportServerError(
      {
        request: new Request("http://localhost:3000/api/app/test"),
        scope: "api.test",
        userId: "user-1",
      },
      new Error("Sentry 전송 테스트"),
    );

    expect(result.sentryEnabled).toBe(true);
    expect(result.sentryDelivered).toBe(true);
    expect(result.opsAlertEnabled).toBe(false);
    expect(result.opsAlertDelivered).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/123456/envelope/");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/x-sentry-envelope",
      }),
    );
  });

  it("Sentry 전송 실패 시 운영 알림 Webhook으로 폴백해야 한다", async () => {
    process.env.SENTRY_DSN = "https://public-key@example.ingest.sentry.io/123456";
    process.env.OPS_ALERT_WEBHOOK_URL = "https://hooks.example.com/services/test";

    fetchSpy
      .mockImplementationOnce(async () => new Response("", { status: 500 }))
      .mockImplementationOnce(async () => new Response("", { status: 200 }));

    const result = await reportServerError(
      {
        request: new Request("http://localhost:3000/api/app/test"),
        scope: "api.test",
        userId: "user-2",
      },
      new Error("폴백 테스트"),
    );

    expect(result.sentryEnabled).toBe(true);
    expect(result.sentryDelivered).toBe(false);
    expect(result.opsAlertEnabled).toBe(true);
    expect(result.opsAlertDelivered).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

