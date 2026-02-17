-- G10 DomainLink 기본 스키마
CREATE TYPE "DomainLinkEntityType" AS ENUM ('PROJECT', 'EXPERIENCE', 'RESUME', 'NOTE', 'BLOG_POST');

CREATE TABLE "domain_links" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "sourceType" "DomainLinkEntityType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "targetType" "DomainLinkEntityType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "context" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "domain_links_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "domain_links"
  ADD CONSTRAINT "domain_links_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "domain_links_ownerId_sourceType_sourceId_targetType_targetId_key"
  ON "domain_links"("ownerId", "sourceType", "sourceId", "targetType", "targetId");

CREATE INDEX "domain_links_ownerId_sourceType_sourceId_updatedAt_idx"
  ON "domain_links"("ownerId", "sourceType", "sourceId", "updatedAt");

CREATE INDEX "domain_links_ownerId_targetType_targetId_updatedAt_idx"
  ON "domain_links"("ownerId", "targetType", "targetId", "updatedAt");

ALTER TABLE "domain_links"
  ADD CONSTRAINT "domain_links_source_target_not_same"
  CHECK (NOT ("sourceType" = "targetType" AND "sourceId" = "targetId"));

