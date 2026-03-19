-- T97: 합격 자소서 RAG 파이프라인 — CoverLetter + CoverLetterEmbedding

-- Enums
CREATE TYPE "CoverLetterStatus" AS ENUM ('DRAFT', 'FINAL');
CREATE TYPE "CoverLetterEmbeddingStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CoverLetter 테이블
CREATE TABLE "cover_letters" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "CoverLetterStatus" NOT NULL DEFAULT 'DRAFT',
    "isReference" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "targetCompany" TEXT,
    "targetRole" TEXT,
    "contentMd" TEXT NOT NULL,
    "resumeId" TEXT,
    "experienceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cover_letters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cover_letters_ownerId_status_updatedAt_idx"
  ON "cover_letters"("ownerId", "status", "updatedAt");
CREATE INDEX "cover_letters_ownerId_isReference_idx"
  ON "cover_letters"("ownerId", "isReference");
CREATE INDEX "cover_letters_targetCompany_targetRole_idx"
  ON "cover_letters"("targetCompany", "targetRole");

ALTER TABLE "cover_letters"
  ADD CONSTRAINT "cover_letters_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CoverLetterEmbedding 테이블
CREATE TABLE "cover_letter_embeddings" (
    "id" TEXT NOT NULL,
    "coverLetterId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "status" "CoverLetterEmbeddingStatus" NOT NULL DEFAULT 'PENDING',
    "lastEmbeddedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cover_letter_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cover_letter_embeddings_coverLetterId_chunkIndex_idx"
  ON "cover_letter_embeddings"("coverLetterId", "chunkIndex");
CREATE INDEX "cover_letter_embeddings_coverLetterId_status_updatedAt_idx"
  ON "cover_letter_embeddings"("coverLetterId", "status", "updatedAt");
CREATE INDEX "cover_letter_embeddings_status_chunkIndex_updatedAt_idx"
  ON "cover_letter_embeddings"("status", "chunkIndex", "updatedAt");

ALTER TABLE "cover_letter_embeddings"
  ADD CONSTRAINT "cover_letter_embeddings_coverLetterId_fkey"
  FOREIGN KEY ("coverLetterId") REFERENCES "cover_letters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- IVFFlat 코사인 유사도 인덱스 (합격 자소서 검색용)
CREATE INDEX IF NOT EXISTS "cover_letter_embeddings_embedding_cosine_idx"
  ON "cover_letter_embeddings"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 50)
  WHERE "embedding" IS NOT NULL
    AND "status" = 'SUCCEEDED'
    AND "chunkIndex" = 0;
