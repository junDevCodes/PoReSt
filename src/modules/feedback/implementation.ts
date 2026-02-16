import { FeedbackTargetType, Prisma } from "@prisma/client";
import { z } from "zod";
import type {
  FeedbackCompareInput,
  FeedbackCompareResultDto,
  FeedbackRequestCreateInput,
  FeedbackService,
  FeedbackServicePrismaClient,
  FeedbackTargetDto,
  OwnerFeedbackItemDto,
  OwnerFeedbackRequestDetailDto,
  OwnerFeedbackRequestListItemDto,
} from "@/modules/feedback/interface";
import { FeedbackServiceError } from "@/modules/feedback/interface";

const MIN_TEXT_LENGTH = 1;
const MAX_TARGET_ID_LENGTH = 191;
const EMPTY_LENGTH = 0;

type FeedbackItemDraft = {
  severity: string;
  title: string;
  message: string;
  suggestion?: string | null;
  evidenceJson?: Prisma.InputJsonValue | null;
  pointerJson?: Prisma.InputJsonValue | null;
};

const createFeedbackRequestSchema = z.object({
  targetType: z.nativeEnum(FeedbackTargetType),
  targetId: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "대상 ID는 비어 있을 수 없습니다.")
    .max(MAX_TARGET_ID_LENGTH, "대상 ID는 191자 이하로 입력해주세요."),
  contextJson: z.unknown().optional().nullable(),
  optionsJson: z.unknown().optional().nullable(),
});

const compareFeedbackSchema = z
  .object({
    currentRequestId: z.string().trim().min(MIN_TEXT_LENGTH, "현재 실행 ID는 필수입니다."),
    previousRequestId: z.string().trim().min(MIN_TEXT_LENGTH, "이전 실행 ID는 필수입니다."),
  })
  .refine((input) => input.currentRequestId !== input.previousRequestId, {
    message: "비교 대상 실행 ID는 서로 달라야 합니다.",
    path: ["root"],
  });

const feedbackItemSelect = Prisma.validator<Prisma.FeedbackItemSelect>()({
  id: true,
  requestId: true,
  severity: true,
  title: true,
  message: true,
  suggestion: true,
  evidenceJson: true,
  pointerJson: true,
  createdAt: true,
});

const feedbackRequestListSelect = Prisma.validator<Prisma.FeedbackRequestSelect>()({
  id: true,
  targetType: true,
  targetId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      items: true,
    },
  },
});

const feedbackRequestDetailSelect = Prisma.validator<Prisma.FeedbackRequestSelect>()({
  id: true,
  ownerId: true,
  targetType: true,
  targetId: true,
  contextJson: true,
  optionsJson: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: [{ createdAt: "asc" }],
    select: feedbackItemSelect,
  },
});

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

function toNullableJsonInput(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }
  return value as Prisma.InputJsonValue;
}

function toNullableJsonValue(value: Prisma.InputJsonValue | null):
  | Prisma.InputJsonValue
  | Prisma.NullTypes.DbNull {
  if (value === null) {
    return Prisma.DbNull;
  }

  return value;
}

function normalizeCreateFeedbackRequestInput(
  input: z.infer<typeof createFeedbackRequestSchema>,
): FeedbackRequestCreateInput {
  return {
    targetType: input.targetType,
    targetId: input.targetId,
    contextJson: toNullableJsonInput(input.contextJson),
    optionsJson: toNullableJsonInput(input.optionsJson),
  };
}

