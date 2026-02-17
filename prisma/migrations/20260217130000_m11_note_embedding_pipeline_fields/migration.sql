-- G11 NoteEmbedding 운영 필드 추가
CREATE TYPE "NoteEmbeddingStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

ALTER TABLE "note_embeddings"
  ADD COLUMN "status" "NoteEmbeddingStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "lastEmbeddedAt" TIMESTAMP(3),
  ADD COLUMN "error" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "note_embeddings"
SET
  "status" = 'SUCCEEDED',
  "lastEmbeddedAt" = "createdAt"
WHERE "embedding" IS NOT NULL;

CREATE INDEX "note_embeddings_noteId_status_updatedAt_idx"
  ON "note_embeddings"("noteId", "status", "updatedAt");

