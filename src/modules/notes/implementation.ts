import { NoteEdgeOrigin, NoteEdgeStatus, Prisma, Visibility } from "@prisma/client";
import { z } from "zod";
import type {
  NoteSearchQuery,
  NotesServicePrismaClient,
  NotebookCreateInput,
  NotebookUpdateInput,
} from "@/modules/notes/interface";
import {
  type NoteCreateInput,
  type NoteEdgeActionInput,
  NoteServiceError,
  type NotesService,
} from "@/modules/notes/interface";

const MIN_TEXT_LENGTH = 1;
const MAX_NOTEBOOK_ID_LENGTH = 191;
const MAX_NOTEBOOK_NAME_LENGTH = 100;
const MAX_NOTEBOOK_DESCRIPTION_LENGTH = 1000;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_SUMMARY_LENGTH = 5000;
const MAX_TAG_COUNT = 50;
const MAX_TAG_LENGTH = 50;
const EMPTY_LENGTH = 0;
const CANDIDATE_THRESHOLD = 0.7;
const CANDIDATE_TOP_N = 20;
const DEFAULT_RELATION_TYPE = "related";
const CANDIDATE_DOMAIN_WEIGHT_BONUS = 0.1;
const CANDIDATE_WEIGHT_MAX = 1;

type NormalizedNoteUpdateInput = {
  notebookId?: string;
  visibility?: Visibility;
  title?: string;
  contentMd?: string;
  summary?: string | null;
  tags?: string[];
};

type NormalizedNotebookUpdateInput = {
  name?: string;
  description?: string | null;
};

const createNoteSchema = z.object({
  notebookId: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "노트북 ID는 비어 있을 수 없습니다.")
    .max(MAX_NOTEBOOK_ID_LENGTH, "노트북 ID 길이가 올바르지 않습니다."),
  visibility: z.nativeEnum(Visibility).optional().default(Visibility.PRIVATE),
  title: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "제목은 비어 있을 수 없습니다.")
    .max(MAX_TITLE_LENGTH, "제목은 200자 이하로 입력해주세요."),
  contentMd: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "본문은 비어 있을 수 없습니다.")
    .max(MAX_CONTENT_LENGTH, "본문은 50000자 이하로 입력해주세요."),
  summary: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 5000자 이하로 입력해주세요.").optional().nullable(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(MIN_TEXT_LENGTH, "태그 항목은 비어 있을 수 없습니다.")
        .max(MAX_TAG_LENGTH, "태그는 50자 이하로 입력해주세요."),
    )
    .max(MAX_TAG_COUNT, "태그는 최대 50개까지 입력할 수 있습니다.")
    .optional()
    .default([]),
});

const updateNoteSchema = z
  .object({
    notebookId: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "노트북 ID는 비어 있을 수 없습니다.")
      .max(MAX_NOTEBOOK_ID_LENGTH, "노트북 ID 길이가 올바르지 않습니다.")
      .optional(),
    visibility: z.nativeEnum(Visibility).optional(),
    title: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "제목은 비어 있을 수 없습니다.")
      .max(MAX_TITLE_LENGTH, "제목은 200자 이하로 입력해주세요.")
      .optional(),
    contentMd: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "본문은 비어 있을 수 없습니다.")
      .max(MAX_CONTENT_LENGTH, "본문은 50000자 이하로 입력해주세요.")
      .optional(),
    summary: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 5000자 이하로 입력해주세요.").optional().nullable(),
    tags: z
      .array(
        z
          .string()
          .trim()
          .min(MIN_TEXT_LENGTH, "태그 항목은 비어 있을 수 없습니다.")
          .max(MAX_TAG_LENGTH, "태그는 50자 이하로 입력해주세요."),
      )
      .max(MAX_TAG_COUNT, "태그는 최대 50개까지 입력할 수 있습니다.")
      .optional(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const createNotebookSchema = z.object({
  name: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "노트북 이름은 비어 있을 수 없습니다.")
    .max(MAX_NOTEBOOK_NAME_LENGTH, "노트북 이름은 100자 이하여야 합니다."),
  description: z
    .string()
    .trim()
    .max(MAX_NOTEBOOK_DESCRIPTION_LENGTH, "노트북 설명은 1000자 이하여야 합니다.")
    .optional()
    .nullable(),
});

const updateNotebookSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "노트북 이름은 비어 있을 수 없습니다.")
      .max(MAX_NOTEBOOK_NAME_LENGTH, "노트북 이름은 100자 이하여야 합니다.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(MAX_NOTEBOOK_DESCRIPTION_LENGTH, "노트북 설명은 1000자 이하여야 합니다.")
      .optional()
      .nullable(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const edgeActionSchema = z.object({
  edgeId: z.string().trim().min(MIN_TEXT_LENGTH, "edgeId는 비어 있을 수 없습니다."),
});

const notebookSelect = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  updatedAt: true,
} as const;

const noteListSelect = {
  id: true,
  notebookId: true,
  visibility: true,
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
} as const;

const noteDetailSelect = {
  id: true,
  ownerId: true,
  notebookId: true,
  visibility: true,
  title: true,
  contentMd: true,
  summary: true,
  tags: true,
  updatedAt: true,
  notebook: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const edgeSelect = {
  id: true,
  fromId: true,
  toId: true,
  relationType: true,
  weight: true,
  status: true,
  origin: true,
  reason: true,
  updatedAt: true,
  from: {
    select: {
      id: true,
      title: true,
    },
  },
  to: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

function toNullableString(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > EMPTY_LENGTH ? trimmed : null;
}

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }

  const unique = new Set<string>();
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (normalized.length > EMPTY_LENGTH) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
}

function extractZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}

function normalizeCreateInput(input: z.infer<typeof createNoteSchema>): NoteCreateInput {
  return {
    notebookId: input.notebookId,
    visibility: input.visibility,
    title: input.title,
    contentMd: input.contentMd,
    summary: toNullableString(input.summary),
    tags: normalizeTags(input.tags) ?? [],
  };
}

function normalizeUpdateInput(input: z.infer<typeof updateNoteSchema>): NormalizedNoteUpdateInput {
  const normalized: NormalizedNoteUpdateInput = {};

  if (input.notebookId !== undefined) {
    normalized.notebookId = input.notebookId;
  }
  if (input.visibility !== undefined) {
    normalized.visibility = input.visibility;
  }
  if (input.title !== undefined) {
    normalized.title = input.title;
  }
  if (input.contentMd !== undefined) {
    normalized.contentMd = input.contentMd;
  }
  if (input.summary !== undefined) {
    normalized.summary = toNullableString(input.summary);
  }
  if (input.tags !== undefined) {
    normalized.tags = normalizeTags(input.tags) ?? [];
  }

  return normalized;
}

function normalizeNotebookCreateInput(
  input: z.infer<typeof createNotebookSchema>,
): NotebookCreateInput {
  return {
    name: input.name,
    description: toNullableString(input.description),
  };
}

function normalizeNotebookUpdateInput(
  input: z.infer<typeof updateNotebookSchema>,
): NotebookUpdateInput {
  const normalized: NormalizedNotebookUpdateInput = {};

  if (input.name !== undefined) {
    normalized.name = input.name;
  }
  if (input.description !== undefined) {
    normalized.description = toNullableString(input.description);
  }

  return normalized;
}