export function parseFeedbackRequestCreateInput(input: unknown): FeedbackRequestCreateInput {
  try {
    const parsed = createFeedbackRequestSchema.parse(input);
    return normalizeCreateFeedbackRequestInput(parsed);
  } catch (error) {
    if (error instanceof FeedbackServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new FeedbackServiceError(
        "VALIDATION_ERROR",
        422,
        "피드백 요청 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

export function parseFeedbackCompareInput(input: unknown): FeedbackCompareInput {
  try {
    return compareFeedbackSchema.parse(input);
  } catch (error) {
    if (error instanceof FeedbackServiceError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new FeedbackServiceError(
        "VALIDATION_ERROR",
        422,
        "피드백 비교 입력값이 올바르지 않습니다.",
        extractZodFieldErrors(error),
      );
    }

    throw error;
  }
}

function handleKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new FeedbackServiceError("CONFLICT", 409, "이미 존재하는 피드백 요청입니다.");
    }
  }

  throw error;
}

function mapFeedbackItem(item: {
  id: string;
  requestId: string;
  severity: string;
  title: string;
  message: string;
  suggestion: string | null;
  evidenceJson: unknown;
  pointerJson: unknown;
  createdAt: Date;
}): OwnerFeedbackItemDto {
  return {
    id: item.id,
    requestId: item.requestId,
    severity: item.severity,
    title: item.title,
    message: item.message,
    suggestion: item.suggestion,
    evidenceJson: item.evidenceJson,
    pointerJson: item.pointerJson,
    createdAt: item.createdAt,
  };
}

function mapFeedbackRequestListItem(item: {
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    items: number;
  };
}): OwnerFeedbackRequestListItemDto {
  return {
    id: item.id,
    targetType: item.targetType,
    targetId: item.targetId,
    status: item.status,
    itemCount: item._count.items,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapFeedbackRequestDetail(detail: {
  id: string;
  ownerId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  contextJson: unknown;
  optionsJson: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    requestId: string;
    severity: string;
    title: string;
    message: string;
    suggestion: string | null;
    evidenceJson: unknown;
    pointerJson: unknown;
    createdAt: Date;
  }>;
}): OwnerFeedbackRequestDetailDto {
  return {
    id: detail.id,
    ownerId: detail.ownerId,
    targetType: detail.targetType,
    targetId: detail.targetId,
    contextJson: detail.contextJson,
    optionsJson: detail.optionsJson,
    status: detail.status,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    items: detail.items.map(mapFeedbackItem),
  };
}

async function ensureFeedbackRequestOwner(
  prisma: FeedbackServicePrismaClient,
  ownerId: string,
  requestId: string,
) {
  const request = await prisma.feedbackRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!request) {
    throw new FeedbackServiceError("NOT_FOUND", 404, "피드백 요청을 찾을 수 없습니다.");
  }

  if (request.ownerId !== ownerId) {
    throw new FeedbackServiceError("FORBIDDEN", 403, "다른 사용자의 피드백 요청에는 접근할 수 없습니다.");
  }
}

async function fetchFeedbackRequestDetailById(
  prisma: FeedbackServicePrismaClient,
  requestId: string,
): Promise<OwnerFeedbackRequestDetailDto> {
  const request = await prisma.feedbackRequest.findUnique({
    where: { id: requestId },
    select: feedbackRequestDetailSelect,
  });

  if (!request) {
    throw new FeedbackServiceError("NOT_FOUND", 404, "피드백 요청을 찾을 수 없습니다.");
  }

  return mapFeedbackRequestDetail(request);
}

function createItem(
  severity: string,
  title: string,
  message: string,
  suggestion?: string | null,
  evidenceJson?: Prisma.InputJsonValue | null,
  pointerJson?: Prisma.InputJsonValue | null,
): FeedbackItemDraft {
  return {
    severity,
    title,
    message,
    suggestion: suggestion ?? null,
    evidenceJson: evidenceJson ?? null,
    pointerJson: pointerJson ?? null,
  };
}

function containsAnyPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

