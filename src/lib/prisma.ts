import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// DATABASE_URL 확인
const primaryUrl = process.env.DATABASE_URL ?? "";
const fallbackUrl = process.env.DATABASE_URL_UNPOOLED ?? "";
const databaseUrl = primaryUrl || fallbackUrl;
const shouldDebug = process.env.NEXTAUTH_DEBUG === "true";

if (shouldDebug) {
  if (!primaryUrl && !fallbackUrl) {
    console.log("DATABASE_URL 상태: 미설정");
  } else {
    try {
      const host = new URL(databaseUrl).host;
      const source = primaryUrl ? "DATABASE_URL" : "DATABASE_URL_UNPOOLED";
      console.log(`DATABASE_URL 상태: 설정됨 (${source}, ${host})`);
    } catch {
      console.log("DATABASE_URL 상태: 파싱 실패");
    }
  }
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL 또는 DATABASE_URL_UNPOOLED 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요."
  );
}

if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const adapter = new PrismaNeon({ connectionString: databaseUrl });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
