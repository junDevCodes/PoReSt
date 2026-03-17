/**
 * 이력서 bullets/metrics JSON 안전 파싱 유틸리티
 * 공유 페이지, 편집 프리뷰, PDF 3곳에서 공유
 */

export type MetricEntry = { key: string; value: string };

/**
 * bullets JSON → string[] 안전 변환
 * null, undefined, 숫자, 비배열 → 빈 배열
 */
export function parseBullets(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
    .map((item) => String(item));
}

/**
 * metrics JSON → {key, value}[] 안전 변환
 * null, 비객체, 배열 → 빈 배열
 */
export function parseMetrics(json: unknown): MetricEntry[] {
  if (json === null || json === undefined) return [];
  if (typeof json !== "object" || Array.isArray(json)) return [];

  return Object.entries(json as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));
}