async function buildPortfolioFeedbackItems(
  prisma: FeedbackServicePrismaClient,
  ownerId: string,
): Promise<FeedbackItemDraft[]> {
  const items: FeedbackItemDraft[] = [];

  const settings = await prisma.portfolioSettings.findFirst({
    where: { ownerId },
    select: {
      id: true,
      isPublic: true,
      headline: true,
      bio: true,
    },
  });

  const featuredProjectCount = await prisma.project.count({
    where: {
      ownerId,
      visibility: "PUBLIC",
      isFeatured: true,
    },
  });
  const featuredExperienceCount = await prisma.experience.count({
    where: {
      ownerId,
      visibility: "PUBLIC",
      isFeatured: true,
    },
  });

  if (!settings) {
    items.push(
      createItem(
        "WARNING",
        "포트폴리오 기본 설정 누락",
        "포트폴리오 설정이 없습니다. 공개 프로필 정보를 먼저 입력해주세요.",
        "프로필 설정 화면에서 publicSlug, headline, bio를 등록해주세요.",
      ),
    );
  } else {
    if (!settings.isPublic) {
      items.push(
        createItem(
          "INFO",
          "포트폴리오 비공개 상태",
          "현재 포트폴리오 공개 설정이 비활성화되어 있습니다.",
          "외부 공유가 필요하면 공개 설정을 켜주세요.",
        ),
      );
    }

    if (!settings.headline || settings.headline.trim().length === EMPTY_LENGTH) {
      items.push(
        createItem(
          "WARNING",
          "헤드라인 보강 필요",
          "헤드라인이 비어 있어 첫인상 전달력이 떨어질 수 있습니다.",
          "한 줄 요약으로 전문 분야와 강점을 명확히 표현해주세요.",
        ),
      );
    }

    if (!settings.bio || settings.bio.trim().length < 80) {
      items.push(
        createItem(
          "WARNING",
          "소개글 분량 부족",
          "소개글이 짧아 경험과 성과를 충분히 전달하기 어렵습니다.",
          "핵심 성과와 기술 스택을 포함해 2~4문장으로 보강해주세요.",
        ),
      );
    }
  }

  if (featuredProjectCount === 0) {
    items.push(
      createItem(
        "WARNING",
        "대표 프로젝트 미설정",
        "대표 프로젝트가 없어 메인 페이지에서 강점이 드러나지 않습니다.",
        "프로젝트에서 최소 1개를 isFeatured=true로 지정해주세요.",
      ),
    );
  }

  if (featuredExperienceCount === 0) {
    items.push(
      createItem(
        "INFO",
        "대표 경력 미설정",
        "대표 경력이 설정되지 않아 경력 섹션의 집중도가 낮을 수 있습니다.",
        "주요 경력을 대표 항목으로 지정해보세요.",
      ),
    );
  }

  if (items.length === 0) {
    items.push(
      createItem(
        "INFO",
        "포트폴리오 기본 점검 통과",
        "현재 포트폴리오 구성에서 즉시 보완이 필요한 항목을 찾지 못했습니다.",
      ),
    );
  }

  return items;
}

async function buildResumeFeedbackItems(
  prisma: FeedbackServicePrismaClient,
  ownerId: string,
  resumeId: string,
): Promise<FeedbackItemDraft[]> {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    select: {
      id: true,
      ownerId: true,
      targetCompany: true,
      targetRole: true,
      summaryMd: true,
      items: {
        select: {
          id: true,
          overrideMetricsJson: true,
          experience: {
            select: {
              metricsJson: true,
            },
          },
        },
      },
    },
  });

  if (!resume) {
    throw new FeedbackServiceError("NOT_FOUND", 404, "대상 이력서를 찾을 수 없습니다.");
  }

  if (resume.ownerId !== ownerId) {
    throw new FeedbackServiceError("FORBIDDEN", 403, "다른 사용자의 이력서에는 접근할 수 없습니다.");
  }

  const items: FeedbackItemDraft[] = [];

  if (!resume.summaryMd || resume.summaryMd.trim().length < 40) {
    items.push(
      createItem(
        "WARNING",
        "요약 보강 필요",
        "이력서 상단 요약이 비어 있거나 분량이 부족합니다.",
        "지원 직무 기준 핵심 성과와 기술 역량을 3~5문장으로 보강해주세요.",
      ),
    );
  }

  if (!resume.targetCompany || !resume.targetRole) {
    items.push(
      createItem(
        "INFO",
        "지원 컨텍스트 보강",
        "지원 회사 또는 직무 정보가 비어 있어 맞춤형 피드백 정확도가 낮아질 수 있습니다.",
        "targetCompany, targetRole 값을 입력해주세요.",
      ),
    );
  }

  if (resume.items.length === 0) {
    items.push(
      createItem(
        "CRITICAL",
        "경력 항목 누락",
        "이력서에 연결된 경력 항목이 없습니다.",
        "최소 1개 이상의 경력을 ResumeItem으로 추가해주세요.",
      ),
    );
  } else {
    const hasQuantifiedMetric = resume.items.some((item) => {
      return item.overrideMetricsJson !== null || item.experience.metricsJson !== null;
    });

    if (!hasQuantifiedMetric) {
      items.push(
        createItem(
          "WARNING",
          "정량 지표 부족",
          "연결된 경력 항목에서 정량 성과 지표를 찾지 못했습니다.",
          "매출, 속도, 비용, 전환율 등 수치 기반 지표를 추가해주세요.",
        ),
      );
    }
  }

  if (items.length === 0) {
    items.push(
      createItem(
        "INFO",
        "이력서 기본 점검 통과",
        "현재 이력서에서 즉시 보완이 필요한 핵심 항목을 찾지 못했습니다.",
      ),
    );
  }

  return items;
}

