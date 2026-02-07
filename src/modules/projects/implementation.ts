import { Prisma, Visibility } from "@prisma/client";
import { z } from "zod";
import {
  MAX_PROJECT_SLUG_LENGTH,
  PROJECT_SLUG_PATTERN,
  type ProjectCreateInput,
  type ProjectServicePrismaClient,
  ProjectServiceError,
  type ProjectsService,
} from "@/modules/projects/interface";

const MIN_TITLE_LENGTH = 2;
const MAX_TITLE_LENGTH = 80;
const MAX_SUBTITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_TECH_STACK_SIZE = 50;
const MIN_ORDER = 0;
const MAX_ORDER = 9999;
const EMPTY_LENGTH = 0;

type NormalizedProjectUpdateInput = {
  slug?: string;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  contentMd?: string;
  techStack?: string[];
  repoUrl?: string | null;
  demoUrl?: string | null;
  thumbnailUrl?: string | null;
  visibility?: Visibility;
  isFeatured?: boolean;
  order?: number;
  highlightsJson?: Prisma.InputJsonValue | Prisma.NullTypes.DbNull;
};

const createProjectSchema = z.object({
  slug: z.string().trim().min(1, "슬러그를 입력해주세요.").max(MAX_PROJECT_SLUG_LENGTH, "슬러그는 100자 이하로 입력해주세요.").optional(),
  title: z.string().trim().min(MIN_TITLE_LENGTH, "제목은 2자 이상이어야 합니다.").max(MAX_TITLE_LENGTH, "제목은 80자 이하로 입력해주세요."),
  subtitle: z.string().trim().max(MAX_SUBTITLE_LENGTH, "부제목은 120자 이하로 입력해주세요.").optional().nullable(),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, "설명은 200자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  contentMd: z.string().trim().min(1, "본문은 비어 있을 수 없습니다."),
  techStack: z.array(z.string().trim().min(1, "기술 스택 항목은 비어 있을 수 없습니다.")).max(MAX_TECH_STACK_SIZE, "기술 스택은 최대 50개까지 입력할 수 있습니다.").optional().default([]),
  repoUrl: z.string().url("repoUrl은 올바른 URL이어야 합니다.").optional().nullable(),
  demoUrl: z.string().url("demoUrl은 올바른 URL이어야 합니다.").optional().nullable(),
  thumbnailUrl: z.string().url("thumbnailUrl은 올바른 URL이어야 합니다.").optional().nullable(),
  visibility: z.nativeEnum(Visibility).optional().default(Visibility.PUBLIC),
  isFeatured: z.boolean().optional().default(false),
  order: z.number().int("order는 정수여야 합니다.").min(MIN_ORDER, "order는 0 이상이어야 합니다.").max(MAX_ORDER, "order는 9999 이하여야 합니다.").optional().default(0),
  highlightsJson: z.unknown().optional().nullable(),
});

const updateProjectSchema = z
  .object({
    slug: z.string().trim().min(1, "슬러그를 입력해주세요.").max(MAX_PROJECT_SLUG_LENGTH, "슬러그는 100자 이하로 입력해주세요.").optional(),
    title: z.string().trim().min(MIN_TITLE_LENGTH, "제목은 2자 이상이어야 합니다.").max(MAX_TITLE_LENGTH, "제목은 80자 이하로 입력해주세요.").optional(),
    subtitle: z.string().trim().max(MAX_SUBTITLE_LENGTH, "부제목은 120자 이하로 입력해주세요.").optional().nullable(),
    description: z
      .string()
      .trim()
      .max(MAX_DESCRIPTION_LENGTH, "설명은 200자 이하로 입력해주세요.")
      .optional()
      .nullable(),
    contentMd: z.string().trim().min(1, "본문은 비어 있을 수 없습니다.").optional(),
    techStack: z.array(z.string().trim().min(1, "기술 스택 항목은 비어 있을 수 없습니다.")).max(MAX_TECH_STACK_SIZE, "기술 스택은 최대 50개까지 입력할 수 있습니다.").optional(),
    repoUrl: z.string().url("repoUrl은 올바른 URL이어야 합니다.").optional().nullable(),
    demoUrl: z.string().url("demoUrl은 올바른 URL이어야 합니다.").optional().nullable(),
    thumbnailUrl: z.string().url("thumbnailUrl은 올바른 URL이어야 합니다.").optional().nullable(),
    visibility: z.nativeEnum(Visibility).optional(),
    isFeatured: z.boolean().optional(),
    order: z.number().int("order는 정수여야 합니다.").min(MIN_ORDER, "order는 0 이상이어야 합니다.").max(MAX_ORDER, "order는 9999 이하여야 합니다.").optional(),
    highlightsJson: z.unknown().optional().nullable(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const ownerProjectSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  description: true,
  contentMd: true,
  techStack: true,
  repoUrl: true,
  demoUrl: true,
  thumbnailUrl: true,
  visibility: true,
  isFeatured: true,
  order: true,
  highlightsJson: true,
  updatedAt: true,
} as const;

const publicProjectListSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  techStack: true,
  thumbnailUrl: true,
  updatedAt: true,
} as const;

const publicProjectDetailSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  contentMd: true,
  techStack: true,
  repoUrl: true,
  demoUrl: true,
  highlightsJson: true,
  updatedAt: true,
} as const;

const featuredProjectSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  description: true,
  techStack: true,
  repoUrl: true,
  demoUrl: true,
  thumbnailUrl: true,
} as const;

const featuredExperienceSelect = {
  id: true,
  company: true,
  role: true,
  startDate: true,
  endDate: true,
  summary: true,
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

export function buildProjectSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, MAX_PROJECT_SLUG_LENGTH);
}

function validateFeaturedRule(visibility: Visibility, isFeatured: boolean) {
  if (isFeatured && visibility !== Visibility.PUBLIC) {
    throw new ProjectServiceError("VALIDATION_ERROR", 422, "대표 프로젝트는 공개 상태여야 합니다.", {
      visibility: "isFeatured가 true이면 visibility는 PUBLIC이어야 합니다.",
    });
  }
}

function normalizeCreateInput(input: z.infer<typeof createProjectSchema>) {
  const normalizedSlug = buildProjectSlug(input.slug ?? input.title);
  if (!PROJECT_SLUG_PATTERN.test(normalizedSlug)) {
    throw new ProjectServiceError("VALIDATION_ERROR", 422, "슬러그 형식이 올바르지 않습니다.", {
      slug: "슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
    });
  }

  validateFeaturedRule(input.visibility, input.isFeatured);

  return {
    slug: normalizedSlug,
    title: input.title,
    subtitle: toNullableString(input.subtitle),
    description: toNullableString(input.description),
    contentMd: input.contentMd,
    techStack: input.techStack,
    repoUrl: toNullableString(input.repoUrl),
    demoUrl: toNullableString(input.demoUrl),
    thumbnailUrl: toNullableString(input.thumbnailUrl),
    visibility: input.visibility,
    isFeatured: input.isFeatured,
    order: input.order,
    highlightsJson: input.highlightsJson as Prisma.InputJsonValue | null | undefined,
  };
}

function normalizeUpdateInput(input: z.infer<typeof updateProjectSchema>): NormalizedProjectUpdateInput {
  const normalized: NormalizedProjectUpdateInput = {};

  if (input.slug !== undefined) {
    const slug = buildProjectSlug(input.slug);
    if (!PROJECT_SLUG_PATTERN.test(slug)) {
      throw new ProjectServiceError("VALIDATION_ERROR", 422, "슬러그 형식이 올바르지 않습니다.", {
        slug: "슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
      });
    }
    normalized.slug = slug;
  }

  if (input.title !== undefined) {
    normalized.title = input.title;
  }

  if (input.subtitle !== undefined) {
    normalized.subtitle = toNullableString(input.subtitle);
  }

  if (input.description !== undefined) {
    normalized.description = toNullableString(input.description);
  }

  if (input.contentMd !== undefined) {
    normalized.contentMd = input.contentMd;
  }

  if (input.techStack !== undefined) {
    normalized.techStack = input.techStack;
  }

  if (input.repoUrl !== undefined) {
    normalized.repoUrl = toNullableString(input.repoUrl);
  }

  if (input.demoUrl !== undefined) {
    normalized.demoUrl = toNullableString(input.demoUrl);
  }

  if (input.thumbnailUrl !== undefined) {
    normalized.thumbnailUrl = toNullableString(input.thumbnailUrl);
  }

  if (input.visibility !== undefined) {
    normalized.visibility = input.visibility;
  }

  if (input.isFeatured !== undefined) {
    normalized.isFeatured = input.isFeatured;
  }

  if (input.order !== undefined) {
    normalized.order = input.order;
  }

  if (input.highlightsJson !== undefined) {
    normalized.highlightsJson = toNullableJsonInput(
      input.highlightsJson as Prisma.InputJsonValue | null,
    );
  }

  return normalized;
}

export function parseProjectCreateInput(input: unknown): ProjectCreateInput {
  try {
    const parsed = createProjectSchema.parse(input);
    return normalizeCreateInput(parsed);
  } catch (error) {
    if (error instanceof ProjectServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ProjectServiceError("VALIDATION_ERROR", 422, "프로젝트 입력값이 올바르지 않습니다.", extractZodFieldErrors(error));
    }

    throw error;
  }
}

export function parseProjectUpdateInput(input: unknown): NormalizedProjectUpdateInput {
  try {
    const parsed = updateProjectSchema.parse(input);
    return normalizeUpdateInput(parsed);
  } catch (error) {
    if (error instanceof ProjectServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ProjectServiceError("VALIDATION_ERROR", 422, "프로젝트 수정 입력값이 올바르지 않습니다.", extractZodFieldErrors(error));
    }

    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ProjectServiceError("CONFLICT", 409, "이미 사용 중인 슬러그입니다.", {
      slug: "slug 값이 중복되었습니다.",
    });
  }

  throw error;
}

