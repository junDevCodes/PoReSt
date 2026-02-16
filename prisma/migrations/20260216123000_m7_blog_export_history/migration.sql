-- G7 Blog Export 이력화 모델 추가
CREATE TABLE "blog_export_artifacts" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "blogPostId" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "snapshotHash" TEXT NOT NULL,
  "payload" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "blog_export_artifacts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "blog_export_artifacts"
  ADD CONSTRAINT "blog_export_artifacts_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_export_artifacts"
  ADD CONSTRAINT "blog_export_artifacts_blogPostId_fkey"
  FOREIGN KEY ("blogPostId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "blog_export_artifacts_ownerId_createdAt_idx"
  ON "blog_export_artifacts"("ownerId", "createdAt");

CREATE INDEX "blog_export_artifacts_blogPostId_createdAt_idx"
  ON "blog_export_artifacts"("blogPostId", "createdAt");