async function buildNoteFeedbackItems(
  prisma: FeedbackServicePrismaClient,
  ownerId: string,
  noteId: string,
): Promise<FeedbackItemDraft[]> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      contentMd: true,
      summary: true,
      tags: true,
      deletedAt: true,
    },
  });

  if (!note || note.deletedAt !== null) {
    throw new FeedbackServiceError("NOT_FOUND", 404, "대상 노트를 찾을 수 없습니다.");
  }

  if (note.ownerId !== ownerId) {
    throw new FeedbackServiceError("FORBIDDEN", 403, "다른 사용자의 노트에는 접근할 수 없습니다.");
  }

  const items: FeedbackItemDraft[] = [];
  const ambiguityPatterns = [/아마/g, /느낌/g, /추정/g, /확실히/g];

  if (note.tags.length === 0) {
    items.push(
      createItem(
        "WARNING",
        "태그 누락",
        "노트 태그가 없어 검색성과 자동 연관 추천 정확도가 낮아질 수 있습니다.",
        "핵심 개념 태그를 2~5개 추가해주세요.",
      ),
    );
  }

  if (note.contentMd.trim().length < 180) {
    items.push(
      createItem(
        "WARNING",
        "본문 분량 부족",
        "본문 길이가 짧아 개념/근거를 충분히 설명하지 못할 수 있습니다.",
        "핵심 정의와 예시를 추가해 본문을 보강해주세요.",
      ),
    );
  }

  if (!containsAnyPattern(note.contentMd, [/https?:\/\//g])) {
    items.push(
      createItem(
        "INFO",
        "근거 링크 보강",
        "본문에서 외부 근거 링크를 찾지 못했습니다.",
        "신뢰 가능한 문서/레퍼런스 링크를 1개 이상 추가해주세요.",
      ),
    );
  }

  if (containsAnyPattern(note.contentMd, ambiguityPatterns)) {
    items.push(
      createItem(
        "WARNING",
        "모호 표현 점검",
        "확신형 또는 모호 표현이 포함되어 오해를 만들 수 있습니다.",
        "사실/근거 중심 문장으로 표현을 정리해주세요.",
      ),
    );
  }

  if (items.length === 0) {
    items.push(
      createItem(
        "INFO",
        "노트 기본 점검 통과",
        "현재 노트에서 즉시 보완이 필요한 항목을 찾지 못했습니다.",
      ),
    );
  }

  return items;
}

async function buildBlogFeedbackItems(
  prisma: FeedbackServicePrismaClient,
  ownerId: string,
  postId: string,
): Promise<FeedbackItemDraft[]> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      status: true,
      visibility: true,
      summary: true,
      contentMd: true,
      lintReportJson: true,
      deletedAt: true,
    },
  });

  if (!post || post.deletedAt !== null) {
    throw new FeedbackServiceError("NOT_FOUND", 404, "대상 블로그 글을 찾을 수 없습니다.");
  }

  if (post.ownerId !== ownerId) {
    throw new FeedbackServiceError("FORBIDDEN", 403, "다른 사용자의 블로그 글에는 접근할 수 없습니다.");
  }

  const items: FeedbackItemDraft[] = [];

  if (!post.summary || post.summary.trim().length < 40) {
    items.push(
      createItem(
        "WARNING",
        "요약 보강 필요",
        "요약이 비어 있거나 분량이 부족해 글의 핵심 전달력이 낮을 수 있습니다.",
        "핵심 문제/해결/결과를 한 문단으로 요약해주세요.",
      ),
    );
  }

  const lintIssueCount =
    typeof post.lintReportJson === "object" &&
    post.lintReportJson !== null &&
    Array.isArray((post.lintReportJson as { issues?: unknown[] }).issues)
      ? ((post.lintReportJson as { issues: unknown[] }).issues?.length ?? 0)
      : 0;

  if (lintIssueCount > 0) {
    items.push(
      createItem(
        "WARNING",
        "Lint 이슈 잔존",
        `최근 lint 결과에서 ${lintIssueCount}개의 이슈가 확인되었습니다.`,
        "lint 결과를 확인하고 반복 표현, 근거 부족 문장을 우선 수정해주세요.",
      ),
    );
  }

  if (post.status === "PUBLISHED" && post.visibility === "PRIVATE") {
    items.push(
      createItem(
        "WARNING",
        "공개 상태 불일치",
        "게시 상태는 PUBLISHED인데 visibility가 PRIVATE로 설정되어 있습니다.",
        "의도한 공개 전략에 맞게 상태를 정렬해주세요.",
      ),
    );
  }

  if (post.contentMd.trim().length < 300) {
    items.push(
      createItem(
        "INFO",
        "본문 확장 권장",
        "본문 길이가 짧아 문제-해결-결과 구조가 충분히 드러나지 않을 수 있습니다.",
      ),
    );
  }

  if (items.length === 0) {
    items.push(
      createItem(
        "INFO",
        "블로그 기본 점검 통과",
        "현재 글에서 즉시 보완이 필요한 항목을 찾지 못했습니다.",
      ),
    );
  }

  return items;
}

