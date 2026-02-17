export const REQUEST_ID_HEADER = "x-request-id";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export type StructuredLogLevel = "info" | "warn" | "error";

export type StructuredLogFields = Record<string, unknown>;

function buildRequestIdFallback(): string {
  return crypto.randomUUID();
}

export function resolveRequestIdFromHeaders(headers: Headers): string {
  const candidate = headers.get(REQUEST_ID_HEADER)?.trim();
  if (candidate && REQUEST_ID_PATTERN.test(candidate)) {
    return candidate;
  }
  return buildRequestIdFallback();
}

export function buildForwardedHeaders(headers: Headers, requestId: string): Headers {
  const forwarded = new Headers(headers);
  forwarded.set(REQUEST_ID_HEADER, requestId);
  return forwarded;
}

export function writeStructuredLog(
  level: StructuredLogLevel,
  event: string,
  fields: StructuredLogFields = {},
) {
  const payload = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

