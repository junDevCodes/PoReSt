import { Prisma, Visibility } from "@prisma/client";
import { z } from "zod";
import {
  MAX_PROJECT_SLUG_LENGTH,
  PROJECT_SLUG_PATTERN,
  type ProjectCreateInput,
  type PublicProjectsQuery,
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
const DEFAULT_PUBLIC_PROJECT_LIMIT = 20;
const MAX_PUBLIC_PROJECT_LIMIT = 50;

type PublicProjectsCursorPayload = {
  updatedAt: string;
  id: string;
};

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
  slug: z.string().trim().min(1, "?щ윭洹몃? ?낅젰?댁＜?몄슂.").max(MAX_PROJECT_SLUG_LENGTH, "?щ윭洹몃뒗 100???댄븯濡??낅젰?댁＜?몄슂.").optional(),
  title: z.string().trim().min(MIN_TITLE_LENGTH, "?쒕ぉ? 2???댁긽?댁뼱???⑸땲??").max(MAX_TITLE_LENGTH, "?쒕ぉ? 80???댄븯濡??낅젰?댁＜?몄슂."),
  subtitle: z.string().trim().max(MAX_SUBTITLE_LENGTH, "遺?쒕ぉ? 120???댄븯濡??낅젰?댁＜?몄슂.").optional().nullable(),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, "?ㅻ챸? 200???댄븯濡??낅젰?댁＜?몄슂.")
    .optional()
    .nullable(),
  contentMd: z.string().trim().min(1, "蹂몃Ц? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎."),
  techStack: z.array(z.string().trim().min(1, "湲곗닠 ?ㅽ깮 ??ぉ? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎.")).max(MAX_TECH_STACK_SIZE, "湲곗닠 ?ㅽ깮? 理쒕? 50媛쒓퉴吏 ?낅젰?????덉뒿?덈떎.").optional().default([]),
  repoUrl: z.string().url("repoUrl? ?щ컮瑜?URL?댁뼱???⑸땲??").optional().nullable(),
  demoUrl: z.string().url("demoUrl? ?щ컮瑜?URL?댁뼱???⑸땲??").optional().nullable(),
  thumbnailUrl: z.string().url("thumbnailUrl? ?щ컮瑜?URL?댁뼱???⑸땲??").optional().nullable(),
  visibility: z.nativeEnum(Visibility).optional().default(Visibility.PUBLIC),
  isFeatured: z.boolean().optional().default(false),
  order: z.number().int("order???뺤닔?ъ빞 ?⑸땲??").min(MIN_ORDER, "order??0 ?댁긽?댁뼱???⑸땲??").max(MAX_ORDER, "order??9999 ?댄븯?ъ빞 ?⑸땲??").optional().default(0),
  highlightsJson: z.unknown().optional().nullable(),
});

const updateProjectSchema = z
  .object({
    slug: z.string().trim().min(1, "?щ윭洹몃? ?낅젰?댁＜?몄슂.").max(MAX_PROJECT_SLUG_LENGTH, "?щ윭洹몃뒗 100???댄븯濡??낅젰?댁＜?몄슂.").optional(),
    title: z.string().trim().min(MIN_TITLE_LENGTH, "?쒕ぉ? 2???댁긽?댁뼱???⑸땲??").max(MAX_TITLE_LENGTH, "?쒕ぉ? 80???댄븯濡??낅젰?댁＜?몄슂.").optional(),
    subtitle: z.string().trim().max(MAX_SUBTITLE_LENGTH, "遺?쒕ぉ? 120???댄븯濡??낅젰?댁＜?몄슂.").optional().nullable(),
    description: z
      .string()
      .trim()
      .max(MAX_DESCRIPTION_LENGTH, "?ㅻ챸? 200???댄븯濡??낅젰?댁＜?몄슂.")
      .optional()
      .nullable(),
    contentMd: z.string().trim().min(1, "蹂몃Ц? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎.").optional(),
    techStack: z.array(z.string().trim().min(1, "湲곗닠 ?ㅽ깮 ??ぉ? 鍮꾩뼱 ?덉쓣 ???놁뒿?덈떎.")).max(MAX_TECH_STACK_SIZE, "湲곗닠 ?ㅽ깮? 理쒕? 50媛쒓퉴吏 ?낅젰?????덉뒿?덈떎.").optional(),
    repoUrl: z.string().url("repoUrl? ?щ컮瑜?URL?댁뼱???⑸땲??").optional().nullable(),
    demoUrl: z.string().url("demoUrl? ?щ컮瑜?URL?댁뼱???⑸땲??").optional().nullable(),
    thumbnailUrl: z.string().url("thumbnailUrl? ?щ컮瑜?URL?댁뼱???⑸땲??").optional().nullable(),
    visibility: z.nativeEnum(Visibility).optional(),
    isFeatured: z.boolean().optional(),
    order: z.number().int("order???뺤닔?ъ빞 ?⑸땲??").min(MIN_ORDER, "order??0 ?댁긽?댁뼱???⑸땲??").max(MAX_ORDER, "order??9999 ?댄븯?ъ빞 ?⑸땲??").optional(),
    highlightsJson: z.unknown().optional().nullable(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "?섏젙???꾨뱶瑜?理쒖냼 1媛??댁긽 ?낅젰?댁＜?몄슂.",
    path: ["root"],
  });

const publicProjectsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  publicSlug: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PUBLIC_PROJECT_LIMIT).optional(),
  cursor: z.string().trim().min(1).optional(),
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
  owner: {
    select: {
      portfolioSettings: {
        select: {
          publicSlug: true,
        },
      },
    },
  },
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
  owner: {
    select: {
      portfolioSettings: {
        select: {
          publicSlug: true,
        },
      },
    },
  },
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

