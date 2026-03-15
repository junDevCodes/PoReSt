import { randomBytes } from "node:crypto";
import { Prisma, ResumeStatus } from "@prisma/client";
import { z } from "zod";
import {
  type ResumeCreateInput,
  type ResumeItemCreateInput,
  type ResumeShareLinkCreateInput,
  type ResumeDraftInput,
  type ResumeDraftPrismaClient,
  type OwnerResumeDetailDto,
  ResumeServiceError,
  type ResumeServicePrismaClient,
  type ResumesService,
} from "@/modules/resumes/interface";
import { getDefaultGeminiClient, withGeminiFallback } from "@/modules/gemini";
import { GeminiClientError } from "@/modules/gemini";

const MIN_TEXT_LENGTH = 1;
const MAX_TITLE_LENGTH = 120;
const MAX_COMPANY_LENGTH = 120;
const MAX_ROLE_LENGTH = 120;
const MAX_LEVEL_LENGTH = 50;
const MAX_SUMMARY_LENGTH = 20000;
const MAX_NOTES_LENGTH = 5000;
const MAX_TECH_TAG_SIZE = 100;
const MIN_ORDER = 0;
const MAX_ORDER = 9999;
const EMPTY_LENGTH = 0;
const MAX_SHARE_TOKEN_RETRY = 5;
const SHARE_TOKEN_SIZE_BYTES = 24;

type NormalizedResumeUpdateInput = {
  status?: ResumeStatus;
  title?: string;
  targetCompany?: string | null;
  targetRole?: string | null;
  level?: string | null;
  summaryMd?: string | null;
};

type NormalizedResumeItemUpdateInput = {
  experienceId?: string;
  sortOrder?: number;
  overrideBulletsJson?: Prisma.InputJsonValue | Prisma.NullTypes.DbNull;
  overrideMetricsJson?: Prisma.InputJsonValue | Prisma.NullTypes.DbNull;
  overrideTechTags?: string[];
  notes?: string | null;
};

type ResumeShareLinkDeleteInput = {
  shareLinkId: string;
};

const createResumeSchema = z.object({
  status: z.nativeEnum(ResumeStatus).optional().default(ResumeStatus.DRAFT),
  title: z.string().trim().min(MIN_TEXT_LENGTH, "이력서 제목은 비어 있을 수 없습니다.").max(MAX_TITLE_LENGTH, "이력서 제목은 120자 이하로 입력해주세요."),
  targetCompany: z.string().trim().max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요.").optional().nullable(),
  targetRole: z.string().trim().max(MAX_ROLE_LENGTH, "직무명은 120자 이하로 입력해주세요.").optional().nullable(),
  level: z.string().trim().max(MAX_LEVEL_LENGTH, "레벨은 50자 이하로 입력해주세요.").optional().nullable(),
  summaryMd: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 20000자 이하로 입력해주세요.").optional().nullable(),
});

const updateResumeSchema = z
  .object({
    status: z.nativeEnum(ResumeStatus).optional(),
    title: z.string().trim().min(MIN_TEXT_LENGTH, "이력서 제목은 비어 있을 수 없습니다.").max(MAX_TITLE_LENGTH, "이력서 제목은 120자 이하로 입력해주세요.").optional(),
    targetCompany: z.string().trim().max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요.").optional().nullable(),
    targetRole: z.string().trim().max(MAX_ROLE_LENGTH, "직무명은 120자 이하로 입력해주세요.").optional().nullable(),
    level: z.string().trim().max(MAX_LEVEL_LENGTH, "레벨은 50자 이하로 입력해주세요.").optional().nullable(),
    summaryMd: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 20000자 이하로 입력해주세요.").optional().nullable(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const createResumeItemSchema = z.object({
  experienceId: z.string().trim().min(MIN_TEXT_LENGTH, "경력 ID는 비어 있을 수 없습니다."),
  sortOrder: z.number().int("정렬 순서는 정수여야 합니다.").min(MIN_ORDER, "정렬 순서는 0 이상이어야 합니다.").max(MAX_ORDER, "정렬 순서는 9999 이하여야 합니다.").optional().default(0),
  overrideBulletsJson: z.unknown().optional().nullable(),
  overrideMetricsJson: z.unknown().optional().nullable(),
  overrideTechTags: z.array(z.string().trim().min(MIN_TEXT_LENGTH, "기술 태그 항목은 비어 있을 수 없습니다.")).max(MAX_TECH_TAG_SIZE, "기술 태그는 최대 100개까지 입력할 수 있습니다.").optional().default([]),
  notes: z.string().trim().max(MAX_NOTES_LENGTH, "메모는 5000자 이하로 입력해주세요.").optional().nullable(),
});

