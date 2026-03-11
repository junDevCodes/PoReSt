import { Prisma, Visibility } from "@prisma/client";
import { z } from "zod";
import {
  type SkillCreateInput,
  SkillServiceError,
  type SkillServicePrismaClient,
  type SkillsService,
} from "@/modules/skills/interface";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;
const MAX_CATEGORY_LENGTH = 30;
const MIN_LEVEL = 1;
const MAX_LEVEL = 5;
const MIN_ORDER = 0;
const MAX_ORDER = 9999;
const EMPTY_LENGTH = 0;

const createSkillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, "기술명은 비어 있을 수 없습니다.")
    .max(MAX_NAME_LENGTH, "기술명은 50자 이하로 입력해주세요."),
  category: z
    .string()
    .trim()
    .max(MAX_CATEGORY_LENGTH, "카테고리는 30자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  level: z
    .number()
    .int("레벨은 정수여야 합니다.")
    .min(MIN_LEVEL, "레벨은 1 이상이어야 합니다.")
    .max(MAX_LEVEL, "레벨은 5 이하여야 합니다.")
    .optional()
    .nullable(),
  order: z
    .number()
    .int("정렬 순서는 정수여야 합니다.")
    .min(MIN_ORDER, "정렬 순서는 0 이상이어야 합니다.")
    .max(MAX_ORDER, "정렬 순서는 9999 이하여야 합니다.")
    .optional()
    .default(0),
  visibility: z.nativeEnum(Visibility).optional().default(Visibility.PUBLIC),
});

const updateSkillSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(MIN_NAME_LENGTH, "기술명은 비어 있을 수 없습니다.")
      .max(MAX_NAME_LENGTH, "기술명은 50자 이하로 입력해주세요.")
      .optional(),
    category: z
      .string()
      .trim()
      .max(MAX_CATEGORY_LENGTH, "카테고리는 30자 이하로 입력해주세요.")
      .optional()
      .nullable(),
    level: z
      .number()
      .int("레벨은 정수여야 합니다.")
      .min(MIN_LEVEL, "레벨은 1 이상이어야 합니다.")
      .max(MAX_LEVEL, "레벨은 5 이하여야 합니다.")
      .optional()
      .nullable(),
    order: z
      .number()
      .int("정렬 순서는 정수여야 합니다.")
      .min(MIN_ORDER, "정렬 순서는 0 이상이어야 합니다.")
      .max(MAX_ORDER, "정렬 순서는 9999 이하여야 합니다.")
      .optional(),
    visibility: z.nativeEnum(Visibility).optional(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const ownerSkillSelect = {
  id: true,
  name: true,
  category: true,
  level: true,
  order: true,
  visibility: true,
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

function parseSkillCreateInput(input: unknown): SkillCreateInput & { visibility: Visibility; order: number } {
  try {
    const parsed = createSkillSchema.parse(input);
    return {
      name: parsed.name,
      category: toNullableString(parsed.category) ?? null,
      level: parsed.level ?? null,
      order: parsed.order,
      visibility: parsed.visibility,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SkillServiceError(
        "VALIDATION_ERROR",
        422,
        "기술 스택 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

type NormalizedSkillUpdateInput = {
  name?: string;
  category?: string | null;
  level?: number | null;
  order?: number;
  visibility?: Visibility;
};

function parseSkillUpdateInput(input: unknown): NormalizedSkillUpdateInput {
  try {
    const parsed = updateSkillSchema.parse(input);
    const normalized: NormalizedSkillUpdateInput = {};

    if (parsed.name !== undefined) {
      normalized.name = parsed.name;
    }

    if (parsed.category !== undefined) {
      normalized.category = toNullableString(parsed.category) ?? null;
    }

    if (parsed.level !== undefined) {
      normalized.level = parsed.level ?? null;
    }

    if (parsed.order !== undefined) {
      normalized.order = parsed.order;
    }

    if (parsed.visibility !== undefined) {
      normalized.visibility = parsed.visibility;
    }

    return normalized;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SkillServiceError(
        "VALIDATION_ERROR",
        422,
        "기술 스택 수정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new SkillServiceError("CONFLICT", 409, "이미 동일한 이름의 기술이 존재합니다.");
  }

  throw error;
}

export function createSkillsService(deps: {
  prisma: SkillServicePrismaClient;
}): SkillsService {
  const { prisma } = deps;

  return {
    async listSkillsForOwner(ownerId) {
      return prisma.skill.findMany({
        where: { ownerId },
        orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
        select: ownerSkillSelect,
      });
    },

    async createSkill(ownerId, input) {
      const parsed = parseSkillCreateInput(input);

      try {
        return await prisma.skill.create({
          data: {
            ownerId,
            name: parsed.name,
            category: parsed.category,
            level: parsed.level,
            order: parsed.order,
            visibility: parsed.visibility,
          },
          select: ownerSkillSelect,
        });
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updateSkill(ownerId, skillId, input) {
      const existing = await prisma.skill.findUnique({
        where: { id: skillId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new SkillServiceError("NOT_FOUND", 404, "기술 정보를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new SkillServiceError("FORBIDDEN", 403, "다른 사용자의 기술은 수정할 수 없습니다.");
      }

      const parsed = parseSkillUpdateInput(input);

      try {
        return await prisma.skill.update({
          where: { id: existing.id },
          data: parsed,
          select: ownerSkillSelect,
        });
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteSkill(ownerId, skillId) {
      const existing = await prisma.skill.findUnique({
        where: { id: skillId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new SkillServiceError("NOT_FOUND", 404, "기술 정보를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new SkillServiceError("FORBIDDEN", 403, "다른 사용자의 기술은 삭제할 수 없습니다.");
      }

      await prisma.skill.delete({
        where: { id: existing.id },
      });

      return { id: existing.id };
    },
  };
}
