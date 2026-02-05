import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // 마이그레이션/CLI는 pooled(DB pooler) 대신 direct connection을 사용한다.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
