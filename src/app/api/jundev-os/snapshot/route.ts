import { NextResponse } from "next/server";
import { loadJundevOsSnapshot } from "@/lib/jundevos-snapshot";

// V1.1 (jundev-os v3.0.0) — public read-only snapshot endpoint
// 사용처: dashboard refresh button, 외부 fetch (GitHub README 등), 디버깅
// 인증: 불필요 (snapshot은 publicVaultIndex로 sanitize됨, body 영구 X)
// ISR: revalidate 60s (재현재 갱신은 npm run snapshot:sync + commit 후 deploy)
export const revalidate = 60;

export async function GET() {
  const snapshot = loadJundevOsSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
