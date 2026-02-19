import { Prisma } from "@prisma/client";
import { z } from "zod";
import type {
  ExperienceStoriesCursorPayload,
  ExperienceStoriesListQuery,
  ExperienceStoriesListResult,
  ExperienceStoriesService,
  ExperienceStoriesServicePrismaClient,
  ExperienceStoryCreateInput,
  ExperienceStoryUpdateInput,
  OwnerExperienceStoryDto,
} from "@/modules/experience-stories/interface";
import { ExperienceStoryServiceError } from "@/modules/experience-stories/interface";

const MIN_TEXT_LENGTH = 1;
const MAX_TITLE_LENGTH = 200;
const MAX_Q_LENGTH = 200;
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
const EMPTY_LENGTH = 0;

const createExperienceStorySchema = z.object({
  experienceId: z.string().trim().min(MIN_TEXT_LENGTH, "experienceId는 필수입니다."),
  title: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "제목은 비어 있을 수 없습니다.")
    .max(MAX_TITLE_LENGTH, "제목은 200자 이하로 입력해주세요."),
  situation: z.string().trim().min(MIN_TEXT_LENGTH, "Situation은 비어 있을 수 없습니다."),
  task: z.string().trim().min(MIN_TEXT_LENGTH, "Task는 비어 있을 수 없습니다."),
  action: z.string().trim().min(MIN_TEXT_LENGTH, "Action은 비어 있을 수 없습니다."),
  result: z.string().trim().min(MIN_TEXT_LENGTH, "Result는 비어 있을 수 없습니다."),
  tags: z.array(z.string().trim().min(MIN_TEXT_LENGTH, "태그 값은 비어 있을 수 없습니다.")).optional().default([]),
  metricsJson: z.unknown().optional().nullable(),
  linksJson: z.unknown().optional().nullable(),
});

const updateExperienceStorySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "제목은 비어 있을 수 없습니다.")
      .max(MAX_TITLE_LENGTH, "제목은 200자 이하로 입력해주세요.")
      .optional(),
    situation: z.string().trim().min(MIN_TEXT_LENGTH, "Situation은 비어 있을 수 없습니다.").optional(),
    task: z.string().trim().min(MIN_TEXT_LENGTH, "Task는 비어 있을 수 없습니다.").optional(),
    action: z.string().trim().min(MIN_TEXT_LENGTH, "Action은 비어 있을 수 없습니다.").optional(),
    result: z.string().trim().min(MIN_TEXT_LENGTH, "Result는 비어 있을 수 없습니다.").optional(),
    tags: z.array(z.string().trim().min(MIN_TEXT_LENGTH, "태그 값은 비어 있을 수 없습니다.")).optional(),
    metricsJson: z.unknown().optional().nullable(),
    linksJson: z.unknown().optional().nullable(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const listQuerySchema = z.object({
  experienceId: z.string().trim().min(1).optional(),
  q: z.string().trim().max(MAX_Q_LENGTH, "검색어는 200자 이하로 입력해주세요.").optional(),
  limit: z.number().int().positive().max(MAX_LIST_LIMIT).optional(),
  cursor: z.string().trim().min(1).optional(),
});

const ownerExperienceStorySelect = {
  id: true,
  ownerId: true,
  experienceId: true,
  title: true,
  situation: true,
  task: true,
  action: true,
  result: true,
  tags: true,
  metricsJson: true,
  linksJson: true,
  updatedAt: true,
} as const;

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

function encodeCursor(payload: ExperienceStoriesCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): ExperienceStoriesCursorPayload {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as ExperienceStoriesCursorPayload;
    if (!parsed?.updatedAt || !parsed?.id) {
      throw new Error("INVALID_CURSOR");
    }
    return parsed;
  } catch {
    throw new ExperienceStoryServiceError("VALIDATION_ERROR", 422, "cursor 값이 올바르지 않습니다.", {
      cursor: "cursor 값을 확인해주세요.",
    });
  }
}

