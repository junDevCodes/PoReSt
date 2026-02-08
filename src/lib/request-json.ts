export const MAX_JSON_BODY_BYTES = 1024 * 1024;

export type JsonBodyParseResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "BAD_JSON" | "PAYLOAD_TOO_LARGE" };

export async function parseJsonBodyWithLimit(
  request: Request,
  maxBytes: number = MAX_JSON_BODY_BYTES,
): Promise<JsonBodyParseResult> {
  const rawText = await request.text();
  const bytes = new TextEncoder().encode(rawText).length;
  if (bytes > maxBytes) {
    return { ok: false, reason: "PAYLOAD_TOO_LARGE" };
  }

  try {
    if (rawText.trim().length === 0) {
      return { ok: true, value: {} };
    }
    return { ok: true, value: JSON.parse(rawText) as unknown };
  } catch {
    return { ok: false, reason: "BAD_JSON" };
  }
}
