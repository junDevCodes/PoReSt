CREATE INDEX IF NOT EXISTS "note_embeddings_status_chunk_updatedAt_idx"
  ON "note_embeddings"("status", "chunkIndex", "updatedAt");

CREATE INDEX IF NOT EXISTS "note_embeddings_embedding_cosine_idx"
  ON "note_embeddings"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100)
  WHERE "embedding" IS NOT NULL
    AND "status" = 'SUCCEEDED'
    AND "chunkIndex" = 0;
