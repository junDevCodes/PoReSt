import { Prisma, Visibility } from "@prisma/client";
import { z } from "zod";
import {
  type ExperienceCreateInput,
  ExperienceServiceError,
  type ExperienceServicePrismaClient,
  type ExperiencesService,
} from "@/modules/experiences/interface";

const MIN_TEXT_LENGTH = 1;
const MAX_COMPANY_LENGTH = 120;
const MAX_ROLE_LENGTH = 120;
const MAX_SUMMARY_LENGTH = 5000;
const MAX_TECH_TAG_SIZE = 100;
const MIN_ORDER = 0;
const MAX_ORDER = 9999;
const EMPTY_LENGTH = 0;

type NormalizedExperienceUpdateInput = {
  visibility?: Visibility;
  isFeatured?: boolean;
  company?: string;
  role?: string;
  startDate?: Date;
  endDate?: Date | null;
  isCurrent?: boolean;
  summary?: string | null;
  bulletsJson?: Prisma.InputJsonValue | Prisma.NullTypes.DbNull;
  metricsJson?: Prisma.InputJsonValue | Prisma.NullTypes.DbNull;
  techTags?: string[];
  order?: number;
};

const createExperienceSchema = z.object({
  visibility: z.nativeEnum(Visibility).optional().default(Visibility.PUBLIC),
  isFeatured: z.boolean().optional().default(false),
  company: z.string().trim().min(MIN_TEXT_LENGTH, "회사명은 비어 있을 수 없습니다.").max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요."),
  role: z.string().trim().min(MIN_TEXT_LENGTH, "역할은 비어 있을 수 없습니다.").max(MAX_ROLE_LENGTH, "역할은 120자 이하로 입력해주세요."),
  startDate: z.coerce.date({
    error: "시작일 형식이 올바르지 않습니다.",
  }),
  endDate: z.coerce
    .date({
      error: "종료일 형식이 올바르지 않습니다.",
    })
    .optional()
    .nullable(),
  isCurrent: z.boolean().optional().default(false),
  summary: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 5000자 이하로 입력해주세요.").optional().nullable(),
  bulletsJson: z.unknown().optional().nullable(),
  metricsJson: z.unknown().optional().nullable(),
  techTags: z
    .array(z.string().trim().min(MIN_TEXT_LENGTH, "기술 태그 항목은 비어 있을 수 없습니다."))
    .max(MAX_TECH_TAG_SIZE, "기술 태그는 최대 100개까지 입력할 수 있습니다.")
    .optional()
    .default([]),
  order: z
    .number()
    .int("정렬 순서는 정수여야 합니다.")
    .min(MIN_ORDER, "정렬 순서는 0 이상이어야 합니다.")
    .max(MAX_ORDER, "정렬 순서는 9999 이하여야 합니다.")
    .optional()
    .default(0),
});

