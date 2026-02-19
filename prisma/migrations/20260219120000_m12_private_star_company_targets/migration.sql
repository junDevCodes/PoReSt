-- M12 Private 기능: Experience STAR 스토리 + 기업 분석 타겟

CREATE TYPE "CompanyTargetStatus" AS ENUM (
  'INTERESTED',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'ARCHIVED'
);

CREATE TABLE "experience_stories" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "situation" TEXT NOT NULL,
  "task" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL,
  "metricsJson" JSONB,
  "linksJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "experience_stories_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "experience_stories"
  ADD CONSTRAINT "experience_stories_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "experience_stories"
  ADD CONSTRAINT "experience_stories_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "experience_stories_ownerId_updatedAt_idx"
  ON "experience_stories"("ownerId", "updatedAt");

CREATE INDEX "experience_stories_experienceId_updatedAt_idx"
  ON "experience_stories"("experienceId", "updatedAt");

CREATE TABLE "company_targets" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" "CompanyTargetStatus" NOT NULL DEFAULT 'INTERESTED',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "summary" TEXT,
  "analysisMd" TEXT,
  "linksJson" JSONB,
  "tags" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_targets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "company_targets"
  ADD CONSTRAINT "company_targets_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "company_targets_ownerId_company_role_key"
  ON "company_targets"("ownerId", "company", "role");

CREATE INDEX "company_targets_ownerId_status_updatedAt_idx"
  ON "company_targets"("ownerId", "status", "updatedAt");

CREATE INDEX "company_targets_ownerId_priority_updatedAt_idx"
  ON "company_targets"("ownerId", "priority", "updatedAt");