export function createProjectsService(deps: { prisma: ProjectServicePrismaClient }): ProjectsService {
  const { prisma } = deps;

  return {
    async listProjectsForOwner(ownerId) {
      return prisma.project.findMany({
        where: { ownerId },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: ownerProjectSelect,
      });
    },

    async getProjectForOwner(ownerId, projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          ...ownerProjectSelect,
          ownerId: true,
        },
      });

      if (!project) {
        throw new ProjectServiceError("NOT_FOUND", 404, "프로젝트를 찾을 수 없습니다.");
      }

      if (project.ownerId !== ownerId) {
        throw new ProjectServiceError("FORBIDDEN", 403, "다른 사용자의 프로젝트에는 접근할 수 없습니다.");
      }

      const { ownerId: ownerIdFromRecord, ...dto } = project;
      void ownerIdFromRecord;
      return dto;
    },

    async createProject(ownerId, input) {
      const parsed = parseProjectCreateInput(input);

      try {
        return await prisma.project.create({
          data: {
            ownerId,
            slug: parsed.slug!,
            title: parsed.title,
            subtitle: parsed.subtitle ?? null,
            description: parsed.description ?? null,
            contentMd: parsed.contentMd,
            techStack: parsed.techStack ?? [],
            repoUrl: parsed.repoUrl ?? null,
            demoUrl: parsed.demoUrl ?? null,
            thumbnailUrl: parsed.thumbnailUrl ?? null,
            visibility: parsed.visibility ?? Visibility.PUBLIC,
            isFeatured: parsed.isFeatured ?? false,
            order: parsed.order ?? 0,
            highlightsJson: toNullableJsonInput(
              parsed.highlightsJson as Prisma.InputJsonValue | null | undefined,
            ),
          },
          select: ownerProjectSelect,
        });
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updateProject(ownerId, projectId, input) {
      const existing = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          ownerId: true,
          visibility: true,
          isFeatured: true,
        },
      });

      if (!existing) {
        throw new ProjectServiceError("NOT_FOUND", 404, "프로젝트를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ProjectServiceError("FORBIDDEN", 403, "다른 사용자의 프로젝트는 수정할 수 없습니다.");
      }

      const parsed = parseProjectUpdateInput(input);
      const nextVisibility = parsed.visibility ?? existing.visibility;
      const nextFeatured = parsed.isFeatured ?? existing.isFeatured;
      validateFeaturedRule(nextVisibility, nextFeatured);

      try {
        return await prisma.project.update({
          where: { id: existing.id },
          data: parsed,
          select: ownerProjectSelect,
        });
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteProject(ownerId, projectId) {
      const existing = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          ownerId: true,
        },
      });

      if (!existing) {
        throw new ProjectServiceError("NOT_FOUND", 404, "프로젝트를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ProjectServiceError("FORBIDDEN", 403, "다른 사용자의 프로젝트는 삭제할 수 없습니다.");
      }

      await prisma.project.delete({
        where: { id: existing.id },
      });

      return { id: existing.id };
    },

    async listPublicProjects() {
      return prisma.project.findMany({
        where: {
          visibility: Visibility.PUBLIC,
        },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: publicProjectListSelect,
      });
    },

    async getPublicProjectBySlug(slug) {
      const project = await prisma.project.findFirst({
        where: {
          slug,
          visibility: Visibility.PUBLIC,
        },
        select: publicProjectDetailSelect,
      });

      if (!project) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 프로젝트를 찾을 수 없습니다.");
      }

      return project;
    },

    async getPublicPortfolio(slug) {
      const settings = await prisma.portfolioSettings.findFirst({
        where: slug
          ? {
              isPublic: true,
              publicSlug: slug,
            }
          : {
              isPublic: true,
            },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          ownerId: true,
          displayName: true,
          headline: true,
          bio: true,
          avatarUrl: true,
          links: {
            orderBy: { order: "asc" },
            select: {
              label: true,
              url: true,
            },
          },
        },
      });

      if (!settings) {
        return {
          profile: null,
          featuredProjects: [],
          featuredExperiences: [],
        };
      }

      const [featuredProjects, featuredExperiences] = await Promise.all([
        prisma.project.findMany({
          where: {
            ownerId: settings.ownerId,
            visibility: Visibility.PUBLIC,
            isFeatured: true,
          },
          orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
          take: 6,
          select: featuredProjectSelect,
        }),
        prisma.experience.findMany({
          where: {
            ownerId: settings.ownerId,
            visibility: Visibility.PUBLIC,
            isFeatured: true,
          },
          orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
          take: 3,
          select: featuredExperienceSelect,
        }),
      ]);

      return {
        profile: {
          displayName: settings.displayName,
          headline: settings.headline,
          bio: settings.bio,
          avatarUrl: settings.avatarUrl,
          links: settings.links,
        },
        featuredProjects,
        featuredExperiences,
      };
    },
  };
}