const updateExperienceSchema = z
  .object({
    visibility: z.nativeEnum(Visibility).optional(),
    isFeatured: z.boolean().optional(),
    company: z.string().trim().min(MIN_TEXT_LENGTH, "회사명은 비어 있을 수 없습니다.").max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요.").optional(),
    role: z.string().trim().min(MIN_TEXT_LENGTH, "역할은 비어 있을 수 없습니다.").max(MAX_ROLE_LENGTH, "역할은 120자 이하로 입력해주세요.").optional(),
    startDate: z.coerce.date({ error: "시작일 형식이 올바르지 않습니다." }).optional(),
    endDate: z.coerce.date({ error: "종료일 형식이 올바르지 않습니다." }).optional().nullable(),
    isCurrent: z.boolean().optional(),
    summary: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 5000자 이하로 입력해주세요.").optional().nullable(),
    bulletsJson: z.unknown().optional().nullable(),
    metricsJson: z.unknown().optional().nullable(),
    techTags: z
      .array(z.string().trim().min(MIN_TEXT_LENGTH, "기술 태그 항목은 비어 있을 수 없습니다."))
      .max(MAX_TECH_TAG_SIZE, "기술 태그는 최대 100개까지 입력할 수 있습니다.")
      .optional(),
    order: z
      .number()
      .int("정렬 순서는 정수여야 합니다.")
      .min(MIN_ORDER, "정렬 순서는 0 이상이어야 합니다.")
      .max(MAX_ORDER, "정렬 순서는 9999 이하여야 합니다.")
      .optional(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const ownerExperienceSelect = {
  id: true,
  visibility: true,
  isFeatured: true,
  company: true,
  role: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  summary: true,
  bulletsJson: true,
  metricsJson: true,
  techTags: true,
  order: true,
  updatedAt: true,
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

function validateFeaturedRule(visibility: Visibility, isFeatured: boolean) {
  if (isFeatured && visibility !== Visibility.PUBLIC) {
    throw new ExperienceServiceError("VALIDATION_ERROR", 422, "대표 경력은 공개 상태여야 합니다.", {
      visibility: "isFeatured가 true이면 visibility는 PUBLIC이어야 합니다.",
    });
  }
}

function toNullableJsonInput(
  value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullTypes.DbNull | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.DbNull;
  }

  return value;
}

function normalizeCreateInput(input: z.infer<typeof createExperienceSchema>): ExperienceCreateInput {
  validateFeaturedRule(input.visibility, input.isFeatured);

  return {
    visibility: input.visibility,
    isFeatured: input.isFeatured,
    company: input.company,
    role: input.role,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    isCurrent: input.isCurrent,
    summary: toNullableString(input.summary),
    bulletsJson: (input.bulletsJson as Prisma.InputJsonValue | null | undefined) ?? null,
    metricsJson: (input.metricsJson as Prisma.InputJsonValue | null | undefined) ?? null,
    techTags: input.techTags,
    order: input.order,
  };
}

function normalizeUpdateInput(
  input: z.infer<typeof updateExperienceSchema>,
): NormalizedExperienceUpdateInput {
  const normalized: NormalizedExperienceUpdateInput = {};

  if (input.visibility !== undefined) {
    normalized.visibility = input.visibility;
  }

  if (input.isFeatured !== undefined) {
    normalized.isFeatured = input.isFeatured;
  }

  if (input.company !== undefined) {
    normalized.company = input.company;
  }

  if (input.role !== undefined) {
    normalized.role = input.role;
  }

  if (input.startDate !== undefined) {
    normalized.startDate = input.startDate;
  }

  if (input.endDate !== undefined) {
    normalized.endDate = input.endDate ?? null;
  }

  if (input.isCurrent !== undefined) {
    normalized.isCurrent = input.isCurrent;
  }

  if (input.summary !== undefined) {
    normalized.summary = toNullableString(input.summary);
  }

  if (input.bulletsJson !== undefined) {
    normalized.bulletsJson = toNullableJsonInput(
      input.bulletsJson as Prisma.InputJsonValue | null,
    );
  }

  if (input.metricsJson !== undefined) {
    normalized.metricsJson = toNullableJsonInput(
      input.metricsJson as Prisma.InputJsonValue | null,
    );
  }

  if (input.techTags !== undefined) {
    normalized.techTags = input.techTags;
  }

  if (input.order !== undefined) {
    normalized.order = input.order;
  }

  return normalized;
}

export function parseExperienceCreateInput(input: unknown): ExperienceCreateInput {
  try {
    const parsed = createExperienceSchema.parse(input);
    return normalizeCreateInput(parsed);
  } catch (error) {
    if (error instanceof ExperienceServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ExperienceServiceError(
        "VALIDATION_ERROR",
        422,
        "경력 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseExperienceUpdateInput(input: unknown): NormalizedExperienceUpdateInput {
  try {
    const parsed = updateExperienceSchema.parse(input);
    return normalizeUpdateInput(parsed);
  } catch (error) {
    if (error instanceof ExperienceServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ExperienceServiceError(
        "VALIDATION_ERROR",
        422,
        "경력 수정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ExperienceServiceError("CONFLICT", 409, "이미 존재하는 값입니다.");
  }

  throw error;
}

export function createExperiencesService(deps: {
  prisma: ExperienceServicePrismaClient;
}): ExperiencesService {
  const { prisma } = deps;

  return {
    async listExperiencesForOwner(ownerId) {
      return prisma.experience.findMany({
        where: { ownerId },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: ownerExperienceSelect,
      });
    },

    async createExperience(ownerId, input) {
      const parsed = parseExperienceCreateInput(input);

      try {
        return await prisma.experience.create({
          data: {
            ownerId,
            visibility: parsed.visibility ?? Visibility.PUBLIC,
            isFeatured: parsed.isFeatured ?? false,
            company: parsed.company,
            role: parsed.role,
            startDate: parsed.startDate,
            endDate: parsed.endDate ?? null,
            isCurrent: parsed.isCurrent ?? false,
            summary: parsed.summary ?? null,
            bulletsJson: toNullableJsonInput(parsed.bulletsJson),
            metricsJson: toNullableJsonInput(parsed.metricsJson),
            techTags: parsed.techTags ?? [],
            order: parsed.order ?? 0,
          },
          select: ownerExperienceSelect,
        });
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updateExperience(ownerId, experienceId, input) {
      const existing = await prisma.experience.findUnique({
        where: { id: experienceId },
        select: {
          id: true,
          ownerId: true,
          visibility: true,
          isFeatured: true,
        },
      });

      if (!existing) {
        throw new ExperienceServiceError("NOT_FOUND", 404, "경력 정보를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ExperienceServiceError("FORBIDDEN", 403, "다른 사용자의 경력은 수정할 수 없습니다.");
      }

      const parsed = parseExperienceUpdateInput(input);
      const nextVisibility = parsed.visibility ?? existing.visibility;
      const nextFeatured = parsed.isFeatured ?? existing.isFeatured;
      validateFeaturedRule(nextVisibility, nextFeatured);

      try {
        return await prisma.experience.update({
          where: { id: existing.id },
          data: parsed,
          select: ownerExperienceSelect,
        });
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteExperience(ownerId, experienceId) {
      const existing = await prisma.experience.findUnique({
        where: { id: experienceId },
        select: {
          id: true,
          ownerId: true,
        },
      });

      if (!existing) {
        throw new ExperienceServiceError("NOT_FOUND", 404, "경력 정보를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ExperienceServiceError("FORBIDDEN", 403, "다른 사용자의 경력은 삭제할 수 없습니다.");
      }

      await prisma.experience.delete({
        where: { id: existing.id },
      });

      return { id: existing.id };
    },
  };
}