const updateResumeItemSchema = z
  .object({
    experienceId: z.string().trim().min(MIN_TEXT_LENGTH, "경력 ID는 비어 있을 수 없습니다.").optional(),
    sortOrder: z.number().int("정렬 순서는 정수여야 합니다.").min(MIN_ORDER, "정렬 순서는 0 이상이어야 합니다.").max(MAX_ORDER, "정렬 순서는 9999 이하여야 합니다.").optional(),
    overrideBulletsJson: z.unknown().optional().nullable(),
    overrideMetricsJson: z.unknown().optional().nullable(),
    overrideTechTags: z.array(z.string().trim().min(MIN_TEXT_LENGTH, "기술 태그 항목은 비어 있을 수 없습니다.")).max(MAX_TECH_TAG_SIZE, "기술 태그는 최대 100개까지 입력할 수 있습니다.").optional(),
    notes: z.string().trim().max(MAX_NOTES_LENGTH, "메모는 5000자 이하로 입력해주세요.").optional().nullable(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const createResumeShareLinkSchema = z.object({
  expiresAt: z
    .string()
    .datetime("expiresAt은 ISO 8601 날짜 형식이어야 합니다.")
    .optional()
    .nullable(),
});

const deleteResumeShareLinkSchema = z.object({
  shareLinkId: z.string().trim().min(MIN_TEXT_LENGTH, "shareLinkId는 비어 있을 수 없습니다."),
});

const resumeListSelect = {
  id: true,
  status: true,
  title: true,
  targetCompany: true,
  targetRole: true,
  level: true,
  updatedAt: true,
  _count: {
    select: {
      items: true,
    },
  },
} as const;

const resumeItemWithExperienceSelect = Prisma.validator<Prisma.ResumeItemSelect>()({
  id: true,
  resumeId: true,
  experienceId: true,
  sortOrder: true,
  overrideBulletsJson: true,
  overrideMetricsJson: true,
  overrideTechTags: true,
  notes: true,
  updatedAt: true,
  experience: {
    select: {
      id: true,
      company: true,
      role: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      summary: true,
      bulletsJson: true,
      metricsJson: true,
      techTags: true,
      updatedAt: true,
    },
  },
});

const resumeItemOrderBy: Prisma.ResumeItemOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { updatedAt: "desc" },
];

const resumeDetailSelect = Prisma.validator<Prisma.ResumeSelect>()({
  id: true,
  status: true,
  title: true,
  targetCompany: true,
  targetRole: true,
  level: true,
  summaryMd: true,
  updatedAt: true,
  items: {
    orderBy: resumeItemOrderBy,
    select: resumeItemWithExperienceSelect,
  },
});

const resumeShareLinkSelect = Prisma.validator<Prisma.ResumeShareLinkSelect>()({
  id: true,
  token: true,
  expiresAt: true,
  isRevoked: true,
  createdAt: true,
  updatedAt: true,
});

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

function toStringArray(value: string[] | undefined): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.map((item) => item.trim()).filter((item) => item.length > EMPTY_LENGTH);
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

function normalizeCreateResumeInput(input: z.infer<typeof createResumeSchema>): ResumeCreateInput {
  return {
    status: input.status,
    title: input.title,
    targetCompany: toNullableString(input.targetCompany),
    targetRole: toNullableString(input.targetRole),
    level: toNullableString(input.level),
    summaryMd: toNullableString(input.summaryMd),
  };
}

function normalizeUpdateResumeInput(
  input: z.infer<typeof updateResumeSchema>,
): NormalizedResumeUpdateInput {
  const normalized: NormalizedResumeUpdateInput = {};

  if (input.status !== undefined) {
    normalized.status = input.status;
  }

  if (input.title !== undefined) {
    normalized.title = input.title;
  }

  if (input.targetCompany !== undefined) {
    normalized.targetCompany = toNullableString(input.targetCompany);
  }

  if (input.targetRole !== undefined) {
    normalized.targetRole = toNullableString(input.targetRole);
  }

  if (input.level !== undefined) {
    normalized.level = toNullableString(input.level);
  }

  if (input.summaryMd !== undefined) {
    normalized.summaryMd = toNullableString(input.summaryMd);
  }

  return normalized;
}

function normalizeCreateResumeItemInput(
  input: z.infer<typeof createResumeItemSchema>,
): ResumeItemCreateInput {
  return {
    experienceId: input.experienceId,
    sortOrder: input.sortOrder,
    overrideBulletsJson: (input.overrideBulletsJson as Prisma.InputJsonValue | null | undefined) ?? null,
    overrideMetricsJson: (input.overrideMetricsJson as Prisma.InputJsonValue | null | undefined) ?? null,
    overrideTechTags: toStringArray(input.overrideTechTags) ?? [],
    notes: toNullableString(input.notes),
  };
}

function normalizeUpdateResumeItemInput(
  input: z.infer<typeof updateResumeItemSchema>,
): NormalizedResumeItemUpdateInput {
  const normalized: NormalizedResumeItemUpdateInput = {};

  if (input.experienceId !== undefined) {
    normalized.experienceId = input.experienceId;
  }

  if (input.sortOrder !== undefined) {
    normalized.sortOrder = input.sortOrder;
  }

  if (input.overrideBulletsJson !== undefined) {
    normalized.overrideBulletsJson = toNullableJsonInput(
      input.overrideBulletsJson as Prisma.InputJsonValue | null,
    );
  }

  if (input.overrideMetricsJson !== undefined) {
    normalized.overrideMetricsJson = toNullableJsonInput(
      input.overrideMetricsJson as Prisma.InputJsonValue | null,
    );
  }

  if (input.overrideTechTags !== undefined) {
    normalized.overrideTechTags = toStringArray(input.overrideTechTags) ?? [];
  }

  if (input.notes !== undefined) {
    normalized.notes = toNullableString(input.notes);
  }

  return normalized;
}

function normalizeCreateResumeShareLinkInput(
  input: z.infer<typeof createResumeShareLinkSchema>,
): ResumeShareLinkCreateInput {
  if (!input.expiresAt) {
    return {};
  }

  return {
    expiresAt: new Date(input.expiresAt),
  };
}

export function parseResumeCreateInput(input: unknown): ResumeCreateInput {
  try {
    const parsed = createResumeSchema.parse(input);
    return normalizeCreateResumeInput(parsed);
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "이력서 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseResumeUpdateInput(input: unknown): NormalizedResumeUpdateInput {
  try {
    const parsed = updateResumeSchema.parse(input);
    return normalizeUpdateResumeInput(parsed);
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "이력서 수정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseResumeItemCreateInput(input: unknown): ResumeItemCreateInput {
  try {
    const parsed = createResumeItemSchema.parse(input);
    return normalizeCreateResumeItemInput(parsed);
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "이력서 항목 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseResumeItemUpdateInput(input: unknown): NormalizedResumeItemUpdateInput {
  try {
    const parsed = updateResumeItemSchema.parse(input);
    return normalizeUpdateResumeItemInput(parsed);
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "이력서 항목 수정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseResumeShareLinkCreateInput(input: unknown): ResumeShareLinkCreateInput {
  try {
    const parsed = createResumeShareLinkSchema.parse(input);
    const normalized = normalizeCreateResumeShareLinkInput(parsed);

    if (normalized.expiresAt && normalized.expiresAt.getTime() <= Date.now()) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "expiresAt은 현재 시각 이후여야 합니다.",
        { expiresAt: "만료 시각은 현재보다 이후여야 합니다." },
      );
    }

    return normalized;
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "공유 링크 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseResumeShareLinkDeleteInput(input: unknown): ResumeShareLinkDeleteInput {
  try {
    return deleteResumeShareLinkSchema.parse(input);
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "공유 링크 삭제 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ResumeServiceError("CONFLICT", 409, "이미 추가된 데이터입니다.");
    }

    if (error.code === "P2003") {
      throw new ResumeServiceError("VALIDATION_ERROR", 422, "참조하는 데이터가 존재하지 않습니다.");
    }
  }

  throw error;
}

async function ensureResumeOwner(prisma: ResumeServicePrismaClient, ownerId: string, resumeId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!resume) {
    throw new ResumeServiceError("NOT_FOUND", 404, "이력서를 찾을 수 없습니다.");
  }

  if (resume.ownerId !== ownerId) {
    throw new ResumeServiceError("FORBIDDEN", 403, "다른 사용자의 이력서에는 접근할 수 없습니다.");
  }
}

async function ensureExperienceOwner(
  prisma: ResumeServicePrismaClient,
  ownerId: string,
  experienceId: string,
) {
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!experience) {
    throw new ResumeServiceError("NOT_FOUND", 404, "경력 정보를 찾을 수 없습니다.");
  }

  if (experience.ownerId !== ownerId) {
    throw new ResumeServiceError("FORBIDDEN", 403, "다른 사용자의 경력은 이력서에 추가할 수 없습니다.");
  }
}

function mapResumeListItem(
  item: {
    id: string;
    status: ResumeStatus;
    title: string;
    targetCompany: string | null;
    targetRole: string | null;
    level: string | null;
    updatedAt: Date;
    _count: {
      items: number;
    };
  },
) {
  return {
    id: item.id,
    status: item.status,
    title: item.title,
    targetCompany: item.targetCompany,
    targetRole: item.targetRole,
    level: item.level,
    itemCount: item._count.items,
    updatedAt: item.updatedAt,
  };
}

function mapResumeItem(
  item: {
    id: string;
    resumeId: string;
    experienceId: string;
    sortOrder: number;
    overrideBulletsJson: unknown;
    overrideMetricsJson: unknown;
    overrideTechTags: string[];
    notes: string | null;
    updatedAt: Date;
    experience: {
      id: string;
      company: string;
      role: string;
      startDate: Date;
      endDate: Date | null;
      isCurrent: boolean;
      summary: string | null;
      bulletsJson: unknown;
      metricsJson: unknown;
      techTags: string[];
      updatedAt: Date;
    };
  },
) {
  return {
    id: item.id,
    resumeId: item.resumeId,
    experienceId: item.experienceId,
    sortOrder: item.sortOrder,
    overrideBulletsJson: item.overrideBulletsJson,
    overrideMetricsJson: item.overrideMetricsJson,
    overrideTechTags: item.overrideTechTags,
    notes: item.notes,
    updatedAt: item.updatedAt,
    experience: {
      id: item.experience.id,
      company: item.experience.company,
      role: item.experience.role,
      startDate: item.experience.startDate,
      endDate: item.experience.endDate,
      isCurrent: item.experience.isCurrent,
      summary: item.experience.summary,
      bulletsJson: item.experience.bulletsJson,
      metricsJson: item.experience.metricsJson,
      techTags: item.experience.techTags,
      updatedAt: item.experience.updatedAt,
    },
  };
}

function mapResumeDetail(detail: {
  id: string;
  status: ResumeStatus;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  level: string | null;
  summaryMd: string | null;
  updatedAt: Date;
  items: Array<{
    id: string;
    resumeId: string;
    experienceId: string;
    sortOrder: number;
    overrideBulletsJson: unknown;
    overrideMetricsJson: unknown;
    overrideTechTags: string[];
    notes: string | null;
    updatedAt: Date;
    experience: {
      id: string;
      company: string;
      role: string;
      startDate: Date;
      endDate: Date | null;
      isCurrent: boolean;
      summary: string | null;
      bulletsJson: unknown;
      metricsJson: unknown;
      techTags: string[];
      updatedAt: Date;
    };
  }>;
}) {
  return {
    id: detail.id,
    status: detail.status,
    title: detail.title,
    targetCompany: detail.targetCompany,
    targetRole: detail.targetRole,
    level: detail.level,
    summaryMd: detail.summaryMd,
    updatedAt: detail.updatedAt,
    items: detail.items.map(mapResumeItem),
  };
}

function mapResumePreview(detail: {
  id: string;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  level: string | null;
  summaryMd: string | null;
  updatedAt: Date;
  items: Array<{
    id: string;
    sortOrder: number;
    notes: string | null;
    overrideBulletsJson: unknown;
    overrideMetricsJson: unknown;
    overrideTechTags: string[];
    experience: {
      id: string;
      company: string;
      role: string;
      startDate: Date;
      endDate: Date | null;
      isCurrent: boolean;
      summary: string | null;
      bulletsJson: unknown;
      metricsJson: unknown;
      techTags: string[];
      updatedAt: Date;
    };
  }>;
}) {
  const items = detail.items.map((item) => ({
    itemId: item.id,
    sortOrder: item.sortOrder,
    notes: item.notes,
    experience: {
      id: item.experience.id,
      company: item.experience.company,
      role: item.experience.role,
      startDate: item.experience.startDate,
      endDate: item.experience.endDate,
      isCurrent: item.experience.isCurrent,
      summary: item.experience.summary,
      bulletsJson: item.experience.bulletsJson,
      metricsJson: item.experience.metricsJson,
      techTags: item.experience.techTags,
      updatedAt: item.experience.updatedAt,
    },
    resolvedBulletsJson: item.overrideBulletsJson ?? item.experience.bulletsJson,
    resolvedMetricsJson: item.overrideMetricsJson ?? item.experience.metricsJson,
    resolvedTechTags: item.overrideTechTags.length > 0 ? item.overrideTechTags : item.experience.techTags,
  }));

  return {
    resume: {
      id: detail.id,
      title: detail.title,
      targetCompany: detail.targetCompany,
      targetRole: detail.targetRole,
      level: detail.level,
      summaryMd: detail.summaryMd,
      updatedAt: detail.updatedAt,
    },
    items,
  };
}

function mapResumeShareLink(item: {
  id: string;
  token: string;
  expiresAt: Date | null;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    token: item.token,
    expiresAt: item.expiresAt,
    isRevoked: item.isRevoked,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function generateResumeShareToken() {
  return randomBytes(SHARE_TOKEN_SIZE_BYTES).toString("base64url");
}

async function fetchResumeDetailById(prisma: ResumeServicePrismaClient, resumeId: string) {
  const detail = await prisma.resume.findUnique({
    where: { id: resumeId },
    select: resumeDetailSelect,
  });

  if (!detail) {
    throw new ResumeServiceError("NOT_FOUND", 404, "이력서를 찾을 수 없습니다.");
  }

  return mapResumeDetail(detail);
}

async function fetchResumePreviewById(prisma: ResumeServicePrismaClient, resumeId: string) {
  const detail = await prisma.resume.findUnique({
    where: { id: resumeId },
    select: resumeDetailSelect,
  });

  if (!detail) {
    throw new ResumeServiceError("NOT_FOUND", 404, "이력서를 찾을 수 없습니다.");
  }

  return mapResumePreview(detail);
}

export function createResumesService(deps: { prisma: ResumeServicePrismaClient }): ResumesService {
  const { prisma } = deps;

  return {
    async listResumesForOwner(ownerId) {
      const items = await prisma.resume.findMany({
        where: { ownerId },
        orderBy: [{ updatedAt: "desc" }],
        select: resumeListSelect,
      });

      return items.map(mapResumeListItem);
    },

    async getResumeForOwner(ownerId, resumeId) {
      await ensureResumeOwner(prisma, ownerId, resumeId);
      return fetchResumeDetailById(prisma, resumeId);
    },

    async createResume(ownerId, input) {
      const parsed = parseResumeCreateInput(input);

      try {
        const created = await prisma.resume.create({
          data: {
            ownerId,
            status: parsed.status ?? ResumeStatus.DRAFT,
            title: parsed.title,
            targetCompany: parsed.targetCompany ?? null,
            targetRole: parsed.targetRole ?? null,
            level: parsed.level ?? null,
            summaryMd: parsed.summaryMd ?? null,
          },
          select: {
            id: true,
          },
        });

        return fetchResumeDetailById(prisma, created.id);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updateResume(ownerId, resumeId, input) {
      await ensureResumeOwner(prisma, ownerId, resumeId);
      const parsed = parseResumeUpdateInput(input);

      try {
        await prisma.resume.update({
          where: { id: resumeId },
          data: parsed,
          select: { id: true },
        });

        return fetchResumeDetailById(prisma, resumeId);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteResume(ownerId, resumeId) {
      await ensureResumeOwner(prisma, ownerId, resumeId);
      await prisma.resume.delete({ where: { id: resumeId } });
      return { id: resumeId };
    },

    async listResumeItemsForOwner(ownerId, resumeId) {
      await ensureResumeOwner(prisma, ownerId, resumeId);

      const items = await prisma.resumeItem.findMany({
        where: { resumeId },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        select: resumeItemWithExperienceSelect,
      });

      return items.map(mapResumeItem);
    },

    async createResumeItem(ownerId, resumeId, input) {
      await ensureResumeOwner(prisma, ownerId, resumeId);
      const parsed = parseResumeItemCreateInput(input);
      await ensureExperienceOwner(prisma, ownerId, parsed.experienceId);

      try {
        const created = await prisma.resumeItem.create({
          data: {
            resumeId,
            experienceId: parsed.experienceId,
            sortOrder: parsed.sortOrder ?? 0,
            overrideBulletsJson: toNullableJsonInput(parsed.overrideBulletsJson),
            overrideMetricsJson: toNullableJsonInput(parsed.overrideMetricsJson),
            overrideTechTags: parsed.overrideTechTags ?? [],
            notes: parsed.notes ?? null,
          },
          select: resumeItemWithExperienceSelect,
        });

        return mapResumeItem(created);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updateResumeItem(ownerId, resumeId, itemId, input) {
      await ensureResumeOwner(prisma, ownerId, resumeId);

      const existing = await prisma.resumeItem.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          resumeId: true,
        },
      });

      if (!existing || existing.resumeId !== resumeId) {
        throw new ResumeServiceError("NOT_FOUND", 404, "이력서 항목을 찾을 수 없습니다.");
      }

      const parsed = parseResumeItemUpdateInput(input);
      if (parsed.experienceId !== undefined) {
        await ensureExperienceOwner(prisma, ownerId, parsed.experienceId);
      }

      try {
        const updated = await prisma.resumeItem.update({
          where: { id: itemId },
          data: parsed,
          select: resumeItemWithExperienceSelect,
        });

        return mapResumeItem(updated);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteResumeItem(ownerId, resumeId, itemId) {
      await ensureResumeOwner(prisma, ownerId, resumeId);

      const existing = await prisma.resumeItem.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          resumeId: true,
        },
      });

      if (!existing || existing.resumeId !== resumeId) {
        throw new ResumeServiceError("NOT_FOUND", 404, "이력서 항목을 찾을 수 없습니다.");
      }

      await prisma.resumeItem.delete({ where: { id: itemId } });
      return { id: itemId };
    },

    async getResumePreviewForOwner(ownerId, resumeId) {
      await ensureResumeOwner(prisma, ownerId, resumeId);
      return fetchResumePreviewById(prisma, resumeId);
    },

    async listResumeShareLinksForOwner(ownerId, resumeId) {
      await ensureResumeOwner(prisma, ownerId, resumeId);

      const links = await prisma.resumeShareLink.findMany({
        where: { resumeId },
        orderBy: [{ createdAt: "desc" }],
        select: resumeShareLinkSelect,
      });

      return links.map(mapResumeShareLink);
    },

    async createResumeShareLink(ownerId, resumeId, input) {
      await ensureResumeOwner(prisma, ownerId, resumeId);
      const parsed = parseResumeShareLinkCreateInput(input);

      for (let index = 0; index < MAX_SHARE_TOKEN_RETRY; index += 1) {
        const token = generateResumeShareToken();
        try {
          const created = await prisma.resumeShareLink.create({
            data: {
              resumeId,
              token,
              expiresAt: parsed.expiresAt ?? null,
            },
            select: resumeShareLinkSelect,
          });

          return mapResumeShareLink(created);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            Array.isArray(error.meta?.target) &&
            error.meta.target.includes("token")
          ) {
            continue;
          }
          handleKnownPrismaError(error);
        }
      }

      throw new ResumeServiceError("CONFLICT", 409, "공유 토큰 생성에 실패했습니다.");
    },

    async revokeResumeShareLink(ownerId, resumeId, shareLinkId) {
      await ensureResumeOwner(prisma, ownerId, resumeId);

      const link = await prisma.resumeShareLink.findUnique({
        where: { id: shareLinkId },
        select: {
          id: true,
          resumeId: true,
        },
      });

      if (!link || link.resumeId !== resumeId) {
        throw new ResumeServiceError("NOT_FOUND", 404, "공유 링크를 찾을 수 없습니다.");
      }

      await prisma.resumeShareLink.update({
        where: { id: shareLinkId },
        data: {
          isRevoked: true,
        },
        select: { id: true },
      });

      return { id: shareLinkId };
    },

    async getResumePreviewByShareToken(token) {
      const link = await prisma.resumeShareLink.findUnique({
        where: { token },
        select: {
          id: true,
          resumeId: true,
          isRevoked: true,
          expiresAt: true,
        },
      });

      if (!link || link.isRevoked) {
        throw new ResumeServiceError("NOT_FOUND", 404, "공유된 이력서를 찾을 수 없습니다.");
      }

      if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
        throw new ResumeServiceError("NOT_FOUND", 404, "공유 링크가 만료되었습니다.");
      }

      return fetchResumePreviewById(prisma, link.resumeId);
    },
  };
}

// ─────────────────────────────────────────────
// T80-5: AI 이력서 초안 생성
// ─────────────────────────────────────────────

const RESUME_DRAFT_SYSTEM_PROMPT =
  "당신은 대한민국 IT 업계 경력 10년 이상의 이력서 작성 전문 컨설턴트입니다. " +
  "채용 담당자가 서류 심사에서 주목하는 핵심 역량과 성과를 강조하는 이력서를 작성합니다. " +
  "반드시 한국어로 응답하세요.";

const RESUME_DRAFT_TEMPERATURE = 0.5;
const RESUME_DRAFT_MAX_OUTPUT_TOKENS = 4096;
const MAX_JD_LENGTH = 5000;
const SORT_ORDER_STEP = 10;
const MAX_DRAFT_EXPERIENCES = 5;
const MAX_OVERRIDE_BULLETS = 20;

const resumeDraftSchema = z.object({
  targetCompany: z
    .string()
    .trim()
    .max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  targetRole: z
    .string()
    .trim()
    .max(MAX_ROLE_LENGTH, "직무명은 120자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  level: z
    .string()
    .trim()
    .max(MAX_LEVEL_LENGTH, "레벨은 50자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  jobDescription: z
    .string()
    .trim()
    .max(MAX_JD_LENGTH, "채용 공고는 5000자 이하로 입력해주세요.")
    .optional()
    .nullable(),
});

export function parseResumeDraftInput(input: unknown): ResumeDraftInput {
  try {
    const parsed = resumeDraftSchema.parse(input);
    return {
      targetCompany: toNullableString(parsed.targetCompany),
      targetRole: toNullableString(parsed.targetRole),
      level: toNullableString(parsed.level),
      jobDescription: parsed.jobDescription?.trim() || null,
    };
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ResumeServiceError(
        "VALIDATION_ERROR",
        422,
        "AI 이력서 초안 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

type ExperienceForDraft = {
  id: string;
  company: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  summary: string | null;
  bulletsJson: unknown;
  metricsJson: unknown;
  techTags: string[];
  visibility: string;
  isFeatured: boolean;
};

type SkillForDraft = {
  name: string;
  category: string | null;
};

type ResumeDraftItemData = {
  experienceId: string;
  overrideBullets: string[] | null;
  overrideMetrics: Record<string, string> | null;
  overrideTechTags: string[];
  notes: string | null;
};

type ResumeDraftData = {
  summaryMd: string | null;
  items: ResumeDraftItemData[];
};

function formatDateYM(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function draftSafeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function draftSafeJsonRecord(value: unknown): Record<string, string> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record: Record<string, string> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      record[k] = String(v);
    }
    return record;
  }
  return {};
}

export function buildResumeDraftPrompt(
  experiences: ExperienceForDraft[],
  skills: SkillForDraft[],
  input: ResumeDraftInput,
): string {
  const targetSection = [
    `- 지원 회사: ${input.targetCompany || "미지정"}`,
    `- 지원 직무: ${input.targetRole || "미지정"}`,
    `- 레벨: ${input.level || "미지정"}`,
  ].join("\n");

  const jdSection = input.jobDescription
    ? `\n## 채용 공고 (JD)\n${input.jobDescription.slice(0, MAX_JD_LENGTH)}\n`
    : "";

  const expList = experiences
    .map((exp, i) => {
      const period = exp.isCurrent
        ? `${formatDateYM(exp.startDate)} ~ 현재`
        : `${formatDateYM(exp.startDate)} ~ ${exp.endDate ? formatDateYM(exp.endDate) : "미정"}`;
      const lines = [`### ${i + 1}. ${exp.company} — ${exp.role} (${period})`];
      if (exp.summary) lines.push(`요약: ${exp.summary}`);
      const bullets = draftSafeJsonArray(exp.bulletsJson);
      if (bullets.length > 0) lines.push(`성과:\n${bullets.map((b) => `  - ${b}`).join("\n")}`);
      const metrics = draftSafeJsonRecord(exp.metricsJson);
      if (Object.keys(metrics).length > 0) {
        lines.push(
          `지표:\n${Object.entries(metrics)
            .map(([k, v]) => `  - ${k}: ${v}`)
            .join("\n")}`,
        );
      }
      if (exp.techTags.length > 0) lines.push(`기술: ${exp.techTags.join(", ")}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const skillsByCategory = new Map<string, string[]>();
  for (const skill of skills) {
    const cat = skill.category || "기타";
    if (!skillsByCategory.has(cat)) skillsByCategory.set(cat, []);
    skillsByCategory.get(cat)!.push(skill.name);
  }
  const skillList = Array.from(skillsByCategory.entries())
    .map(([cat, names]) => `- ${cat}: ${names.join(", ")}`)
    .join("\n");

  return (
    `아래 개발자의 경력과 기술 스택을 분석하여, 지원 직무에 최적화된 이력서 초안을 JSON으로 작성하세요.\n\n` +
    `## 지원 정보\n${targetSection}\n` +
    `${jdSection}\n` +
    `## 보유 경력 (총 ${experiences.length}개)\n${expList}\n\n` +
    `## 보유 기술\n${skillList || "기술 정보 없음"}\n\n` +
    `## 응답 형식\n` +
    `아래 JSON 객체만 반환하세요. 다른 텍스트는 포함하지 마세요.\n` +
    "```json\n" +
    `{\n` +
    `  "summaryMd": "지원 직무에 맞춘 자기소개 (3~5문장, 마크다운)",\n` +
    `  "selectedExperiences": [\n` +
    `    {\n` +
    `      "index": 1,\n` +
    `      "overrideBullets": ["직무 맞춤 성과 1", "직무 맞춤 성과 2"],\n` +
    `      "overrideMetrics": {"라벨": "수치"},\n` +
    `      "overrideTechTags": ["관련 기술"],\n` +
    `      "notes": "이 경력 선택 이유"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n` +
    "```\n\n" +
    `## 작성 규칙\n` +
    `1. 지원 직무와 가장 관련 높은 경력만 선별 (2~5개)\n` +
    `2. 각 경력의 성과를 지원 직무 관점으로 STAR 기법으로 재구성\n` +
    `3. 정량적 지표(매출, 성능, 비용, 사용자 수 등) 필수 포함\n` +
    `4. 기술 태그는 JD와 매칭되는 것을 우선 배치\n` +
    `5. 요약문은 지원 직무에 맞는 핵심 가치 제안 (차별화 포인트 명시)\n` +
    `6. index는 위 경력 목록의 번호(1부터 시작)\n` +
    `7. 경력이 없으면 selectedExperiences를 빈 배열로 반환`
  );
}

export function parseResumeDraftResponse(
  text: string,
  experiences: ExperienceForDraft[],
): ResumeDraftData {
  let jsonText = text.trim();

  const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  const objectMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    throw new GeminiClientError(
      "EMPTY_RESPONSE",
      502,
      "LLM 응답에서 JSON 객체를 찾을 수 없습니다.",
      true,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(objectMatch[0]);
  } catch {
    throw new GeminiClientError("EMPTY_RESPONSE", 502, "LLM 응답 JSON 파싱 실패", true);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new GeminiClientError("EMPTY_RESPONSE", 502, "LLM 응답이 JSON 객체가 아닙니다.", true);
  }

  const data = parsed as Record<string, unknown>;

  const summaryMd =
    typeof data.summaryMd === "string" ? data.summaryMd.slice(0, MAX_SUMMARY_LENGTH) : null;

  const selectedExperiences = Array.isArray(data.selectedExperiences)
    ? data.selectedExperiences
    : [];

  const items: ResumeDraftItemData[] = [];
  const usedExperienceIds = new Set<string>();

  for (const entry of selectedExperiences) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;

    const index = typeof e.index === "number" ? e.index : Number(e.index);
    if (Number.isNaN(index) || index < 1 || index > experiences.length) continue;

    const experience = experiences[index - 1];
    if (usedExperienceIds.has(experience.id)) continue;
    usedExperienceIds.add(experience.id);

    const overrideBullets = Array.isArray(e.overrideBullets)
      ? e.overrideBullets
          .filter((b): b is string => typeof b === "string")
          .slice(0, MAX_OVERRIDE_BULLETS)
      : null;

    const overrideMetrics =
      typeof e.overrideMetrics === "object" &&
      e.overrideMetrics !== null &&
      !Array.isArray(e.overrideMetrics)
        ? draftSafeJsonRecord(e.overrideMetrics)
        : null;

    const overrideTechTags = Array.isArray(e.overrideTechTags)
      ? e.overrideTechTags
          .filter((t): t is string => typeof t === "string")
          .slice(0, MAX_TECH_TAG_SIZE)
      : [];

    const notes =
      typeof e.notes === "string" ? e.notes.slice(0, MAX_NOTES_LENGTH) : null;

    items.push({
      experienceId: experience.id,
      overrideBullets: overrideBullets && overrideBullets.length > 0 ? overrideBullets : null,
      overrideMetrics:
        overrideMetrics && Object.keys(overrideMetrics).length > 0 ? overrideMetrics : null,
      overrideTechTags,
      notes,
    });
  }

  return { summaryMd, items };
}

export function buildFallbackResumeDraft(
  experiences: ExperienceForDraft[],
): ResumeDraftData {
  const publicExperiences = experiences
    .filter((e) => e.visibility === "PUBLIC")
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      return b.startDate.getTime() - a.startDate.getTime();
    })
    .slice(0, MAX_DRAFT_EXPERIENCES);

  return {
    summaryMd: null,
    items: publicExperiences.map((exp) => ({
      experienceId: exp.id,
      overrideBullets: null,
      overrideMetrics: null,
      overrideTechTags: [],
      notes: null,
    })),
  };
}

export function generateDraftTitle(input: ResumeDraftInput): string {
  const parts: string[] = [];
  if (input.targetCompany) parts.push(input.targetCompany);
  if (input.targetRole) parts.push(input.targetRole);
  if (parts.length > 0) return `${parts.join(" ")} AI 초안`;
  return "AI 이력서 초안";
}

export { RESUME_DRAFT_SYSTEM_PROMPT };

export async function generateResumeDraft(
  resumesService: ResumesService,
  prisma: ResumeDraftPrismaClient,
  ownerId: string,
  input: unknown,
): Promise<OwnerResumeDetailDto> {
  const parsed = parseResumeDraftInput(input);

  const experiences = await prisma.experience.findMany({
    where: { ownerId },
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
    select: {
      id: true,
      company: true,
      role: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      summary: true,
      bulletsJson: true,
      metricsJson: true,
      techTags: true,
      visibility: true,
      isFeatured: true,
    },
  });

  if (experiences.length === 0) {
    throw new ResumeServiceError(
      "VALIDATION_ERROR",
      422,
      "등록된 경력이 없습니다. 경력을 먼저 추가해주세요.",
    );
  }

  const skills = await prisma.skill.findMany({
    where: { ownerId },
    select: { name: true, category: true },
    orderBy: [{ order: "asc" }],
  });

  const client = getDefaultGeminiClient();
  const { result: draftData } = await withGeminiFallback(
    client,
    async () => {
      const prompt = buildResumeDraftPrompt(experiences, skills, parsed);
      const { text } = await client.generateText(prompt, {
        systemPrompt: RESUME_DRAFT_SYSTEM_PROMPT,
        temperature: RESUME_DRAFT_TEMPERATURE,
        maxOutputTokens: RESUME_DRAFT_MAX_OUTPUT_TOKENS,
      });
      return parseResumeDraftResponse(text, experiences);
    },
    () => buildFallbackResumeDraft(experiences),
  );

  const title = generateDraftTitle(parsed);
  const resume = await resumesService.createResume(ownerId, {
    title,
    targetCompany: parsed.targetCompany,
    targetRole: parsed.targetRole,
    level: parsed.level,
    summaryMd: draftData.summaryMd,
    status: "DRAFT",
  });

  for (let i = 0; i < draftData.items.length; i++) {
    const item = draftData.items[i];
    try {
      await resumesService.createResumeItem(ownerId, resume.id, {
        experienceId: item.experienceId,
        sortOrder: (i + 1) * SORT_ORDER_STEP,
        overrideBulletsJson: item.overrideBullets,
        overrideMetricsJson: item.overrideMetrics,
        overrideTechTags: item.overrideTechTags,
        notes: item.notes,
      });
    } catch (error) {
      console.warn(
        `이력서 초안 항목 생성 실패 (experienceId: ${item.experienceId}):`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return resumesService.getResumeForOwner(ownerId, resume.id);
}
