import { PostStatus, Prisma, Visibility } from "@prisma/client";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { BlogPostCreateInput, BlogService, BlogServicePrismaClient } from "@/modules/blog/interface";
import { createBlogExportArtifact, type BlogExportFormat } from "@/modules/blog/export";
import { runBlogLint } from "@/modules/blog/lint";
import { BlogServiceError } from "@/modules/blog/interface";

const MIN_TEXT_LENGTH = 1;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 100000;
const MAX_SUMMARY_LENGTH = 10000;
const MAX_TAG_COUNT = 50;
const MAX_TAG_LENGTH = 50;
const EMPTY_LENGTH = 0;

type NormalizedBlogPostUpdateInput = {
  status?: PostStatus;
  visibility?: Visibility;
  title?: string;
  contentMd?: string;
  summary?: string | null;
  tags?: string[];
};

const createBlogPostSchema = z.object({
  status: z.nativeEnum(PostStatus).optional().default(PostStatus.DRAFT),
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
    .max(MAX_CONTENT_LENGTH, "본문은 100000자 이하로 입력해주세요."),
  summary: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 10000자 이하로 입력해주세요.").optional().nullable(),
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

const updateBlogPostSchema = z
  .object({
    status: z.nativeEnum(PostStatus).optional(),
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
      .max(MAX_CONTENT_LENGTH, "본문은 100000자 이하로 입력해주세요.")
      .optional(),
    summary: z.string().trim().max(MAX_SUMMARY_LENGTH, "요약은 10000자 이하로 입력해주세요.").optional().nullable(),
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

const blogPostListSelect = {
  id: true,
  status: true,
  visibility: true,
  title: true,
  summary: true,
  tags: true,
  lastLintedAt: true,
  updatedAt: true,
} as const;

const blogPostDetailSelect = {
  id: true,
  ownerId: true,
  status: true,
  visibility: true,
  title: true,
  contentMd: true,
  summary: true,
  tags: true,
  lintReportJson: true,
  lastLintedAt: true,
  updatedAt: true,
} as const;

const blogExportArtifactListSelect = {
  id: true,
  blogPostId: true,
  format: true,
  fileName: true,
  contentType: true,
  byteSize: true,
  snapshotHash: true,
  createdAt: true,
} as const;

const blogExportArtifactDownloadSelect = {
  ...blogExportArtifactListSelect,
  payload: true,
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

function buildExportSnapshotHash(input: {
  format: BlogExportFormat;
  title: string;
  contentMd: string;
}): string {
  const payload = JSON.stringify({
    format: input.format,
    title: input.title,
    contentMd: input.contentMd,
  });
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

function toBlogExportFormat(value: string): BlogExportFormat {
  if (value === "html" || value === "md" || value === "zip") {
    return value;
  }
  throw new BlogServiceError("NOT_FOUND", 404, "지원하지 않는 export 형식입니다.");
}

function mapBlogExportArtifact(
  artifact: Prisma.BlogExportArtifactGetPayload<{ select: typeof blogExportArtifactListSelect }>,
) {
  return {
    id: artifact.id,
    blogPostId: artifact.blogPostId,
    format: toBlogExportFormat(artifact.format),
    fileName: artifact.fileName,
    contentType: artifact.contentType,
    byteSize: artifact.byteSize,
    snapshotHash: artifact.snapshotHash,
    createdAt: artifact.createdAt,
  };
}

function mapBlogExportArtifactDownload(
  artifact: Prisma.BlogExportArtifactGetPayload<{ select: typeof blogExportArtifactDownloadSelect }>,
) {
  return {
    ...mapBlogExportArtifact(artifact),
    payload: artifact.payload,
  };
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

function normalizeCreateInput(input: z.infer<typeof createBlogPostSchema>): BlogPostCreateInput {
  return {
    status: input.status,
    visibility: input.visibility,
    title: input.title,
    contentMd: input.contentMd,
    summary: toNullableString(input.summary),
    tags: normalizeTags(input.tags) ?? [],
  };
}

function normalizeUpdateInput(
  input: z.infer<typeof updateBlogPostSchema>,
): NormalizedBlogPostUpdateInput {
  const normalized: NormalizedBlogPostUpdateInput = {};

  if (input.status !== undefined) {
    normalized.status = input.status;
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

export function parseBlogPostCreateInput(input: unknown): BlogPostCreateInput {
  try {
    const parsed = createBlogPostSchema.parse(input);
    return normalizeCreateInput(parsed);
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new BlogServiceError(
        "VALIDATION_ERROR",
        422,
        "블로그 글 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseBlogPostUpdateInput(input: unknown): NormalizedBlogPostUpdateInput {
  try {
    const parsed = updateBlogPostSchema.parse(input);
    return normalizeUpdateInput(parsed);
  } catch (error) {
    if (error instanceof BlogServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new BlogServiceError(
        "VALIDATION_ERROR",
        422,
        "블로그 글 수정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new BlogServiceError("CONFLICT", 409, "이미 존재하는 데이터입니다.");
    }
  }

  throw error;
}

async function ensurePostOwner(prisma: BlogServicePrismaClient, ownerId: string, postId: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      ownerId: true,
      deletedAt: true,
    },
  });

  if (!post || post.deletedAt !== null) {
    throw new BlogServiceError("NOT_FOUND", 404, "블로그 글을 찾을 수 없습니다.");
  }

  if (post.ownerId !== ownerId) {
    throw new BlogServiceError("FORBIDDEN", 403, "다른 사용자의 블로그 글에는 접근할 수 없습니다.");
  }
}

async function fetchPostById(prisma: BlogServicePrismaClient, postId: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: blogPostDetailSelect,
  });

  if (!post || post.ownerId.length === EMPTY_LENGTH) {
    throw new BlogServiceError("NOT_FOUND", 404, "블로그 글을 찾을 수 없습니다.");
  }

  return post;
}

async function fetchExportByIdForOwner(
  prisma: BlogServicePrismaClient,
  ownerId: string,
  postId: string,
  exportId: string,
) {
  const artifact = await prisma.blogExportArtifact.findFirst({
    where: {
      id: exportId,
      ownerId,
      blogPostId: postId,
    },
    select: blogExportArtifactDownloadSelect,
  });

  if (!artifact) {
    throw new BlogServiceError("NOT_FOUND", 404, "Blog export 이력을 찾을 수 없습니다.");
  }

  return artifact;
}

export function createBlogService(deps: { prisma: BlogServicePrismaClient }): BlogService {
  const { prisma } = deps;

  return {
    async listPostsForOwner(ownerId) {
      return prisma.blogPost.findMany({
        where: {
          ownerId,
          deletedAt: null,
        },
        orderBy: [{ updatedAt: "desc" }],
        select: blogPostListSelect,
      });
    },

    async getPostForOwner(ownerId, postId) {
      await ensurePostOwner(prisma, ownerId, postId);
      return fetchPostById(prisma, postId);
    },

    async createPost(ownerId, input) {
      const parsed = parseBlogPostCreateInput(input);

      try {
        const created = await prisma.blogPost.create({
          data: {
            ownerId,
            status: parsed.status ?? PostStatus.DRAFT,
            visibility: parsed.visibility ?? Visibility.PRIVATE,
            title: parsed.title,
            contentMd: parsed.contentMd,
            summary: parsed.summary ?? null,
            tags: parsed.tags ?? [],
          },
          select: { id: true },
        });

        return fetchPostById(prisma, created.id);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async updatePost(ownerId, postId, input) {
      await ensurePostOwner(prisma, ownerId, postId);
      const parsed = parseBlogPostUpdateInput(input);

      try {
        await prisma.blogPost.update({
          where: { id: postId },
          data: parsed,
          select: { id: true },
        });

        return fetchPostById(prisma, postId);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deletePost(ownerId, postId) {
      await ensurePostOwner(prisma, ownerId, postId);

      await prisma.blogPost.update({
        where: { id: postId },
        data: {
          deletedAt: new Date(),
        },
        select: { id: true },
      });

      return { id: postId };
    },

    async runLintForPost(ownerId, postId) {
      await ensurePostOwner(prisma, ownerId, postId);
      const post = await fetchPostById(prisma, postId);
      const lintResult = runBlogLint(post.contentMd);

      await prisma.blogPost.update({
        where: { id: postId },
        data: {
          lintReportJson: lintResult as Prisma.InputJsonValue,
          lastLintedAt: new Date(),
        },
        select: { id: true },
      });

      return fetchPostById(prisma, postId);
    },

    async listExportsForPost(ownerId, postId) {
      await ensurePostOwner(prisma, ownerId, postId);
      const artifacts = await prisma.blogExportArtifact.findMany({
        where: {
          ownerId,
          blogPostId: postId,
        },
        orderBy: [{ createdAt: "desc" }],
        select: blogExportArtifactListSelect,
      });

      return artifacts.map(mapBlogExportArtifact);
    },

    async createExportForPost(ownerId, postId, format) {
      await ensurePostOwner(prisma, ownerId, postId);
      const post = await fetchPostById(prisma, postId);
      const generated = createBlogExportArtifact({
        title: post.title,
        contentMd: post.contentMd,
        format,
      });
      const snapshotHash = buildExportSnapshotHash({
        format,
        title: post.title,
        contentMd: post.contentMd,
      });

      const created = await prisma.blogExportArtifact.create({
        data: {
          ownerId,
          blogPostId: postId,
          format,
          fileName: generated.fileName,
          contentType: generated.contentType,
          byteSize: generated.buffer.length,
          snapshotHash,
          payload: new Uint8Array(generated.buffer),
        },
        select: blogExportArtifactDownloadSelect,
      });

      return mapBlogExportArtifactDownload(created);
    },

    async getExportForPost(ownerId, postId, exportId) {
      await ensurePostOwner(prisma, ownerId, postId);
      const artifact = await fetchExportByIdForOwner(prisma, ownerId, postId, exportId);
      return mapBlogExportArtifactDownload(artifact);
    },
  };
}
