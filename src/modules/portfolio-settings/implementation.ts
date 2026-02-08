import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  MAX_PORTFOLIO_PUBLIC_SLUG_LENGTH,
  PORTFOLIO_PUBLIC_SLUG_PATTERN,
  type PortfolioSettingsService,
  type PortfolioSettingsServicePrismaClient,
  PortfolioSettingsServiceError,
  type PortfolioSettingsUpsertInput,
} from "@/modules/portfolio-settings/interface";

const MIN_TEXT_LENGTH = 1;
const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_HEADLINE_LENGTH = 200;
const MAX_BIO_LENGTH = 5000;
const MAX_LINK_LABEL_LENGTH = 80;
const MAX_LINK_COUNT = 20;
const MIN_ORDER = 0;
const MAX_ORDER = 9999;
const EMPTY_LENGTH = 0;

type NormalizedPortfolioSettingsUpsertInput = {
  publicSlug?: string;
  isPublic?: boolean;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  layoutJson?: Prisma.InputJsonValue | null;
  links?: Array<{
    label: string;
    url: string;
    order: number;
  }>;
};

const portfolioLinkSchema = z.object({
  label: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "링크 라벨은 비어 있을 수 없습니다.")
    .max(MAX_LINK_LABEL_LENGTH, "링크 라벨은 80자 이하로 입력해주세요."),
  url: z.string().trim().url("링크 URL 형식이 올바르지 않습니다."),
  order: z
    .number()
    .int("링크 순서는 정수여야 합니다.")
    .min(MIN_ORDER, "링크 순서는 0 이상이어야 합니다.")
    .max(MAX_ORDER, "링크 순서는 9999 이하여야 합니다.")
    .optional()
    .default(0),
});

const portfolioSettingsUpsertSchema = z
  .object({
    publicSlug: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "공개 슬러그를 입력해주세요.")
      .max(
        MAX_PORTFOLIO_PUBLIC_SLUG_LENGTH,
        "공개 슬러그는 100자 이하로 입력해주세요.",
      )
      .regex(PORTFOLIO_PUBLIC_SLUG_PATTERN, "공개 슬러그 형식이 올바르지 않습니다.")
      .optional(),
    isPublic: z.boolean().optional(),
    displayName: z
      .string()
      .trim()
      .max(MAX_DISPLAY_NAME_LENGTH, "이름은 80자 이하로 입력해주세요.")
      .optional()
      .nullable(),
    headline: z
      .string()
      .trim()
      .max(MAX_HEADLINE_LENGTH, "헤드라인은 200자 이하로 입력해주세요.")
      .optional()
      .nullable(),
    bio: z
      .string()
      .trim()
      .max(MAX_BIO_LENGTH, "자기소개는 5000자 이하로 입력해주세요.")
      .optional()
      .nullable(),
    avatarUrl: z.string().trim().url("아바타 URL 형식이 올바르지 않습니다.").optional().nullable(),
    layoutJson: z.unknown().optional().nullable(),
    links: z
      .array(portfolioLinkSchema)
      .max(MAX_LINK_COUNT, "링크는 최대 20개까지 입력할 수 있습니다.")
      .optional(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

const ownerPortfolioSettingsSelect = {
  id: true,
  publicSlug: true,
  isPublic: true,
  displayName: true,
  headline: true,
  bio: true,
  avatarUrl: true,
  layoutJson: true,
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

function normalizeUpsertInput(
  input: z.infer<typeof portfolioSettingsUpsertSchema>,
): NormalizedPortfolioSettingsUpsertInput {
  return {
    publicSlug: input.publicSlug,
    isPublic: input.isPublic,
    displayName: toNullableString(input.displayName),
    headline: toNullableString(input.headline),
    bio: toNullableString(input.bio),
    avatarUrl: toNullableString(input.avatarUrl),
    layoutJson: (input.layoutJson as Prisma.InputJsonValue | null | undefined) ?? undefined,
    links: input.links?.map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
      order: link.order,
    })),
  };
}