export function parseNoteCreateInput(input: unknown): NoteCreateInput {
  try {
    const parsed = createNoteSchema.parse(input);
    return normalizeCreateInput(parsed);
  } catch (error) {
    if (error instanceof NoteServiceError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new NoteServiceError(
        "VALIDATION_ERROR",
        422,
        "노트 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

export function parseNoteUpdateInput(input: unknown): NormalizedNoteUpdateInput {
  try {
    const parsed = updateNoteSchema.parse(input);
    return normalizeUpdateInput(parsed);
  } catch (error) {
    if (error instanceof NoteServiceError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new NoteServiceError(
        "VALIDATION_ERROR",
        422,
        "노트 수정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

export function parseNotebookCreateInput(input: unknown): NotebookCreateInput {
  try {
    const parsed = createNotebookSchema.parse(input);
    return normalizeNotebookCreateInput(parsed);
  } catch (error) {
    if (error instanceof NoteServiceError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new NoteServiceError(
        "VALIDATION_ERROR",
        422,
        "노트북 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

export function parseNotebookUpdateInput(input: unknown): NotebookUpdateInput {
  try {
    const parsed = updateNotebookSchema.parse(input);
    return normalizeNotebookUpdateInput(parsed);
  } catch (error) {
    if (error instanceof NoteServiceError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new NoteServiceError(
        "VALIDATION_ERROR",
        422,
        "노트북 수정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

export function parseNoteEdgeActionInput(input: unknown): NoteEdgeActionInput {
  try {
    return edgeActionSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new NoteServiceError(
        "VALIDATION_ERROR",
        422,
        "노트 엣지 요청 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new NoteServiceError("CONFLICT", 409, "이미 존재하는 데이터입니다.");
    }
    if (error.code === "P2003") {
      throw new NoteServiceError("VALIDATION_ERROR", 422, "참조하는 데이터가 존재하지 않습니다.");
    }
  }

  throw error;
}

async function ensureNotebookOwner(
  prisma: NotesServicePrismaClient,
  ownerId: string,
  notebookId: string,
) {
  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!notebook) {
    throw new NoteServiceError("NOT_FOUND", 404, "노트북을 찾을 수 없습니다.");
  }

  if (notebook.ownerId !== ownerId) {
    throw new NoteServiceError("FORBIDDEN", 403, "다른 사용자의 노트북에는 접근할 수 없습니다.");
  }
}

async function ensureNoteOwner(prisma: NotesServicePrismaClient, ownerId: string, noteId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      ownerId: true,
      deletedAt: true,
    },
  });

  if (!note || note.deletedAt !== null) {
    throw new NoteServiceError("NOT_FOUND", 404, "노트를 찾을 수 없습니다.");
  }

  if (note.ownerId !== ownerId) {
    throw new NoteServiceError("FORBIDDEN", 403, "다른 사용자의 노트에는 접근할 수 없습니다.");
  }
}

function buildCandidateReason(intersectionCount: number, unionCount: number): string {
  return `태그 유사도 기반 자동 후보입니다. 교집합 ${intersectionCount}개 / 합집합 ${unionCount}개`;
}

function computeJaccard(tagsA: string[], tagsB: string[]): { score: number; intersectionCount: number; unionCount: number } {
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const union = new Set([...setA, ...setB]);

  let intersectionCount = 0;
  for (const value of setA) {
    if (setB.has(value)) {
      intersectionCount += 1;
    }
  }

  const unionCount = union.size;
  if (unionCount === 0) {
    return { score: 0, intersectionCount, unionCount };
  }

  return {
    score: intersectionCount / unionCount,
    intersectionCount,
    unionCount,
  };
}

function normalizePairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function buildSearchWhere(ownerId: string, query: NoteSearchQuery): Prisma.NoteWhereInput {
  const where: Prisma.NoteWhereInput = {
    ownerId,
    deletedAt: null,
  };

  const andConditions: Prisma.NoteWhereInput[] = [];

  if (query.q && query.q.trim().length > EMPTY_LENGTH) {
    const keyword = query.q.trim();
    andConditions.push({
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { contentMd: { contains: keyword, mode: "insensitive" } },
        { summary: { contains: keyword, mode: "insensitive" } },
      ],
    });
  }

  if (query.tag && query.tag.trim().length > EMPTY_LENGTH) {
    andConditions.push({
      tags: { has: query.tag.trim().toLowerCase() },
    });
  }

  if (query.domain && query.domain.trim().length > EMPTY_LENGTH) {
    const domainKeyword = query.domain.trim();
    andConditions.push({
      notebook: {
        name: { contains: domainKeyword, mode: "insensitive" },
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

function mapNotebookDto(
  notebook: Prisma.NotebookGetPayload<{ select: typeof notebookSelect }>,
  noteCount: number,
) {
  return {
    id: notebook.id,
    name: notebook.name,
    description: notebook.description,
    noteCount,
    updatedAt: notebook.updatedAt,
  };
}

export function createNotesService(deps: { prisma: NotesServicePrismaClient }): NotesService {
  const { prisma } = deps;

  return {
    async listNotebooksForOwner(ownerId) {
      const notebooks = await prisma.notebook.findMany({
        where: { ownerId },
        orderBy: [{ updatedAt: "desc" }],
        select: notebookSelect,
      });

      const counts = await prisma.note.groupBy({
        by: ["notebookId"],
        where: {
          ownerId,
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      });

      const countMap = new Map<string, number>(
        counts.map((item) => [item.notebookId, item._count._all]),
      );

      return notebooks.map((notebook) => mapNotebookDto(notebook, countMap.get(notebook.id) ?? 0));
    },

    async getNotebookForOwner(ownerId, notebookId) {
      await ensureNotebookOwner(prisma, ownerId, notebookId);
      const notebook = await prisma.notebook.findUnique({
        where: { id: notebookId },
        select: notebookSelect,
      });

      if (!notebook) {
        throw new NoteServiceError("NOT_FOUND", 404, "노트북을 찾을 수 없습니다.");
      }

      const noteCount = await prisma.note.count({
        where: {
          ownerId,
          notebookId,
          deletedAt: null,
        },
      });

      return mapNotebookDto(notebook, noteCount);
    },

    async createNotebook(ownerId, input) {
      const parsed = parseNotebookCreateInput(input);

      try {
        const created = await prisma.notebook.create({
          data: {
            ownerId,
            name: parsed.name,
            description: parsed.description ?? null,
          },
          select: { id: true },
        });

        return this.getNotebookForOwner(ownerId, created.id);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updateNotebook(ownerId, notebookId, input) {
      await ensureNotebookOwner(prisma, ownerId, notebookId);
      const parsed = parseNotebookUpdateInput(input);

      try {
        await prisma.notebook.update({
          where: { id: notebookId },
          data: parsed,
          select: { id: true },
        });

        return this.getNotebookForOwner(ownerId, notebookId);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteNotebook(ownerId, notebookId) {
      await ensureNotebookOwner(prisma, ownerId, notebookId);

      const noteCount = await prisma.note.count({
        where: {
          ownerId,
          notebookId,
          deletedAt: null,
        },
      });

      if (noteCount > 0) {
        throw new NoteServiceError(
          "CONFLICT",
          409,
          "노트가 남아 있는 노트북은 삭제할 수 없습니다.",
        );
      }

      await prisma.notebook.delete({
        where: { id: notebookId },
        select: { id: true },
      });

      return { id: notebookId };
    },

    async listNotesForOwner(ownerId) {
      return prisma.note.findMany({
        where: {
          ownerId,
          deletedAt: null,
        },
        orderBy: [{ updatedAt: "desc" }],
        select: noteListSelect,
      });
    },

    async searchNotesForOwner(ownerId, query) {
      return prisma.note.findMany({
        where: buildSearchWhere(ownerId, query),
        orderBy: [{ updatedAt: "desc" }],
        select: noteListSelect,
      });
    },

    async getNoteForOwner(ownerId, noteId) {
      await ensureNoteOwner(prisma, ownerId, noteId);

      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: noteDetailSelect,
      });

      if (!note) {
        throw new NoteServiceError("NOT_FOUND", 404, "노트를 찾을 수 없습니다.");
      }

      return note;
    },

    async createNote(ownerId, input) {
      const parsed = parseNoteCreateInput(input);
      await ensureNotebookOwner(prisma, ownerId, parsed.notebookId);

      try {
        const created = await prisma.note.create({
          data: {
            ownerId,
            notebookId: parsed.notebookId,
            visibility: parsed.visibility ?? Visibility.PRIVATE,
            title: parsed.title,
            contentMd: parsed.contentMd,
            summary: parsed.summary ?? null,
            tags: parsed.tags ?? [],
          },
          select: { id: true },
        });

        return this.getNoteForOwner(ownerId, created.id);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updateNote(ownerId, noteId, input) {
      await ensureNoteOwner(prisma, ownerId, noteId);
      const parsed = parseNoteUpdateInput(input);

      if (parsed.notebookId !== undefined) {
        await ensureNotebookOwner(prisma, ownerId, parsed.notebookId);
      }

      try {
        await prisma.note.update({
          where: { id: noteId },
          data: parsed,
          select: { id: true },
        });

        return this.getNoteForOwner(ownerId, noteId);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteNote(ownerId, noteId) {
      await ensureNoteOwner(prisma, ownerId, noteId);

      await prisma.note.update({
        where: { id: noteId },
        data: {
          deletedAt: new Date(),
        },
        select: { id: true },
      });

      return { id: noteId };
    },

    async generateCandidateEdgesForOwner(ownerId) {
      const notes = await prisma.note.findMany({
        where: {
          ownerId,
          deletedAt: null,
        },
        select: {
          id: true,
          notebookId: true,
          tags: true,
        },
      });

      if (notes.length < 2) {
        return this.listCandidateEdgesForOwner(ownerId);
      }

      const existingEdges = await prisma.noteEdge.findMany({
        where: {
          relationType: DEFAULT_RELATION_TYPE,
          from: {
            ownerId,
            deletedAt: null,
          },
          to: {
            ownerId,
            deletedAt: null,
          },
        },
        select: {
          fromId: true,
          toId: true,
        },
      });

      const existingPairKeys = new Set(existingEdges.map((edge) => normalizePairKey(edge.fromId, edge.toId)));
      const candidates: Array<{
        fromId: string;
        toId: string;
        weight: number;
        reason: string;
      }> = [];

      for (let i = 0; i < notes.length; i += 1) {
        for (let j = i + 1; j < notes.length; j += 1) {
          const noteA = notes[i];
          const noteB = notes[j];

          const pairKey = normalizePairKey(noteA.id, noteB.id);
          if (existingPairKeys.has(pairKey)) {
            continue;
          }

          const result = computeJaccard(noteA.tags, noteB.tags);
          const isSameDomain = noteA.notebookId === noteB.notebookId;
          const weightedScore = isSameDomain
            ? Math.min(CANDIDATE_WEIGHT_MAX, result.score + CANDIDATE_DOMAIN_WEIGHT_BONUS)
            : result.score;

          if (weightedScore < CANDIDATE_THRESHOLD) {
            continue;
          }

          const fromId = noteA.id < noteB.id ? noteA.id : noteB.id;
          const toId = noteA.id < noteB.id ? noteB.id : noteA.id;
          candidates.push({
            fromId,
            toId,
            weight: Number(weightedScore.toFixed(4)),
            reason: isSameDomain
              ? `${buildCandidateReason(result.intersectionCount, result.unionCount)} / 동일 도메인 가중치 적용`
              : buildCandidateReason(result.intersectionCount, result.unionCount),
          });
        }
      }

      candidates.sort((a, b) => b.weight - a.weight);
      const topCandidates = candidates.slice(0, CANDIDATE_TOP_N);

      if (topCandidates.length > 0) {
        try {
          await prisma.noteEdge.createMany({
            data: topCandidates.map((candidate) => ({
              fromId: candidate.fromId,
              toId: candidate.toId,
              relationType: DEFAULT_RELATION_TYPE,
              weight: candidate.weight,
              status: NoteEdgeStatus.CANDIDATE,
              origin: NoteEdgeOrigin.AUTO,
              reason: candidate.reason,
            })),
            skipDuplicates: true,
          });
        } catch (error) {
          handleKnownPrismaError(error);
        }
      }

      return this.listCandidateEdgesForOwner(ownerId);
    },

    async listCandidateEdgesForOwner(ownerId) {
      return prisma.noteEdge.findMany({
        where: {
          status: NoteEdgeStatus.CANDIDATE,
          from: {
            ownerId,
            deletedAt: null,
          },
          to: {
            ownerId,
            deletedAt: null,
          },
        },
        orderBy: [{ weight: "desc" }, { updatedAt: "desc" }],
        select: edgeSelect,
      });
    },

    async listEdgesForNoteForOwner(ownerId, noteId) {
      await ensureNoteOwner(prisma, ownerId, noteId);

      return prisma.noteEdge.findMany({
        where: {
          OR: [{ fromId: noteId }, { toId: noteId }],
          status: { in: [NoteEdgeStatus.CANDIDATE, NoteEdgeStatus.CONFIRMED] },
          from: {
            ownerId,
            deletedAt: null,
          },
          to: {
            ownerId,
            deletedAt: null,
          },
        },
        orderBy: [{ status: "asc" }, { weight: "desc" }, { updatedAt: "desc" }],
        select: edgeSelect,
      });
    },

    async confirmEdgeForOwner(ownerId, input) {
      const parsed = parseNoteEdgeActionInput(input);

      const edge = await prisma.noteEdge.findUnique({
        where: { id: parsed.edgeId },
        select: {
          id: true,
          from: {
            select: {
              ownerId: true,
              deletedAt: true,
            },
          },
          to: {
            select: {
              ownerId: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!edge || edge.from.deletedAt !== null || edge.to.deletedAt !== null) {
        throw new NoteServiceError("NOT_FOUND", 404, "노트 엣지를 찾을 수 없습니다.");
      }

      if (edge.from.ownerId !== ownerId || edge.to.ownerId !== ownerId) {
        throw new NoteServiceError("FORBIDDEN", 403, "다른 사용자의 노트 엣지에는 접근할 수 없습니다.");
      }

      const updated = await prisma.noteEdge.update({
        where: { id: parsed.edgeId },
        data: {
          status: NoteEdgeStatus.CONFIRMED,
          origin: NoteEdgeOrigin.MANUAL,
        },
        select: edgeSelect,
      });

      return updated;
    },

    async rejectEdgeForOwner(ownerId, input) {
      const parsed = parseNoteEdgeActionInput(input);

      const edge = await prisma.noteEdge.findUnique({
        where: { id: parsed.edgeId },
        select: {
          id: true,
          from: {
            select: {
              ownerId: true,
              deletedAt: true,
            },
          },
          to: {
            select: {
              ownerId: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!edge || edge.from.deletedAt !== null || edge.to.deletedAt !== null) {
        throw new NoteServiceError("NOT_FOUND", 404, "노트 엣지를 찾을 수 없습니다.");
      }

      if (edge.from.ownerId !== ownerId || edge.to.ownerId !== ownerId) {
        throw new NoteServiceError("FORBIDDEN", 403, "다른 사용자의 노트 엣지에는 접근할 수 없습니다.");
      }

      const updated = await prisma.noteEdge.update({
        where: { id: parsed.edgeId },
        data: {
          status: NoteEdgeStatus.REJECTED,
          origin: NoteEdgeOrigin.MANUAL,
        },
        select: edgeSelect,
      });

      return updated;
    },
  };
}
