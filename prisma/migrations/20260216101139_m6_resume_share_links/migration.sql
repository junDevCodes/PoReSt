-- CreateTable
CREATE TABLE "resume_share_links" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_share_links_token_key" ON "resume_share_links"("token");

-- CreateIndex
CREATE INDEX "resume_share_links_resumeId_isRevoked_createdAt_idx" ON "resume_share_links"("resumeId", "isRevoked", "createdAt");

-- AddForeignKey
ALTER TABLE "resume_share_links" ADD CONSTRAINT "resume_share_links_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
