import { TestimonialStatus } from "@prisma/client";
import { z } from "zod";
import type {
  TestimonialDto,
  PublicTestimonialDto,
  ShareTokenInfoDto,
  TestimonialService,
  TestimonialServicePrismaClient,
} from "@/modules/testimonials/interface";
import { TestimonialServiceError } from "@/modules/testimonials/interface";

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const SHARE_TOKEN_LENGTH = 16;
const MAX_CONTENT_LENGTH = 5000;
const MAX_NAME_LENGTH = 100;
const MAX_TITLE_LENGTH = 200;
const MAX_COMPANY_LENGTH = 200;
const MAX_EMAIL_LENGTH = 320;
const MAX_RELATIONSHIP_LENGTH = 100;

const RELATIONSHIP_PRESETS = ["동료", "상사", "부하", "멘토", "멘티", "클라이언트", "협력사", "기타"] as const;
export { RELATIONSHIP_PRESETS };

// ─────────────────────────────────────────────
// Zod 스키마
// ─────────────────────────────────────────────

const createSchema = z.object({
  authorName: z.string().trim().max(MAX_NAME_LENGTH).optional().nullable(),
  authorEmail: z.string().trim().email("올바른 이메일 형식이 아닙니다.").max(MAX_EMAIL_LENGTH).optional().nullable(),
  relationship: z.string().trim().max(MAX_RELATIONSHIP_LENGTH).optional().nullable(),
});