async function buildFeedbackItemsByTarget(
  prisma: FeedbackServicePrismaClient,
  ownerId: string,
  targetType: FeedbackTargetType,
  targetId: string,
): Promise<FeedbackItemDraft[]> {
  switch (targetType) {
    case FeedbackTargetType.PORTFOLIO:
      return buildPortfolioFeedbackItems(prisma, ownerId);
    case FeedbackTargetType.RESUME:
      return buildResumeFeedbackItems(prisma, ownerId, targetId);
    case FeedbackTargetType.NOTE:
      return buildNoteFeedbackItems(prisma, ownerId, targetId);
    case FeedbackTargetType.BLOG:
      return buildBlogFeedbackItems(prisma, ownerId, targetId);
    default:
      throw new FeedbackServiceError("VALIDATION_ERROR", 422, "지원하지 않는 피드백 대상 타입입니다.");
  }
}

async function listFeedbackTargetsByType(
  prisma: FeedbackServicePrismaClient,
  ownerId: string,
  targetType: FeedbackTargetType,
): Promise<FeedbackTargetDto[]> {
  if (targetType === FeedbackTargetType.PORTFOLIO) {
    const settings = await prisma.portfolioSettings.findFirst({
      where: { ownerId },
      select: {
        id: true,
        displayName: true,
        publicSlug: true,
        updatedAt: true,
      },
    });

    if (!settings) {
      return [];
    }

    return [
      {
        id: settings.id,
        type: FeedbackTargetType.PORTFOLIO,
        title: settings.displayName ?? settings.publicSlug ?? "내 포트폴리오",
        updatedAt: settings.updatedAt,
      },
    ];
  }

  if (targetType === FeedbackTargetType.RESUME) {
    const resumes = await prisma.resume.findMany({
      where: { ownerId },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        targetRole: true,
        updatedAt: true,
      },
    });

    return resumes.map((resume) => ({
      id: resume.id,
      type: FeedbackTargetType.RESUME,
      title: resume.targetRole ? `${resume.title} (${resume.targetRole})` : resume.title,
      updatedAt: resume.updatedAt,
    }));
  }

  if (targetType === FeedbackTargetType.NOTE) {
    const notes = await prisma.note.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return notes.map((note) => ({
      id: note.id,
      type: FeedbackTargetType.NOTE,
      title: note.title,
      updatedAt: note.updatedAt,
    }));
  }

  if (targetType === FeedbackTargetType.BLOG) {
    const posts = await prisma.blogPost.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return posts.map((post) => ({
      id: post.id,
      type: FeedbackTargetType.BLOG,
      title: post.title,
      updatedAt: post.updatedAt,
    }));
  }

  return [];
}

function fingerprintFeedbackItem(item: OwnerFeedbackItemDto): string {
  return `${item.severity}|${item.title}|${item.message}`;
}