function encodePublicProjectsCursor(payload: PublicProjectsCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePublicProjectsCursor(cursor: string): PublicProjectsCursorPayload {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as PublicProjectsCursorPayload;
    if (!parsed.updatedAt || !parsed.id) {
      throw new Error("INVALID_CURSOR");
    }
    return parsed;
  } catch {
    throw new ProjectServiceError("VALIDATION_ERROR", 422, "cursor 값이 올바르지 않습니다.", {
      cursor: "cursor 값을 확인해주세요.",
    });
  }
}

function parsePublicProjectsQuery(input: PublicProjectsQuery) {
  try {
    const parsed = publicProjectsQuerySchema.parse(input);
    return {
      q: parsed.q,
      tag: parsed.tag,
      publicSlug: parsed.publicSlug,
      limit: parsed.limit ?? DEFAULT_PUBLIC_PROJECT_LIMIT,
      cursor: parsed.cursor,
    };
  } catch (error) {
    if (error instanceof ProjectServiceError) {
      throw error;
    }
    if (error instanceof z.ZodError) {
      throw new ProjectServiceError(
        "VALIDATION_ERROR",
        422,
        "프로젝트 검색 조건이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }
    throw error;
  }
}

function mapPublicProjectListItem(
  project: Prisma.ProjectGetPayload<{
    select: typeof publicProjectListSelect;
  }>,
) {
  const publicSlug = project.owner.portfolioSettings?.publicSlug;
  if (!publicSlug) {
    return null;
  }

  return {
    id: project.id,
    publicSlug,
    slug: project.slug,
    title: project.title,
    description: project.description,
    techStack: project.techStack,
    thumbnailUrl: project.thumbnailUrl,
    updatedAt: project.updatedAt,
  };
}

function mapPublicProjectDetail(
  project: Prisma.ProjectGetPayload<{
    select: typeof publicProjectDetailSelect;
  }>,
) {
  const publicSlug = project.owner.portfolioSettings?.publicSlug;
  if (!publicSlug) {
    return null;
  }

  return {
    id: project.id,
    publicSlug,
    slug: project.slug,
    title: project.title,
    subtitle: project.subtitle,
    contentMd: project.contentMd,
    techStack: project.techStack,
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    highlightsJson: project.highlightsJson,
    updatedAt: project.updatedAt,
  };
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
      visibility: "isFeatured가 true면 visibility는 PUBLIC이어야 합니다.",
    });
  }
}

