CREATE INDEX "notes_ownerId_deletedAt_updatedAt_idx" ON "notes"("ownerId", "deletedAt", "updatedAt");

DROP INDEX IF EXISTS "note_edges_fromId_status_idx";
DROP INDEX IF EXISTS "note_edges_toId_status_idx";

CREATE INDEX "note_edges_fromId_status_weight_updatedAt_idx" ON "note_edges"("fromId", "status", "weight", "updatedAt");
CREATE INDEX "note_edges_toId_status_weight_updatedAt_idx" ON "note_edges"("toId", "status", "weight", "updatedAt");
CREATE INDEX "note_edges_status_weight_updatedAt_idx" ON "note_edges"("status", "weight", "updatedAt");
