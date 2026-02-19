import { CompanyTargetStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import type {
  CompanyTargetsCursorPayload,
  CompanyTargetsListQuery,
  CompanyTargetsListResult,
  CompanyTargetsService,
  CompanyTargetsServicePrismaClient,
  CompanyTargetCreateInput,
  CompanyTargetUpdateInput,
  OwnerCompanyTargetDto,
} from "@/modules/company-targets/interface";
import { CompanyTargetServiceError } from "@/modules/company-targets/interface";

const MIN_TEXT_LENGTH = 1;
const MAX_TEXT_LENGTH = 120;
const MAX_Q_LENGTH = 200;
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
const MIN_PRIORITY = 0;
const MAX_PRIORITY = 9999;
const EMPTY_LENGTH = 0;

const createCompanyTargetSchema = z.object({
  company: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "회사명은 비어 있을 수 없습니다.")
    .max(MAX_TEXT_LENGTH, "회사명은 120자 이하로 입력해주세요."),
  role: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "직무는 비어 있을 수 없습니다.")
    .max(MAX_TEXT_LENGTH, "직무는 120자 이하로 입력해주세요."),
  status: z.nativeEnum(CompanyTargetStatus).optional().default(CompanyTargetStatus.INTERESTED),
  priority: z
    .number()
    .int("우선순위는 정수여야 합니다.")
    .min(MIN_PRIORITY, "우선순위는 0 이상이어야 합니다.")
    .max(MAX_PRIORITY, "우선순위는 9999 이하여야 합니다.")
    .optional()
    .default(0),
  summary: z.string().trim().max(5000, "요약은 5000자 이하로 입력해주세요.").optional().nullable(),
  analysisMd: z.string().trim().max(100000, "분석 내용은 100000자 이하로 입력해주세요.").optional().nullable(),
  linksJson: z.unknown().optional().nullable(),
  tags: z.array(z.string().trim().min(MIN_TEXT_LENGTH, "태그 값은 비어 있을 수 없습니다.")).optional().default([]),
});