function normalizeCreateInput(input: z.infer<typeof createProjectSchema>) {
  const normalizedSlug = buildProjectSlug(input.slug ?? input.title);
  if (!PROJECT_SLUG_PATTERN.test(normalizedSlug)) {
    throw new ProjectServiceError("VALIDATION_ERROR", 422, "?щ윭洹??뺤떇???щ컮瑜댁? ?딆뒿?덈떎.", {
      slug: "?щ윭洹몃뒗 ?곷Ц ?뚮Ц?? ?レ옄, ?섏씠?덈쭔 ?ъ슜?????덉뒿?덈떎.",
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
      throw new ProjectServiceError("VALIDATION_ERROR", 422, "?щ윭洹??뺤떇???щ컮瑜댁? ?딆뒿?덈떎.", {
        slug: "?щ윭洹몃뒗 ?곷Ц ?뚮Ц?? ?レ옄, ?섏씠?덈쭔 ?ъ슜?????덉뒿?덈떎.",
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
      throw new ProjectServiceError("VALIDATION_ERROR", 422, "?꾨줈?앺듃 ?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.", extractZodFieldErrors(error));
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
      throw new ProjectServiceError("VALIDATION_ERROR", 422, "?꾨줈?앺듃 ?섏젙 ?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.", extractZodFieldErrors(error));
    }

    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ProjectServiceError("CONFLICT", 409, "?대? ?ъ슜 以묒씤 ?щ윭洹몄엯?덈떎.", {
      slug: "slug 媛믪씠 以묐났?섏뿀?듬땲??",
    });
  }

  throw error;
}

export function createProjectsService(deps: { prisma: ProjectServicePrismaClient }): ProjectsService {
  const { prisma } = deps;

  async function findPublicSettingsBySlug(publicSlug: string) {
    return prisma.portfolioSettings.findFirst({
      where: {
        publicSlug,
        isPublic: true,
      },
      select: {
        ownerId: true,
        publicSlug: true,
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
  }

  async function buildPublicPortfolioBySettings(settings: {
    ownerId: string;
    publicSlug: string;
    displayName: string | null;
    headline: string | null;
    bio: string | null;
    avatarUrl: string | null;
    links: Array<{
      label: string;
      url: string;
    }>;
  }) {
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
      publicSlug: settings.publicSlug,
      profile: {
        displayName: settings.displayName,
        headline: settings.headline,
        bio: settings.bio,
        avatarUrl: settings.avatarUrl,
        links: settings.links,
      },
      featuredProjects: featuredProjects.map((project) => ({
        ...project,
        publicSlug: settings.publicSlug,
      })),
      featuredExperiences,
    };
  }

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
        throw new ProjectServiceError("NOT_FOUND", 404, "?꾨줈?앺듃瑜?李얠쓣 ???놁뒿?덈떎.");
      }

      if (project.ownerId !== ownerId) {
        throw new ProjectServiceError("FORBIDDEN", 403, "?ㅻⅨ ?ъ슜?먯쓽 ?꾨줈?앺듃?먮뒗 ?묎렐?????놁뒿?덈떎.");
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
        throw new ProjectServiceError("NOT_FOUND", 404, "?꾨줈?앺듃瑜?李얠쓣 ???놁뒿?덈떎.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ProjectServiceError("FORBIDDEN", 403, "?ㅻⅨ ?ъ슜?먯쓽 ?꾨줈?앺듃???섏젙?????놁뒿?덈떎.");
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
        throw new ProjectServiceError("NOT_FOUND", 404, "?꾨줈?앺듃瑜?李얠쓣 ???놁뒿?덈떎.");
      }

      if (existing.ownerId !== ownerId) {
        throw new ProjectServiceError("FORBIDDEN", 403, "?ㅻⅨ ?ъ슜?먯쓽 ?꾨줈?앺듃????젣?????놁뒿?덈떎.");
      }

      await prisma.project.delete({
        where: { id: existing.id },
      });

      return { id: existing.id };
    },

    async listPublicProjects() {
      const projects = await prisma.project.findMany({
        where: {
          visibility: Visibility.PUBLIC,
          owner: {
            portfolioSettings: {
              is: {
                isPublic: true,
              },
            },
          },
        },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: publicProjectListSelect,
      });

      return projects
        .map(mapPublicProjectListItem)
        .filter(
          (project): project is NonNullable<ReturnType<typeof mapPublicProjectListItem>> =>
            project !== null,
        );
    },

    async searchPublicProjects(query) {
      const parsedQuery = parsePublicProjectsQuery(query);
      const andConditions: Prisma.ProjectWhereInput[] = [];

      if (parsedQuery.q) {
        const keyword = parsedQuery.q;
        andConditions.push({
          OR: [
            { title: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
            { contentMd: { contains: keyword, mode: "insensitive" } },
          ],
        });
      }

      if (parsedQuery.tag) {
        andConditions.push({
          techStack: { has: parsedQuery.tag },
        });
      }

      if (parsedQuery.cursor) {
        const cursorPayload = decodePublicProjectsCursor(parsedQuery.cursor);
        const cursorUpdatedAt = new Date(cursorPayload.updatedAt);
        if (Number.isNaN(cursorUpdatedAt.getTime())) {
          throw new ProjectServiceError("VALIDATION_ERROR", 422, "cursor 값이 올바르지 않습니다.", {
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

      const where: Prisma.ProjectWhereInput = {
        visibility: Visibility.PUBLIC,
        owner: {
          portfolioSettings: {
            is: parsedQuery.publicSlug
              ? {
                  isPublic: true,
                  publicSlug: parsedQuery.publicSlug,
                }
              : {
                  isPublic: true,
                },
          },
        },
      };

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      const rows = await prisma.project.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: parsedQuery.limit + 1,
        select: publicProjectListSelect,
      });

      const hasNext = rows.length > parsedQuery.limit;
      const pageRows = hasNext ? rows.slice(0, parsedQuery.limit) : rows;
      const mappedRows = pageRows
        .map((row) => {
          const mapped = mapPublicProjectListItem(row);
          if (!mapped) {
            return null;
          }
          return {
            dto: mapped,
            id: row.id,
            updatedAt: row.updatedAt,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const lastRow = mappedRows.at(-1) ?? null;
      const nextCursor =
        hasNext && lastRow
          ? encodePublicProjectsCursor({
              id: lastRow.id,
              updatedAt: lastRow.updatedAt.toISOString(),
            })
          : null;

      return {
        items: mappedRows.map((row) => row.dto),
        nextCursor,
      };
    },

    async listPublicProjectsByPublicSlug(publicSlug) {
      const settings = await findPublicSettingsBySlug(publicSlug);
      if (!settings) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 포트폴리오를 찾을 수 없습니다.");
      }

      const projects = await prisma.project.findMany({
        where: {
          ownerId: settings.ownerId,
          visibility: Visibility.PUBLIC,
        },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: publicProjectListSelect,
      });

      return projects
        .map(mapPublicProjectListItem)
        .filter(
          (project): project is NonNullable<ReturnType<typeof mapPublicProjectListItem>> =>
            project !== null,
        );
    },

    async getPublicProjectBySlug(slug) {
      const project = await prisma.project.findFirst({
        where: {
          slug,
          visibility: Visibility.PUBLIC,
          owner: {
            portfolioSettings: {
              is: {
                isPublic: true,
              },
            },
          },
        },
        select: publicProjectDetailSelect,
      });

      if (!project) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 프로젝트를 찾을 수 없습니다.");
      }

      const mapped = mapPublicProjectDetail(project);
      if (!mapped) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 프로젝트를 찾을 수 없습니다.");
      }

      return mapped;
    },

    async getPublicProjectByPublicSlugAndSlug(publicSlug, slug) {
      const project = await prisma.project.findFirst({
        where: {
          slug,
          visibility: Visibility.PUBLIC,
          owner: {
            portfolioSettings: {
              is: {
                publicSlug,
                isPublic: true,
              },
            },
          },
        },
        select: publicProjectDetailSelect,
      });

      if (!project) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 프로젝트를 찾을 수 없습니다.");
      }

      const mapped = mapPublicProjectDetail(project);
      if (!mapped) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 프로젝트를 찾을 수 없습니다.");
      }

      return mapped;
    },

    async resolvePublicProjectPathBySlug(slug) {
      const project = await prisma.project.findFirst({
        where: {
          slug,
          visibility: Visibility.PUBLIC,
          owner: {
            portfolioSettings: {
              is: {
                isPublic: true,
              },
            },
          },
        },
        select: publicProjectDetailSelect,
      });

      if (!project) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 프로젝트를 찾을 수 없습니다.");
      }

      const mapped = mapPublicProjectDetail(project);
      if (!mapped) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 프로젝트를 찾을 수 없습니다.");
      }

      return {
        publicSlug: mapped.publicSlug,
        slug: mapped.slug,
      };
    },

    async getPublicPortfolioBySlug(publicSlug) {
      const settings = await findPublicSettingsBySlug(publicSlug);
      if (!settings) {
        throw new ProjectServiceError("NOT_FOUND", 404, "공개 포트폴리오를 찾을 수 없습니다.");
      }

      return buildPublicPortfolioBySettings(settings);
    },

    async getPublicPortfolio(slug) {
      const settings = slug
        ? await findPublicSettingsBySlug(slug)
        : await prisma.portfolioSettings.findFirst({
            where: {
              isPublic: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
            select: {
              ownerId: true,
              publicSlug: true,
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
          publicSlug: null,
          profile: null,
          featuredProjects: [],
          featuredExperiences: [],
        };
      }

      return buildPublicPortfolioBySettings(settings);
    },
  };
}
