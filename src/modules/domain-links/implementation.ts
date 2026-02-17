import { DomainLinkEntityType, Prisma } from "@prisma/client";
import { z } from "zod";
import type {
  DomainLinkCreateInput,
  DomainLinkListQuery,
  DomainLinksService,
  DomainLinkServicePrismaClient,
  FieldErrors,
  OwnerDomainLinkDto,
} from "@/modules/domain-links/interface";
import { DomainLinkServiceError } from "@/modules/domain-links/interface";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

const domainLinkCreateSchema = z
  .object({
    sourceType: z.nativeEnum(DomainLinkEntityType),
    sourceId: z.string().min(1, "sourceId는 필수입니다."),
    targetType: z.nativeEnum(DomainLinkEntityType),
    targetId: z.string().min(1, "targetId는 필수입니다."),
    context: z.string().max(200, "context는 200자를 초과할 수 없습니다.").optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === value.targetType && value.sourceId === value.targetId) {
      ctx.addIssue({
        code: "custom",
        message: "source와 target은 동일할 수 없습니다.",
        path: ["targetId"],
      });
    }
  });

const domainLinkListQuerySchema = z
  .object({
    sourceType: z.nativeEnum(DomainLinkEntityType).optional(),
    sourceId: z.string().min(1).optional(),
    targetType: z.nativeEnum(DomainLinkEntityType).optional(),
    targetId: z.string().min(1).optional(),
    limit: z.number().int().positive().max(MAX_LIST_LIMIT).optional(),
  })
  .superRefine((value, ctx) => {
    const hasSourcePair = Boolean(value.sourceType || value.sourceId);
    if (hasSourcePair && !(value.sourceType && value.sourceId)) {
      ctx.addIssue({
        code: "custom",
        message: "sourceType/sourceId는 함께 전달해야 합니다.",
        path: ["sourceId"],
      });
    }

    const hasTargetPair = Boolean(value.targetType || value.targetId);
    if (hasTargetPair && !(value.targetType && value.targetId)) {
      ctx.addIssue({
        code: "custom",
        message: "targetType/targetId는 함께 전달해야 합니다.",
        path: ["targetId"],
      });
    }
  });

function buildFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "input";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }

  return fields;
}

function parseCreateInput(input: unknown): DomainLinkCreateInput {
  const parsed = domainLinkCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainLinkServiceError(
      "VALIDATION_ERROR",
      422,
      "도메인 링크 입력값이 올바르지 않습니다.",
      buildFieldErrors(parsed.error),
    );
  }

  return parsed.data;
}

function parseListQuery(query: unknown): DomainLinkListQuery {
  const normalized = (query ?? {}) as DomainLinkListQuery;
  const parsed = domainLinkListQuerySchema.safeParse(normalized);
  if (!parsed.success) {
    throw new DomainLinkServiceError(
      "VALIDATION_ERROR",
      422,
      "도메인 링크 조회 조건이 올바르지 않습니다.",
      buildFieldErrors(parsed.error),
    );
  }

  return parsed.data;
}

