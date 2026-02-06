import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// DATABASE_URL 확인
const databaseUrl = process.env.DATABASE_URL ?? "";
const shouldDebug = process.env.NEXTAUTH_DEBUG === "true";

if (shouldDebug) {
  if (!databaseUrl) {
    console.log("DATABASE_URL 확인: 미설정");
  } else {
    try {
      const host = new URL(databaseUrl).host;
      console.log(`DATABASE_URL 확인: ${host}`);
    } catch (error) {
      console.log("DATABASE_URL 확인: 파싱 실패");
    }
  }
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요."
  );
}

const adapter = new PrismaNeon(new Pool({ connectionString: databaseUrl }) as any);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
