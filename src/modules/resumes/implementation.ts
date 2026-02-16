import { randomBytes } from "node:crypto";
import { Prisma, ResumeStatus } from "@prisma/client";
import { z } from "zod";
import {
  type ResumeCreateInput,
  type ResumeItemCreateInput,
  type ResumeShareLinkCreateInput,
  ResumeServiceError,
  type ResumeServicePrismaClient,
  type ResumesService,
} from "@/modules/resumes/interface";

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