const updateCompanyTargetSchema = z
  .object({
    company: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "회사명은 비어 있을 수 없습니다.")
      .max(MAX_TEXT_LENGTH, "회사명은 120자 이하로 입력해주세요.")
      .optional(),
    role: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "직무는 비어 있을 수 없습니다.")
      .max(MAX_TEXT_LENGTH, "직무는 120자 이하로 입력해주세요.")
      .optional(),
    status: z.nativeEnum(CompanyTargetStatus).optional(),
    priority: z
      .number()
      .int("우선순위는 정수여야 합니다.")
      .min(MIN_PRIORITY, "우선순위는 0 이상이어야 합니다.")
      .max(MAX_PRIORITY, "우선순위는 9999 이하여야 합니다.")
      .optional(),
    summary: z.string().trim().max(5000, "요약은 5000자 이하로 입력해주세요.").optional().nullable(),
    analysisMd: z.string().trim().max(100000, "분석 내용은 100000자 이하로 입력해주세요.").optional().nullable(),
    linksJson: z.unknown().optional().nullable(),
    tags: z.array(z.string().trim().min(MIN_TEXT_LENGTH, "태그 값은 비어 있을 수 없습니다.")).optional(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const listQuerySchema = z.object({
  status: z.nativeEnum(CompanyTargetStatus).optional(),
  q: z.string().trim().max(MAX_Q_LENGTH, "검색어는 200자 이하로 입력해주세요.").optional(),
  limit: z.number().int().positive().max(MAX_LIST_LIMIT).optional(),
  cursor: z.string().trim().min(1).optional(),
});

const ownerCompanyTargetSelect = {
  id: true,
  ownerId: true,
  company: true,
  role: true,
  status: true,
  priority: true,
  summary: true,
  analysisMd: true,
  linksJson: true,
  tags: true,
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

function encodeCursor(payload: CompanyTargetsCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): CompanyTargetsCursorPayload {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as CompanyTargetsCursorPayload;
    if (!parsed?.updatedAt || !parsed?.id) {
      throw new Error("INVALID_CURSOR");
    }
    return parsed;
  } catch {
    throw new CompanyTargetServiceError("VALIDATION_ERROR", 422, "cursor 값이 올바르지 않습니다.", {
      cursor: "cursor 값을 확인해주세요.",
    });
  }
}

function parseCreateInput(input: unknown): CompanyTargetCreateInput {
  const parsed = createCompanyTargetSchema.safeParse(input);
  if (!parsed.success) {
    throw new CompanyTargetServiceError(
      "VALIDATION_ERROR",
      422,
      "기업 분석 카드 입력값이 올바르지 않습니다.",
      extractZodFieldErrors(parsed.error),
    );
  }

  return {
    company: parsed.data.company,
    role: parsed.data.role,
    status: parsed.data.status,
    priority: parsed.data.priority,
    summary: toNullableString(parsed.data.summary),
    analysisMd: toNullableString(parsed.data.analysisMd),
    linksJson: (parsed.data.linksJson as Prisma.InputJsonValue | null | undefined) ?? null,
    tags: normalizeTags(parsed.data.tags) ?? [],
  };
}

function parseUpdateInput(input: unknown): CompanyTargetUpdateInput {
  const parsed = updateCompanyTargetSchema.safeParse(input);
  if (!parsed.success) {
    throw new CompanyTargetServiceError(
      "VALIDATION_ERROR",
      422,
      "기업 분석 카드 입력값이 올바르지 않습니다.",
      extractZodFieldErrors(parsed.error),
    );
  }

  return {
    ...(parsed.data.company !== undefined ? { company: parsed.data.company } : {}),
    ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
    ...(parsed.data.summary !== undefined ? { summary: toNullableString(parsed.data.summary) } : {}),
    ...(parsed.data.analysisMd !== undefined
      ? { analysisMd: toNullableString(parsed.data.analysisMd) }
      : {}),
    ...(parsed.data.linksJson !== undefined
      ? { linksJson: (parsed.data.linksJson as Prisma.InputJsonValue | null | undefined) ?? null }
      : {}),
    ...(parsed.data.tags !== undefined ? { tags: normalizeTags(parsed.data.tags) ?? [] } : {}),
  };
}

function parseListQuery(query: unknown): CompanyTargetsListQuery {
  const normalized = (query ?? {}) as CompanyTargetsListQuery;
  const parsed = listQuerySchema.safeParse(normalized);
  if (!parsed.success) {
    throw new CompanyTargetServiceError(
      "VALIDATION_ERROR",
      422,
      "기업 분석 카드 조회 조건이 올바르지 않습니다.",
      extractZodFieldErrors(parsed.error),
    );
  }

  return parsed.data;
}

function mapOwnerDto(
  target: Prisma.CompanyTargetGetPayload<{ select: typeof ownerCompanyTargetSelect }>,
): OwnerCompanyTargetDto {
  return {
    id: target.id,
    company: target.company,
    role: target.role,
    status: target.status,
    priority: target.priority,
    summary: target.summary,
    analysisMd: target.analysisMd,
    linksJson: target.linksJson,
    tags: target.tags,
    updatedAt: target.updatedAt,
  };
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new CompanyTargetServiceError("CONFLICT", 409, "이미 존재하는 회사/직무 카드입니다.", {
      company: "회사/직무 조합이 중복되었습니다.",
      role: "회사/직무 조합이 중복되었습니다.",
    });
  }

  throw error;
}