function mapDomainLink(record: {
  id: string;
  ownerId: string;
  sourceType: DomainLinkEntityType;
  sourceId: string;
  targetType: DomainLinkEntityType;
  targetId: string;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
}): OwnerDomainLinkDto {
  return {
    id: record.id,
    ownerId: record.ownerId,
    sourceType: record.sourceType,
    sourceId: record.sourceId,
    targetType: record.targetType,
    targetId: record.targetId,
    context: record.context,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function ensureEntityOwnedByOwner(
  prisma: DomainLinkServicePrismaClient,
  ownerId: string,
  entityType: DomainLinkEntityType,
  entityId: string,
) {
  const commonWhere = { id: entityId, ownerId };

  switch (entityType) {
    case DomainLinkEntityType.PROJECT: {
      const exists = await prisma.project.findFirst({
        where: commonWhere,
        select: { id: true },
      });
      if (!exists) {
        throw new DomainLinkServiceError("NOT_FOUND", 404, "프로젝트를 찾을 수 없습니다.");
      }
      return;
    }
    case DomainLinkEntityType.EXPERIENCE: {
      const exists = await prisma.experience.findFirst({
        where: commonWhere,
        select: { id: true },
      });
      if (!exists) {
        throw new DomainLinkServiceError("NOT_FOUND", 404, "경력을 찾을 수 없습니다.");
      }
      return;
    }
    case DomainLinkEntityType.RESUME: {
      const exists = await prisma.resume.findFirst({
        where: commonWhere,
        select: { id: true },
      });
      if (!exists) {
        throw new DomainLinkServiceError("NOT_FOUND", 404, "이력서를 찾을 수 없습니다.");
      }
      return;
    }
    case DomainLinkEntityType.NOTE: {
      const exists = await prisma.note.findFirst({
        where: commonWhere,
        select: { id: true },
      });
      if (!exists) {
        throw new DomainLinkServiceError("NOT_FOUND", 404, "노트를 찾을 수 없습니다.");
      }
      return;
    }
    case DomainLinkEntityType.BLOG_POST: {
      const exists = await prisma.blogPost.findFirst({
        where: commonWhere,
        select: { id: true },
      });
      if (!exists) {
        throw new DomainLinkServiceError("NOT_FOUND", 404, "블로그 글을 찾을 수 없습니다.");
      }
      return;
    }
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new DomainLinkServiceError("CONFLICT", 409, "동일한 도메인 링크가 이미 존재합니다.");
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2004"
  ) {
    throw new DomainLinkServiceError("VALIDATION_ERROR", 422, "유효하지 않은 도메인 링크 조합입니다.");
  }

  throw error;
}

export function createDomainLinksService(deps: { prisma: DomainLinkServicePrismaClient }): DomainLinksService {
  const { prisma } = deps;

  return {
    async listLinksForOwner(ownerId, query) {
      const parsed = parseListQuery(query);
      const limit = parsed.limit ?? DEFAULT_LIST_LIMIT;

      const items = await prisma.domainLink.findMany({
        where: {
          ownerId,
          ...(parsed.sourceType && parsed.sourceId
            ? {
                sourceType: parsed.sourceType,
                sourceId: parsed.sourceId,
              }
            : {}),
          ...(parsed.targetType && parsed.targetId
            ? {
                targetType: parsed.targetType,
                targetId: parsed.targetId,
              }
            : {}),
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit,
      });

      return items.map(mapDomainLink);
    },

    async createLinkForOwner(ownerId, input) {
      const parsed = parseCreateInput(input);

      await ensureEntityOwnedByOwner(prisma, ownerId, parsed.sourceType, parsed.sourceId);
      await ensureEntityOwnedByOwner(prisma, ownerId, parsed.targetType, parsed.targetId);

      try {
        const created = await prisma.domainLink.create({
          data: {
            ownerId,
            sourceType: parsed.sourceType,
            sourceId: parsed.sourceId,
            targetType: parsed.targetType,
            targetId: parsed.targetId,
            context: parsed.context ?? null,
          },
        });
        return mapDomainLink(created);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteLinkForOwner(ownerId, linkId) {
      const link = await prisma.domainLink.findUnique({
        where: { id: linkId },
        select: { id: true, ownerId: true },
      });

      if (!link) {
        throw new DomainLinkServiceError("NOT_FOUND", 404, "도메인 링크를 찾을 수 없습니다.");
      }

      if (link.ownerId !== ownerId) {
        throw new DomainLinkServiceError("FORBIDDEN", 403, "다른 사용자의 도메인 링크는 삭제할 수 없습니다.");
      }

      await prisma.domainLink.delete({
        where: { id: linkId },
        select: { id: true },
      });

      return { id: linkId };
    },
  };
}