export function createFeedbackService(deps: { prisma: FeedbackServicePrismaClient }): FeedbackService {
  const { prisma } = deps;

  return {
    async listFeedbackTargetsForOwner(ownerId, targetType) {
      return listFeedbackTargetsByType(prisma, ownerId, targetType);
    },

    async listFeedbackRequestsForOwner(ownerId) {
      const items = await prisma.feedbackRequest.findMany({
        where: { ownerId },
        orderBy: [{ createdAt: "desc" }],
        select: feedbackRequestListSelect,
      });

      return items.map(mapFeedbackRequestListItem);
    },

    async getFeedbackRequestForOwner(ownerId, requestId) {
      await ensureFeedbackRequestOwner(prisma, ownerId, requestId);
      return fetchFeedbackRequestDetailById(prisma, requestId);
    },

    async createFeedbackRequest(ownerId, input) {
      const parsed = parseFeedbackRequestCreateInput(input);

      try {
        const created = await prisma.feedbackRequest.create({
          data: {
            ownerId,
            targetType: parsed.targetType,
            targetId: parsed.targetId,
            contextJson: toNullableJsonValue(parsed.contextJson ?? null),
            optionsJson: toNullableJsonValue(parsed.optionsJson ?? null),
            status: "QUEUED",
          },
          select: { id: true },
        });

        return fetchFeedbackRequestDetailById(prisma, created.id);
      } catch (error) {
        handleKnownPrismaError(error);
      }
    },

    async runFeedbackRequestForOwner(ownerId, requestId) {
      await ensureFeedbackRequestOwner(prisma, ownerId, requestId);

      const request = await prisma.feedbackRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          ownerId: true,
          targetType: true,
          targetId: true,
        },
      });

      if (!request) {
        throw new FeedbackServiceError("NOT_FOUND", 404, "피드백 요청을 찾을 수 없습니다.");
      }

      if (request.ownerId !== ownerId) {
        throw new FeedbackServiceError("FORBIDDEN", 403, "다른 사용자의 피드백 요청에는 접근할 수 없습니다.");
      }

      await prisma.feedbackRequest.update({
        where: { id: requestId },
        data: { status: "RUNNING" },
        select: { id: true },
      });

      try {
        const drafts = await buildFeedbackItemsByTarget(
          prisma,
          ownerId,
          request.targetType,
          request.targetId,
        );

        await prisma.feedbackItem.deleteMany({
          where: { requestId },
        });

        if (drafts.length > 0) {
          await prisma.feedbackItem.createMany({
            data: drafts.map((draft) => ({
              requestId,
              severity: draft.severity,
              title: draft.title,
              message: draft.message,
              suggestion: draft.suggestion ?? null,
              evidenceJson: toNullableJsonValue((draft.evidenceJson as Prisma.InputJsonValue | null) ?? null),
              pointerJson: toNullableJsonValue((draft.pointerJson as Prisma.InputJsonValue | null) ?? null),
            })),
          });
        }

        await prisma.feedbackRequest.update({
          where: { id: requestId },
          data: { status: "DONE" },
          select: { id: true },
        });

        return fetchFeedbackRequestDetailById(prisma, requestId);
      } catch (error) {
        await prisma.feedbackRequest
          .update({
            where: { id: requestId },
            data: { status: "FAILED" },
            select: { id: true },
          })
          .catch(() => undefined);

        throw error;
      }
    },

    async compareFeedbackRequestsForOwner(ownerId, input) {
      const parsed = parseFeedbackCompareInput(input);

      await ensureFeedbackRequestOwner(prisma, ownerId, parsed.currentRequestId);
      await ensureFeedbackRequestOwner(prisma, ownerId, parsed.previousRequestId);

      const current = await fetchFeedbackRequestDetailById(prisma, parsed.currentRequestId);
      const previous = await fetchFeedbackRequestDetailById(prisma, parsed.previousRequestId);

      if (current.targetType !== previous.targetType) {
        throw new FeedbackServiceError(
          "VALIDATION_ERROR",
          422,
          "비교 대상 피드백의 targetType이 서로 다릅니다.",
        );
      }

      const currentMap = new Map(current.items.map((item) => [fingerprintFeedbackItem(item), item]));
      const previousMap = new Map(previous.items.map((item) => [fingerprintFeedbackItem(item), item]));

      const added: OwnerFeedbackItemDto[] = [];
      const resolved: OwnerFeedbackItemDto[] = [];
      const unchanged: OwnerFeedbackItemDto[] = [];

      for (const [key, item] of currentMap.entries()) {
        if (previousMap.has(key)) {
          unchanged.push(item);
        } else {
          added.push(item);
        }
      }

      for (const [key, item] of previousMap.entries()) {
        if (!currentMap.has(key)) {
          resolved.push(item);
        }
      }

      const result: FeedbackCompareResultDto = {
        currentRequestId: parsed.currentRequestId,
        previousRequestId: parsed.previousRequestId,
        added,
        resolved,
        unchanged,
        summary: {
          added: added.length,
          resolved: resolved.length,
          unchanged: unchanged.length,
        },
      };

      return result;
    },
  };
}