const updateSchema = z.object({
  status: z.nativeEnum(TestimonialStatus).optional(),
  isPublic: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const submitSchema = z.object({
  authorName: z.string().trim().min(1, "이름을 입력해주세요.").max(MAX_NAME_LENGTH),
  authorTitle: z.string().trim().max(MAX_TITLE_LENGTH).optional().nullable(),
  authorCompany: z.string().trim().max(MAX_COMPANY_LENGTH).optional().nullable(),
  authorEmail: z.string().trim().email("올바른 이메일 형식이 아닙니다.").max(MAX_EMAIL_LENGTH).optional().nullable(),
  relationship: z.string().trim().max(MAX_RELATIONSHIP_LENGTH).optional().nullable(),
  content: z.string().trim().min(10, "추천서 내용은 10자 이상 입력해주세요.").max(MAX_CONTENT_LENGTH, `추천서 내용은 ${MAX_CONTENT_LENGTH}자 이하로 입력해주세요.`),
  rating: z.number().int().min(1).max(5).optional().nullable(),
});

export { createSchema, updateSchema, submitSchema };

// ─────────────────────────────────────────────
// Prisma Select
// ─────────────────────────────────────────────

const testimonialSelect = {
  id: true,
  authorName: true,
  authorTitle: true,
  authorCompany: true,
  authorEmail: true,
  relationship: true,
  content: true,
  rating: true,
  status: true,
  shareToken: true,
  isPublic: true,
  displayOrder: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const publicTestimonialSelect = {
  id: true,
  authorName: true,
  authorTitle: true,
  authorCompany: true,
  relationship: true,
  content: true,
  rating: true,
} as const;

// ─────────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────────

function generateShareToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const bytes = new Uint8Array(SHARE_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < SHARE_TOKEN_LENGTH; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export { generateShareToken };

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

// ─────────────────────────────────────────────
// DTO 매핑
// ─────────────────────────────────────────────

type TestimonialRow = {
  id: string;
  authorName: string | null;
  authorTitle: string | null;
  authorCompany: string | null;
  authorEmail: string | null;
  relationship: string | null;
  content: string | null;
  rating: number | null;
  status: TestimonialStatus;
  shareToken: string;
  isPublic: boolean;
  displayOrder: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapTestimonialDto(row: TestimonialRow): TestimonialDto {
  return {
    id: row.id,
    authorName: row.authorName,
    authorTitle: row.authorTitle,
    authorCompany: row.authorCompany,
    authorEmail: row.authorEmail,
    relationship: row.relationship,
    content: row.content,
    rating: row.rating,
    status: row.status,
    shareToken: row.shareToken,
    isPublic: row.isPublic,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─────────────────────────────────────────────
// 서비스 생성
// ─────────────────────────────────────────────

export function createTestimonialService(deps: {
  prisma: TestimonialServicePrismaClient;
}): TestimonialService {
  const { prisma } = deps;

  return {
    async listForOwner(ownerId): Promise<TestimonialDto[]> {
      const rows = await prisma.testimonial.findMany({
        where: { ownerId },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        select: testimonialSelect,
      });
      return rows.map(mapTestimonialDto);
    },

    async createRequest(ownerId, input): Promise<TestimonialDto> {
      const parsed = createSchema.safeParse(input);
      if (!parsed.success) {
        throw new TestimonialServiceError(
          "VALIDATION_ERROR",
          422,
          "입력값이 올바르지 않습니다.",
          extractZodFieldErrors(parsed.error),
        );
      }

      const token = generateShareToken();
      const row = await prisma.testimonial.create({
        data: {
          ownerId,
          shareToken: token,
          authorName: parsed.data.authorName ?? null,
          authorEmail: parsed.data.authorEmail ?? null,
          relationship: parsed.data.relationship ?? null,
        },
        select: testimonialSelect,
      });

      return mapTestimonialDto(row);
    },

    async updateForOwner(ownerId, testimonialId, input): Promise<TestimonialDto> {
      const parsed = updateSchema.safeParse(input);
      if (!parsed.success) {
        throw new TestimonialServiceError(
          "VALIDATION_ERROR",
          422,
          "입력값이 올바르지 않습니다.",
          extractZodFieldErrors(parsed.error),
        );
      }

      const existing = await prisma.testimonial.findUnique({
        where: { id: testimonialId },
        select: { id: true, ownerId: true, status: true },
      });

      if (!existing) {
        throw new TestimonialServiceError("NOT_FOUND", 404, "추천서를 찾을 수 없습니다.");
      }
      if (existing.ownerId !== ownerId) {
        throw new TestimonialServiceError("FORBIDDEN", 403, "권한이 없습니다.");
      }

      // isPublic은 APPROVED 상태에서만 가능
      if (parsed.data.isPublic === true && existing.status !== TestimonialStatus.APPROVED && parsed.data.status !== TestimonialStatus.APPROVED) {
        throw new TestimonialServiceError(
          "VALIDATION_ERROR",
          422,
          "승인된 추천서만 공개 설정할 수 있습니다.",
        );
      }

      const row = await prisma.testimonial.update({
        where: { id: testimonialId },
        data: {
          ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
          ...(parsed.data.isPublic !== undefined ? { isPublic: parsed.data.isPublic } : {}),
          ...(parsed.data.displayOrder !== undefined ? { displayOrder: parsed.data.displayOrder } : {}),
          // 승인 시 isPublic 자동 true
          ...(parsed.data.status === TestimonialStatus.APPROVED ? { isPublic: parsed.data.isPublic ?? true } : {}),
          // 거절 시 isPublic 자동 false
          ...(parsed.data.status === TestimonialStatus.REJECTED ? { isPublic: false } : {}),
        },
        select: testimonialSelect,
      });

      return mapTestimonialDto(row);
    },

    async deleteForOwner(ownerId, testimonialId): Promise<void> {
      const existing = await prisma.testimonial.findUnique({
        where: { id: testimonialId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new TestimonialServiceError("NOT_FOUND", 404, "추천서를 찾을 수 없습니다.");
      }
      if (existing.ownerId !== ownerId) {
        throw new TestimonialServiceError("FORBIDDEN", 403, "권한이 없습니다.");
      }

      await prisma.testimonial.delete({ where: { id: testimonialId } });
    },

    async getByShareToken(token): Promise<ShareTokenInfoDto> {
      const row = await prisma.testimonial.findUnique({
        where: { shareToken: token },
        select: {
          status: true,
          authorName: true,
          owner: {
            select: {
              portfolioSettings: {
                select: { displayName: true, avatarUrl: true },
              },
            },
          },
        },
      });

      if (!row) {
        throw new TestimonialServiceError("NOT_FOUND", 404, "유효하지 않은 링크입니다.");
      }

      return {
        ownerDisplayName: row.owner?.portfolioSettings?.displayName ?? null,
        ownerAvatarUrl: row.owner?.portfolioSettings?.avatarUrl ?? null,
        status: row.status,
        authorName: row.authorName,
      };
    },

    async submitByShareToken(token, input): Promise<void> {
      const parsed = submitSchema.safeParse(input);
      if (!parsed.success) {
        throw new TestimonialServiceError(
          "VALIDATION_ERROR",
          422,
          "입력값이 올바르지 않습니다.",
          extractZodFieldErrors(parsed.error),
        );
      }

      const existing = await prisma.testimonial.findUnique({
        where: { shareToken: token },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new TestimonialServiceError("NOT_FOUND", 404, "유효하지 않은 링크입니다.");
      }

      if (existing.status !== TestimonialStatus.PENDING) {
        throw new TestimonialServiceError(
          "ALREADY_SUBMITTED",
          409,
          "이미 작성된 추천서입니다.",
        );
      }

      await prisma.testimonial.update({
        where: { id: existing.id },
        data: {
          authorName: parsed.data.authorName,
          authorTitle: parsed.data.authorTitle ?? null,
          authorCompany: parsed.data.authorCompany ?? null,
          authorEmail: parsed.data.authorEmail ?? null,
          relationship: parsed.data.relationship ?? null,
          content: parsed.data.content,
          rating: parsed.data.rating ?? null,
          status: TestimonialStatus.SUBMITTED,
        },
      });
    },

    async listPublicBySlug(publicSlug): Promise<PublicTestimonialDto[]> {
      const settings = await prisma.portfolioSettings.findUnique({
        where: { publicSlug },
        select: { ownerId: true, isPublic: true },
      });

      if (!settings || !settings.isPublic) {
        return [];
      }

      const rows = await prisma.testimonial.findMany({
        where: {
          ownerId: settings.ownerId,
          status: TestimonialStatus.APPROVED,
          isPublic: true,
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        select: publicTestimonialSelect,
      });

      return rows
        .filter((r) => r.authorName && r.content)
        .map((r) => ({
          id: r.id,
          authorName: r.authorName!,
          authorTitle: r.authorTitle,
          authorCompany: r.authorCompany,
          relationship: r.relationship,
          content: r.content!,
          rating: r.rating,
        }));
    },
  };
}
