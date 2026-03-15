import { NoteEmbeddingStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import type {
  NoteEmbeddingPipelineService,
  NoteEmbeddingPlanInput,
  NoteEmbeddingPlanResult,
  NoteEmbeddingRunResult,
  NoteEmbeddingServicePrismaClient,
  NoteEmbeddingSimilarNoteDto,
} from "@/modules/note-embeddings/interface";
import { NoteEmbeddingServiceError } from "@/modules/note-embeddings/interface";
import type { GeminiClient } from "@/modules/gemini/interface";
import { getDefaultGeminiClient, withGeminiFallback } from "@/modules/gemini/implementation";

const DEFAULT_REBUILD_LIMIT = 50;
const MAX_REBUILD_LIMIT = 200;
const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_SIMILAR_LIMIT = 5;
const MAX_SIMILAR_LIMIT = 20;
const DEFAULT_MIN_SCORE = 0.5;
const MAX_EMBEDDING_CONTENT_LENGTH = 9500;

const noteEmbeddingPlanSchema = z.object({
  noteIds: z.array(z.string().min(1)).max(MAX_REBUILD_LIMIT).optional(),
  limit: z.number().int().positive().max(MAX_REBUILD_LIMIT).optional(),
});

const noteEmbeddingSimilarSearchSchema = z.object({
  limit: z.number().int().positive().max(MAX_SIMILAR_LIMIT).optional(),
  minScore: z.number().min(0).max(1).optional(),
});

type NormalizedSimilarSearchInput = {
  limit: number;
  minScore: number;
};

type SimilarQueryRow = {
  noteId: string;
  score: number | string | Prisma.Decimal;
};

type NoteContentFields = {
  title: string;
  contentMd: string;
  tags: string[];
  summary: string | null;
};

const NOTE_CONTENT_SELECT = {
  id: true,
  title: true,
  contentMd: true,
  tags: true,
  summary: true,
} as const;

function parsePlanInput(input: unknown): NoteEmbeddingPlanInput {
  const parsed = noteEmbeddingPlanSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new NoteEmbeddingServiceError("VALIDATION_ERROR", 422, "임베딩 재빌드 입력값이 올바르지 않습니다.");
  }
  return parsed.data;
}

function parseSimilarSearchInput(input: unknown): NormalizedSimilarSearchInput {
  const parsed = noteEmbeddingSimilarSearchSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new NoteEmbeddingServiceError("VALIDATION_ERROR", 422, "유사도 검색 입력값이 올바르지 않습니다.");
  }

  return {
    limit: parsed.data.limit ?? DEFAULT_SIMILAR_LIMIT,
    minScore: parsed.data.minScore ?? DEFAULT_MIN_SCORE,
  };
}

/** 노트 필드를 임베딩용 단일 텍스트로 조합 (Gemini 입력 길이 제한 내 자동 절삭) */
export function buildEmbeddingContent(note: NoteContentFields): string {
  const parts: string[] = [note.title];

  if (note.tags.length > 0) {
    parts.push(note.tags.join(", "));
  }

  if (note.summary) {
    parts.push(note.summary);
  }

  parts.push(note.contentMd);

  return parts.join("\n").slice(0, MAX_EMBEDDING_CONTENT_LENGTH);
}

export function buildDeterministicEmbeddingVector(
  content: string,
  dimensions = DEFAULT_EMBEDDING_DIMENSIONS,
): number[] {
  const vector = new Array(Math.max(1, dimensions)).fill(0) as number[];
  const normalized = content.trim().toLowerCase();

  if (!normalized) {
    return vector;
  }

  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);
    const offset = (code * 31 + index * 17) % vector.length;
    vector[offset] += (code % 97) / 100;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

async function upsertPendingEmbedding(
  prisma: NoteEmbeddingServicePrismaClient,
  noteId: string,
  content: string,
) {
  const existing = await prisma.noteEmbedding.findFirst({
    where: {
      noteId,
      chunkIndex: 0,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.noteEmbedding.update({
      where: { id: existing.id },
      data: {
        content,
        status: NoteEmbeddingStatus.PENDING,
        lastEmbeddedAt: null,
        error: null,
      },
      select: { id: true },
    });
    return;
  }

  await prisma.noteEmbedding.create({
    data: {
      noteId,
      chunkIndex: 0,
      content,
      status: NoteEmbeddingStatus.PENDING,
    },
    select: { id: true },
  });
}

function buildVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 500);
  }
  return String(error).slice(0, 500);
}

function toSafeScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(6));
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return Number(parsed.toFixed(6));
    }
  }

  if (value instanceof Prisma.Decimal) {
    return Number(value.toFixed(6));
  }

  return 0;
}

async function applyEmbeddingVector(
  prisma: NoteEmbeddingServicePrismaClient,
  embeddingId: string,
  vector: number[],
) {
  const vectorLiteral = buildVectorLiteral(vector);
  await prisma.$executeRawUnsafe(
    `UPDATE "note_embeddings"
        SET "embedding" = '${vectorLiteral}'::vector,
            "status" = 'SUCCEEDED',
            "lastEmbeddedAt" = CURRENT_TIMESTAMP,
            "error" = NULL,
            "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    embeddingId,
  );
}

async function findSimilarNoteRows(
  prisma: NoteEmbeddingServicePrismaClient,
  ownerId: string,
  noteId: string,
  input: NormalizedSimilarSearchInput,
): Promise<SimilarQueryRow[]> {
  return prisma.$queryRaw<SimilarQueryRow[]>(Prisma.sql`
    SELECT
      candidate."noteId" AS "noteId",
      GREATEST(
        0,
        LEAST(
          1,
          1 - (candidate."embedding" <=> source."embedding")
        )
      )::double precision AS "score"
    FROM "note_embeddings" AS candidate
    JOIN "notes" AS candidate_note
      ON candidate_note."id" = candidate."noteId"
    JOIN (
      SELECT "embedding"
      FROM "note_embeddings"
      WHERE "noteId" = ${noteId}
        AND "chunkIndex" = 0
        AND "status" = ${NoteEmbeddingStatus.SUCCEEDED}
        AND "embedding" IS NOT NULL
      ORDER BY "updatedAt" DESC, "id" DESC
      LIMIT 1
    ) AS source ON TRUE
    WHERE candidate_note."ownerId" = ${ownerId}
      AND candidate_note."deletedAt" IS NULL
      AND candidate."chunkIndex" = 0
      AND candidate."status" = ${NoteEmbeddingStatus.SUCCEEDED}
      AND candidate."embedding" IS NOT NULL
      AND candidate."noteId" <> ${noteId}
      AND (1 - (candidate."embedding" <=> source."embedding")) >= ${input.minScore}
    ORDER BY candidate."embedding" <=> source."embedding" ASC, candidate."updatedAt" DESC
    LIMIT ${input.limit}
  `);
}

/** Gemini + fallback 으로 임베딩 벡터 생성 */
async function generateEmbeddingVector(
  geminiClient: GeminiClient,
  content: string,
): Promise<number[]> {
  const { result } = await withGeminiFallback(
    geminiClient,
    async () => {
      const { embedding } = await geminiClient.generateEmbedding(content);
      return embedding;
    },
    () => buildDeterministicEmbeddingVector(content),
  );
  return result;
}

export function createNoteEmbeddingPipelineService(deps: {
  prisma: NoteEmbeddingServicePrismaClient;
  geminiClient?: GeminiClient;
}): NoteEmbeddingPipelineService {
  const { prisma } = deps;
  const geminiClient = deps.geminiClient ?? getDefaultGeminiClient();

  return {
    async prepareRebuildForOwner(ownerId, input): Promise<NoteEmbeddingPlanResult> {
      const parsed = parsePlanInput(input);

      const noteRows = parsed.noteIds?.length
        ? await prisma.note.findMany({
            where: {
              ownerId,
              id: { in: parsed.noteIds },
              deletedAt: null,
            },
            select: NOTE_CONTENT_SELECT,
          })
        : await prisma.note.findMany({
            where: {
              ownerId,
              deletedAt: null,
            },
            orderBy: [{ updatedAt: "desc" }],
            take: parsed.limit ?? DEFAULT_REBUILD_LIMIT,
            select: NOTE_CONTENT_SELECT,
          });

      if (parsed.noteIds?.length) {
        const foundIdSet = new Set(noteRows.map((row) => row.id));
        const missing = parsed.noteIds.filter((id) => !foundIdSet.has(id));
        if (missing.length > 0) {
          throw new NoteEmbeddingServiceError("NOT_FOUND", 404, "일부 노트를 찾을 수 없습니다.", {
            noteIds: missing.join(","),
          });
        }
      }

      for (const row of noteRows) {
        const content = buildEmbeddingContent(row);
        await upsertPendingEmbedding(prisma, row.id, content);
      }

      return {
        scheduled: noteRows.length,
        noteIds: noteRows.map((row) => row.id),
      };
    },

    async rebuildForOwner(ownerId, input): Promise<NoteEmbeddingRunResult> {
      const planned = await this.prepareRebuildForOwner(ownerId, input);
      if (planned.scheduled === 0) {
        return {
          scheduled: 0,
          succeeded: 0,
          failed: 0,
          noteIds: [],
        };
      }

      const pendingRows = await prisma.noteEmbedding.findMany({
        where: {
          noteId: { in: planned.noteIds },
          chunkIndex: 0,
          status: NoteEmbeddingStatus.PENDING,
          note: {
            ownerId,
            deletedAt: null,
          },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });

      let succeeded = 0;
      let failed = 0;

      for (const row of pendingRows) {
        try {
          const vector = await generateEmbeddingVector(geminiClient, row.content);
          await applyEmbeddingVector(prisma, row.id, vector);
          succeeded += 1;
        } catch (error) {
          await prisma.noteEmbedding.update({
            where: { id: row.id },
            data: {
              status: NoteEmbeddingStatus.FAILED,
              error: normalizeErrorMessage(error),
            },
            select: { id: true },
          });
          failed += 1;
        }
      }

      return {
        scheduled: planned.scheduled,
        succeeded,
        failed,
        noteIds: planned.noteIds,
      };
    },

    async embedSingleNote(ownerId, noteId): Promise<NoteEmbeddingRunResult> {
      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          ownerId,
          deletedAt: null,
        },
        select: NOTE_CONTENT_SELECT,
      });

      if (!note) {
        return { scheduled: 0, succeeded: 0, failed: 0, noteIds: [] };
      }

      const content = buildEmbeddingContent(note);
      await upsertPendingEmbedding(prisma, note.id, content);

      const pendingRow = await prisma.noteEmbedding.findFirst({
        where: {
          noteId: note.id,
          chunkIndex: 0,
          status: NoteEmbeddingStatus.PENDING,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });

      if (!pendingRow) {
        return { scheduled: 1, succeeded: 0, failed: 1, noteIds: [noteId] };
      }

      try {
        const vector = await generateEmbeddingVector(geminiClient, pendingRow.content);
        await applyEmbeddingVector(prisma, pendingRow.id, vector);
        return { scheduled: 1, succeeded: 1, failed: 0, noteIds: [noteId] };
      } catch (error) {
        await prisma.noteEmbedding.update({
          where: { id: pendingRow.id },
          data: {
            status: NoteEmbeddingStatus.FAILED,
            error: normalizeErrorMessage(error),
          },
          select: { id: true },
        });
        return { scheduled: 1, succeeded: 0, failed: 1, noteIds: [noteId] };
      }
    },

    async searchSimilarNotesForOwner(ownerId, noteId, input): Promise<NoteEmbeddingSimilarNoteDto[]> {
      const parsed = parseSimilarSearchInput(input);

      const sourceNote = await prisma.note.findFirst({
        where: {
          id: noteId,
          ownerId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!sourceNote) {
        throw new NoteEmbeddingServiceError("NOT_FOUND", 404, "기준 노트를 찾을 수 없습니다.");
      }

      const rows = await findSimilarNoteRows(prisma, ownerId, noteId, parsed);
      if (rows.length === 0) {
        return [];
      }

      const noteIds = rows.map((row) => row.noteId);
      const notes = await prisma.note.findMany({
        where: {
          ownerId,
          deletedAt: null,
          id: { in: noteIds },
        },
        select: {
          id: true,
          title: true,
          summary: true,
          tags: true,
          updatedAt: true,
          notebook: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const noteById = new Map(notes.map((note) => [note.id, note]));
      const result: NoteEmbeddingSimilarNoteDto[] = [];

      for (const row of rows) {
        const matched = noteById.get(row.noteId);
        if (!matched) {
          continue;
        }

        result.push({
          noteId: matched.id,
          title: matched.title,
          summary: matched.summary,
          tags: matched.tags,
          notebook: {
            id: matched.notebook.id,
            name: matched.notebook.name,
          },
          updatedAt: matched.updatedAt,
          score: toSafeScore(row.score),
        });
      }

      return result;
    },
  };
}

/** 노트 생성/수정 후 비동기 임베딩 트리거 (fire-and-forget) */
export function queueEmbeddingForNote(
  service: NoteEmbeddingPipelineService,
  ownerId: string,
  noteId: string,
): void {
  service.embedSingleNote(ownerId, noteId).catch((error) => {
    console.warn("임베딩 자동 생성 실패:", error instanceof Error ? error.message : error);
  });
}
