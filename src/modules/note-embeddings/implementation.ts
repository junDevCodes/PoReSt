import { NoteEmbeddingStatus } from "@prisma/client";
import { z } from "zod";
import type {
  NoteEmbeddingPipelineService,
  NoteEmbeddingPlanInput,
  NoteEmbeddingPlanResult,
  NoteEmbeddingServicePrismaClient,
} from "@/modules/note-embeddings/interface";
import { NoteEmbeddingServiceError } from "@/modules/note-embeddings/interface";

const DEFAULT_REBUILD_LIMIT = 50;
const MAX_REBUILD_LIMIT = 200;
const DEFAULT_EMBEDDING_DIMENSIONS = 1536;

const noteEmbeddingPlanSchema = z.object({
  noteIds: z.array(z.string().min(1)).max(MAX_REBUILD_LIMIT).optional(),
  limit: z.number().int().positive().max(MAX_REBUILD_LIMIT).optional(),
});

function parsePlanInput(input: unknown): NoteEmbeddingPlanInput {
  const parsed = noteEmbeddingPlanSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new NoteEmbeddingServiceError("VALIDATION_ERROR", 422, "임베딩 재빌드 입력값이 올바르지 않습니다.");
  }
  return parsed.data;
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

export function createNoteEmbeddingPipelineService(deps: {
  prisma: NoteEmbeddingServicePrismaClient;
}): NoteEmbeddingPipelineService {
  const { prisma } = deps;

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
            select: {
              id: true,
              contentMd: true,
            },
          })
        : await prisma.note.findMany({
            where: {
              ownerId,
              deletedAt: null,
            },
            orderBy: [{ updatedAt: "desc" }],
            take: parsed.limit ?? DEFAULT_REBUILD_LIMIT,
            select: {
              id: true,
              contentMd: true,
            },
          });

      if (parsed.noteIds?.length) {
        const foundIdSet = new Set(noteRows.map((row) => row.id));
        const missing = parsed.noteIds.filter((id) => !foundIdSet.has(id));
        if (missing.length > 0) {
          throw new NoteEmbeddingServiceError(
            "NOT_FOUND",
            404,
            "재빌드 대상 노트를 찾을 수 없습니다.",
            { noteIds: missing.join(",") },
          );
        }
      }

      for (const row of noteRows) {
        await upsertPendingEmbedding(prisma, row.id, row.contentMd);
      }

      return {
        scheduled: noteRows.length,
        noteIds: noteRows.map((row) => row.id),
      };
    },
  };
}