function parseCreateInput(input: unknown): ExperienceStoryCreateInput {
  try {
    const parsed = createExperienceStorySchema.parse(input);
    return {
      experienceId: parsed.experienceId,
      title: parsed.title,
      situation: parsed.situation,
      task: parsed.task,
      action: parsed.action,
      result: parsed.result,
      tags: normalizeTags(parsed.tags) ?? [],
      metricsJson: (parsed.metricsJson as Prisma.InputJsonValue | null | undefined) ?? null,
      linksJson: (parsed.linksJson as Prisma.InputJsonValue | null | undefined) ?? null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ExperienceStoryServiceError(
        "VALIDATION_ERROR",
        422,
        "STAR 스토리 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

function parseUpdateInput(input: unknown): ExperienceStoryUpdateInput {
  try {
    const parsed = updateExperienceStorySchema.parse(input);
    return {
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.situation !== undefined ? { situation: parsed.situation } : {}),
      ...(parsed.task !== undefined ? { task: parsed.task } : {}),
      ...(parsed.action !== undefined ? { action: parsed.action } : {}),
      ...(parsed.result !== undefined ? { result: parsed.result } : {}),
      ...(parsed.tags !== undefined ? { tags: normalizeTags(parsed.tags) ?? [] } : {}),
      ...(parsed.metricsJson !== undefined
        ? { metricsJson: (parsed.metricsJson as Prisma.InputJsonValue | null | undefined) ?? null }
        : {}),
      ...(parsed.linksJson !== undefined
        ? { linksJson: (parsed.linksJson as Prisma.InputJsonValue | null | undefined) ?? null }
        : {}),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ExperienceStoryServiceError(
        "VALIDATION_ERROR",
        422,
        "STAR 스토리 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

function parseListQuery(query: unknown): ExperienceStoriesListQuery {
  const normalized = (query ?? {}) as ExperienceStoriesListQuery;
  const parsed = listQuerySchema.safeParse(normalized);
  if (!parsed.success) {
    throw new ExperienceStoryServiceError(
      "VALIDATION_ERROR",
      422,
      "STAR 스토리 조회 조건이 올바르지 않습니다.",
      extractZodFieldErrors(parsed.error),
    );
  }

  return parsed.data;
}

function mapOwnerDto(
  story: Prisma.ExperienceStoryGetPayload<{ select: typeof ownerExperienceStorySelect }>,
): OwnerExperienceStoryDto {
  return {
    id: story.id,
    experienceId: story.experienceId,
    title: story.title,
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    tags: story.tags,
    metricsJson: story.metricsJson,
    linksJson: story.linksJson,
    updatedAt: story.updatedAt,
  };
}

async function ensureExperienceOwnedByOwner(
  prisma: ExperienceStoriesServicePrismaClient,
  ownerId: string,
  experienceId: string,
) {
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { id: true, ownerId: true },
  });

  if (!experience) {
    throw new ExperienceStoryServiceError("NOT_FOUND", 404, "경력을 찾을 수 없습니다.");
  }

  if (experience.ownerId !== ownerId) {
    throw new ExperienceStoryServiceError("FORBIDDEN", 403, "다른 사용자의 경력에는 접근할 수 없습니다.");
  }
}

export function createExperienceStoriesService(deps: {
  prisma: ExperienceStoriesServicePrismaClient;
}): ExperienceStoriesService {
  const { prisma } = deps;

  return {
    async listStoriesForOwner(ownerId, query): Promise<ExperienceStoriesListResult> {
      const parsed = parseListQuery(query);
      const limit = parsed.limit ?? DEFAULT_LIST_LIMIT;

      if (parsed.experienceId) {
        // 경험 선택 필터가 전달되면, 해당 경험이 본인 소유인지 먼저 확인한다.
        await ensureExperienceOwnedByOwner(prisma, ownerId, parsed.experienceId);
      }

      const andConditions: Prisma.ExperienceStoryWhereInput[] = [];
      if (parsed.q) {
        const keyword = parsed.q;
        andConditions.push({
          OR: [
            { title: { contains: keyword, mode: "insensitive" } },
            { situation: { contains: keyword, mode: "insensitive" } },
            { task: { contains: keyword, mode: "insensitive" } },
            { action: { contains: keyword, mode: "insensitive" } },
            { result: { contains: keyword, mode: "insensitive" } },
          ],
        });
      }

      if (parsed.cursor) {
        const cursorPayload = decodeCursor(parsed.cursor);
        const cursorUpdatedAt = new Date(cursorPayload.updatedAt);
        if (Number.isNaN(cursorUpdatedAt.getTime())) {
          throw new ExperienceStoryServiceError("VALIDATION_ERROR", 422, "cursor 값이 올바르지 않습니다.", {
            cursor: "cursor 값을 확인해주세요.",
          });
        }
        andConditions.push({
          OR: [
            { updatedAt: { lt: cursorUpdatedAt } },
            { updatedAt: cursorUpdatedAt, id: { lt: cursorPayload.id } },
          ],
        });
      }

      const items = await prisma.experienceStory.findMany({
        where: {
          ownerId,
          ...(parsed.experienceId ? { experienceId: parsed.experienceId } : {}),
          ...(andConditions.length > 0 ? { AND: andConditions } : {}),
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit,
        select: ownerExperienceStorySelect,
      });

      const nextCursor =
        items.length === limit
          ? encodeCursor({ updatedAt: items[items.length - 1]!.updatedAt.toISOString(), id: items[items.length - 1]!.id })
          : null;

      return {
        items: items.map((story) => mapOwnerDto(story)),
        nextCursor,
      };
    },

    async createStory(ownerId, input) {
      const parsed = parseCreateInput(input);
      await ensureExperienceOwnedByOwner(prisma, ownerId, parsed.experienceId);

      const created = await prisma.experienceStory.create({
        data: {
          ownerId,
          experienceId: parsed.experienceId,
          title: parsed.title,
          situation: parsed.situation,
          task: parsed.task,
          action: parsed.action,
          result: parsed.result,
          tags: parsed.tags ?? [],
          metricsJson: parsed.metricsJson ?? null,
          linksJson: parsed.linksJson ?? null,
        },
        select: ownerExperienceStorySelect,
      });

      return mapOwnerDto(created);
    },

    async getStoryForOwner(ownerId, storyId) {
      const story = await prisma.experienceStory.findUnique({
        where: { id: storyId },
        select: ownerExperienceStorySelect,
      });

      if (!story) {
        throw new ExperienceStoryServiceError("NOT_FOUND", 404, "STAR 스토리를 찾을 수 없습니다.");
      }

      if (story.ownerId !== ownerId) {
        throw new ExperienceStoryServiceError("FORBIDDEN", 403, "다른 사용자의 STAR 스토리에는 접근할 수 없습니다.");
      }

      return mapOwnerDto(story);
    },

    async updateStory(ownerId, storyId, input) {
      const existing = await prisma.experienceStory.findUnique({
        where: { id: storyId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new ExperienceStoryServiceError("NOT_FOUND", 404, "STAR 스토리를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ExperienceStoryServiceError("FORBIDDEN", 403, "다른 사용자의 STAR 스토리는 수정할 수 없습니다.");
      }

      const parsed = parseUpdateInput(input);

      const updated = await prisma.experienceStory.update({
        where: { id: existing.id },
        data: {
          ...(parsed.title !== undefined ? { title: parsed.title } : {}),
          ...(parsed.situation !== undefined ? { situation: parsed.situation } : {}),
          ...(parsed.task !== undefined ? { task: parsed.task } : {}),
          ...(parsed.action !== undefined ? { action: parsed.action } : {}),
          ...(parsed.result !== undefined ? { result: parsed.result } : {}),
          ...(parsed.tags !== undefined ? { tags: parsed.tags } : {}),
          ...(parsed.metricsJson !== undefined ? { metricsJson: parsed.metricsJson } : {}),
          ...(parsed.linksJson !== undefined ? { linksJson: parsed.linksJson } : {}),
        },
        select: ownerExperienceStorySelect,
      });

      return mapOwnerDto(updated);
    },

    async deleteStory(ownerId, storyId) {
      const existing = await prisma.experienceStory.findUnique({
        where: { id: storyId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new ExperienceStoryServiceError("NOT_FOUND", 404, "STAR 스토리를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ExperienceStoryServiceError("FORBIDDEN", 403, "다른 사용자의 STAR 스토리는 삭제할 수 없습니다.");
      }

      await prisma.experienceStory.delete({ where: { id: existing.id } });
      return { id: existing.id };
    },
  };
}

