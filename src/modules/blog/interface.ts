import type { PostStatus, Prisma, Visibility } from "@prisma/client";
import type { BlogExportFormat } from "@/modules/blog/export";

export type BlogPostCreateInput = {
  status?: PostStatus;
  visibility?: Visibility;
  title: string;
  contentMd: string;
  summary?: string | null;
  tags?: string[];
};

export type BlogPostUpdateInput = Partial<BlogPostCreateInput>;

export type OwnerBlogPostListItemDto = {
  id: string;
  status: PostStatus;
  visibility: Visibility;
  title: string;
  summary: string | null;
  tags: string[];
  lastLintedAt: Date | null;
  updatedAt: Date;
};

export type OwnerBlogPostDetailDto = {
  id: string;
  ownerId: string;
  status: PostStatus;
  visibility: Visibility;
  title: string;
  contentMd: string;
  summary: string | null;
  tags: string[];
  lintReportJson: unknown;
  lastLintedAt: Date | null;
  updatedAt: Date;
};

export type OwnerBlogExportArtifactDto = {
  id: string;
  blogPostId: string;
  format: BlogExportFormat;
  fileName: string;
  contentType: string;
  byteSize: number;
  snapshotHash: string;
  createdAt: Date;
};

export type OwnerBlogExportDownloadDto = OwnerBlogExportArtifactDto & {
  payload: Uint8Array;
};

export type BlogLintSeverity = "WARNING";

export type BlogLintIssue = {
  ruleId: string;
  severity: BlogLintSeverity;
  message: string;
  line: number;
  excerpt: string;
};

export type BlogLintResult = {
  version: string;
  createdAt: string;
  issues: BlogLintIssue[];
  summary: {
    total: number;
    warning: number;
  };
};

export type BlogFieldErrors = Record<string, string>;

export type BlogServiceErrorCode = "VALIDATION_ERROR" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN";

export class BlogServiceError extends Error {
  readonly code: BlogServiceErrorCode;
  readonly status: number;
  readonly fields?: BlogFieldErrors;

  constructor(code: BlogServiceErrorCode, status: number, message: string, fields?: BlogFieldErrors) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isBlogServiceError(error: unknown): error is BlogServiceError {
  return error instanceof BlogServiceError;
}

export type BlogServicePrismaClient = Pick<Prisma.TransactionClient, "blogPost" | "blogExportArtifact">;

export interface BlogService {
  listPostsForOwner(ownerId: string): Promise<OwnerBlogPostListItemDto[]>;
  getPostForOwner(ownerId: string, postId: string): Promise<OwnerBlogPostDetailDto>;
  createPost(ownerId: string, input: unknown): Promise<OwnerBlogPostDetailDto>;
  updatePost(ownerId: string, postId: string, input: unknown): Promise<OwnerBlogPostDetailDto>;
  deletePost(ownerId: string, postId: string): Promise<{ id: string }>;
  runLintForPost(ownerId: string, postId: string): Promise<OwnerBlogPostDetailDto>;
  listExportsForPost(ownerId: string, postId: string): Promise<OwnerBlogExportArtifactDto[]>;
  createExportForPost(
    ownerId: string,
    postId: string,
    format: BlogExportFormat,
  ): Promise<OwnerBlogExportDownloadDto>;
  getExportForPost(
    ownerId: string,
    postId: string,
    exportId: string,
  ): Promise<OwnerBlogExportDownloadDto>;
}