export function createCompanyTargetsService(deps: {
  prisma: CompanyTargetsServicePrismaClient;
}): CompanyTargetsService {
  const { prisma } = deps;

  return {
    async listTargetsForOwner(ownerId, query): Promise<CompanyTargetsListResult> {
      const parsed = parseListQuery(query);
      const limit = parsed.limit ?? DEFAULT_LIST_LIMIT;

      const andConditions: Prisma.CompanyTargetWhereInput[] = [];
      if (parsed.q) {
        const keyword = parsed.q;
        andConditions.push({
          OR: [
            { company: { contains: keyword, mode: "insensitive" } },
            { role: { contains: keyword, mode: "insensitive" } },
            { summary: { contains: keyword, mode: "insensitive" } },
            { analysisMd: { contains: keyword, mode: "insensitive" } },
          ],
        });
      }

      if (parsed.cursor) {
        const cursorPayload = decodeCursor(parsed.cursor);
        const cursorUpdatedAt = new Date(cursorPayload.updatedAt);
        if (Number.isNaN(cursorUpdatedAt.getTime())) {
          throw new CompanyTargetServiceError("VALIDATION_ERROR", 422, "cursor 값이 올바르지 않습니다.", {
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

      const items = await prisma.companyTarget.findMany({
        where: {
          ownerId,
          ...(parsed.status ? { status: parsed.status } : {}),
          ...(andConditions.length > 0 ? { AND: andConditions } : {}),
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit,
        select: ownerCompanyTargetSelect,
      });

      const nextCursor =
        items.length === limit
          ? encodeCursor({ updatedAt: items[items.length - 1]!.updatedAt.toISOString(), id: items[items.length - 1]!.id })
          : null;

      return {
        items: items.map((target) => mapOwnerDto(target)),
        nextCursor,
      };
    },

    async createTarget(ownerId, input) {
      const parsed = parseCreateInput(input);

      try {
        const created = await prisma.companyTarget.create({
          data: {
            ownerId,
            company: parsed.company,
            role: parsed.role,
            status: parsed.status ?? CompanyTargetStatus.INTERESTED,
            priority: parsed.priority ?? 0,
            summary: parsed.summary ?? null,
            analysisMd: parsed.analysisMd ?? null,
            linksJson: toNullableJsonInput(parsed.linksJson),
            tags: parsed.tags ?? [],
          },
          select: ownerCompanyTargetSelect,
        });

        return mapOwnerDto(created);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async getTargetForOwner(ownerId, targetId) {
      const target = await prisma.companyTarget.findUnique({
        where: { id: targetId },
        select: ownerCompanyTargetSelect,
      });

      if (!target) {
        throw new CompanyTargetServiceError("NOT_FOUND", 404, "기업 분석 카드를 찾을 수 없습니다.");
      }

      if (target.ownerId !== ownerId) {
        throw new CompanyTargetServiceError("FORBIDDEN", 403, "다른 사용자의 기업 분석 카드는 조회할 수 없습니다.");
      }

      return mapOwnerDto(target);
    },

    async updateTarget(ownerId, targetId, input) {
      const existing = await prisma.companyTarget.findUnique({
        where: { id: targetId },
        select: { id: true, ownerId: true, status: true },
      });

      if (!existing) {
        throw new CompanyTargetServiceError("NOT_FOUND", 404, "기업 분석 카드를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new CompanyTargetServiceError("FORBIDDEN", 403, "다른 사용자의 기업 분석 카드는 수정할 수 없습니다.");
      }

      const parsed = parseUpdateInput(input);

      try {
        const updated = await prisma.companyTarget.update({
          where: { id: existing.id },
          data: {
            ...(parsed.company !== undefined ? { company: parsed.company } : {}),
            ...(parsed.role !== undefined ? { role: parsed.role } : {}),
            ...(parsed.status !== undefined ? { status: parsed.status } : {}),
            ...(parsed.priority !== undefined ? { priority: parsed.priority } : {}),
            ...(parsed.summary !== undefined ? { summary: parsed.summary } : {}),
            ...(parsed.analysisMd !== undefined ? { analysisMd: parsed.analysisMd } : {}),
            ...(parsed.linksJson !== undefined ? { linksJson: toNullableJsonInput(parsed.linksJson) } : {}),
            ...(parsed.tags !== undefined ? { tags: parsed.tags } : {}),
          },
          select: ownerCompanyTargetSelect,
        });

        return mapOwnerDto(updated);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async deleteTarget(ownerId, targetId) {
      const existing = await prisma.companyTarget.findUnique({
        where: { id: targetId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new CompanyTargetServiceError("NOT_FOUND", 404, "기업 분석 카드를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new CompanyTargetServiceError("FORBIDDEN", 403, "다른 사용자의 기업 분석 카드는 삭제할 수 없습니다.");
      }

      await prisma.companyTarget.delete({ where: { id: existing.id } });
      return { id: existing.id };
    },
  };
}