export function parsePortfolioSettingsUpsertInput(input: unknown): PortfolioSettingsUpsertInput {
  try {
    const parsed = portfolioSettingsUpsertSchema.parse(input);
    return normalizeUpsertInput(parsed);
  } catch (error) {
    if (error instanceof PortfolioSettingsServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new PortfolioSettingsServiceError(
        "VALIDATION_ERROR",
        422,
        "포트폴리오 설정 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new PortfolioSettingsServiceError("CONFLICT", 409, "이미 사용 중인 공개 슬러그입니다.", {
      publicSlug: "publicSlug 값이 중복되었습니다.",
    });
  }

  throw error;
}

export function createPortfolioSettingsService(deps: {
  prisma: PortfolioSettingsServicePrismaClient;
}): PortfolioSettingsService {
  const { prisma } = deps;

  async function getSettingsWithLinks(ownerId: string) {
    const settings = await prisma.portfolioSettings.findUnique({
      where: { ownerId },
      select: ownerPortfolioSettingsSelect,
    });

    if (!settings) {
      return null;
    }

    const links = await prisma.portfolioLink.findMany({
      where: { settingsId: settings.id },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: {
        id: true,
        label: true,
        url: true,
        order: true,
      },
    });

    return {
      ...settings,
      links,
    };
  }

  return {
    async getPortfolioSettingsForOwner(ownerId) {
      return getSettingsWithLinks(ownerId);
    },

    async upsertPortfolioSettingsForOwner(ownerId, input) {
      const parsed = parsePortfolioSettingsUpsertInput(input);
      const existing = await prisma.portfolioSettings.findUnique({
        where: { ownerId },
        select: { id: true },
      });

      if (!existing && !parsed.publicSlug) {
        throw new PortfolioSettingsServiceError(
          "VALIDATION_ERROR",
          422,
          "포트폴리오 설정을 처음 생성할 때는 공개 슬러그가 필요합니다.",
          {
            publicSlug: "최초 생성 시 publicSlug는 필수입니다.",
          },
        );
      }

      if (!existing) {
        try {
          await prisma.portfolioSettings.create({
            data: {
              ownerId,
              publicSlug: parsed.publicSlug!,
              isPublic: parsed.isPublic ?? true,
              displayName: parsed.displayName ?? null,
              headline: parsed.headline ?? null,
              bio: parsed.bio ?? null,
              avatarUrl: parsed.avatarUrl ?? null,
              layoutJson: toNullableJsonInput(parsed.layoutJson),
              links: parsed.links
                ? {
                    create: parsed.links.map((link) => ({
                      label: link.label,
                      url: link.url,
                      order: link.order,
                    })),
                  }
                : undefined,
            },
          });
          const created = await getSettingsWithLinks(ownerId);
          if (!created) {
            throw new Error("생성된 포트폴리오 설정을 조회할 수 없습니다.");
          }
          return created;
        } catch (error) {
          handleKnownPrismaError(error);
        }
      }

      const data: Prisma.PortfolioSettingsUpdateInput = {};
      if (parsed.publicSlug !== undefined) {
        data.publicSlug = parsed.publicSlug;
      }
      if (parsed.isPublic !== undefined) {
        data.isPublic = parsed.isPublic;
      }
      if (parsed.displayName !== undefined) {
        data.displayName = parsed.displayName;
      }
      if (parsed.headline !== undefined) {
        data.headline = parsed.headline;
      }
      if (parsed.bio !== undefined) {
        data.bio = parsed.bio;
      }
      if (parsed.avatarUrl !== undefined) {
        data.avatarUrl = parsed.avatarUrl;
      }
      if (parsed.layoutJson !== undefined) {
        data.layoutJson = toNullableJsonInput(parsed.layoutJson);
      }
      if (parsed.links !== undefined) {
        data.links = {
          deleteMany: {},
          create: parsed.links.map((link) => ({
            label: link.label,
            url: link.url,
            order: link.order,
          })),
        };
      }

      try {
        await prisma.portfolioSettings.update({
          where: { ownerId },
          data,
        });
        const updated = await getSettingsWithLinks(ownerId);
        if (!updated) {
          throw new Error("수정된 포트폴리오 설정을 조회할 수 없습니다.");
        }
        return updated;
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },
  };
}
