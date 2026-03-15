import { CompanyTargetStatus } from "@prisma/client";
import { z } from "zod";
import type {
  BoardCardDto,
  BoardColumnDto,
  BoardDto,
  ApplicationEventDto,
  JdMatchResult,
  JobTrackerService,
  JobTrackerServicePrismaClient,
} from "@/modules/job-tracker/interface";
import { JobTrackerServiceError } from "@/modules/job-tracker/interface";
import type { GeminiClient } from "@/modules/gemini/interface";
import { getDefaultGeminiClient, withGeminiFallback } from "@/modules/gemini/implementation";

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const STATUS_ORDER: CompanyTargetStatus[] = [
  CompanyTargetStatus.INTERESTED,
  CompanyTargetStatus.APPLIED,
  CompanyTargetStatus.INTERVIEWING,
  CompanyTargetStatus.OFFER,
  CompanyTargetStatus.REJECTED,
  CompanyTargetStatus.ARCHIVED,
];

const STATUS_LABELS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "관심",
  APPLIED: "지원 완료",
  INTERVIEWING: "면접 진행",
  OFFER: "오퍼 수령",
  REJECTED: "탈락/거절",
  ARCHIVED: "보관",
};

const MAX_NOTE_LENGTH = 2000;
const MAX_JD_LENGTH = 50000;

// ─────────────────────────────────────────────
// Zod 스키마
// ─────────────────────────────────────────────

const statusChangeSchema = z.object({
  status: z.nativeEnum(CompanyTargetStatus),
  note: z.string().trim().max(MAX_NOTE_LENGTH, "메모는 2000자 이하로 입력해주세요.").optional().nullable(),
});

const jdMatchInputSchema = z.object({
  jobDescriptionMd: z
    .string()
    .trim()
    .min(1, "채용 공고 내용을 입력해주세요.")
    .max(MAX_JD_LENGTH, "채용 공고는 50000자 이하로 입력해주세요."),
});

// ─────────────────────────────────────────────
// Prisma Select
// ─────────────────────────────────────────────

const boardCardSelect = {
  id: true,
  company: true,
  role: true,
  status: true,
  priority: true,
  summary: true,
  tags: true,
  jobDescriptionMd: true,
  appliedAt: true,
  matchScoreJson: true,
  updatedAt: true,
  ownerId: true,
  _count: {
    select: { events: true },
  },
} as const;

const applicationEventSelect = {
  id: true,
  fromStatus: true,
  toStatus: true,
  note: true,
  createdAt: true,
} as const;

// ─────────────────────────────────────────────
// Zod 검증 헬퍼
// ─────────────────────────────────────────────

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

type BoardCardRow = {
  id: string;
  company: string;
  role: string;
  status: CompanyTargetStatus;
  priority: number;
  summary: string | null;
  tags: string[];
  jobDescriptionMd: string | null;
  appliedAt: Date | null;
  matchScoreJson: unknown;
  updatedAt: Date;
  ownerId: string;
  _count: { events: number };
};

function mapBoardCard(row: BoardCardRow): BoardCardDto {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status,
    priority: row.priority,
    summary: row.summary,
    tags: row.tags,
    jobDescriptionMd: row.jobDescriptionMd,
    appliedAt: row.appliedAt,
    matchScoreJson: row.matchScoreJson,
    eventCount: row._count.events,
    updatedAt: row.updatedAt,
  };
}

// ─────────────────────────────────────────────
// JD 매칭 프롬프트
// ─────────────────────────────────────────────

export const JD_MATCH_SYSTEM_PROMPT = `당신은 대한민국 IT 업계에서 10년 이상 경력을 가진 커리어 컨설턴트입니다.
채용 공고(JD)와 지원자의 보유 기술/경력을 분석하여 적합도를 평가합니다.

## 평가 기준

1. **기술 매칭**: JD 필수/우대 기술과 보유 기술의 일치도
2. **경력 관련성**: JD 역할/책임과 기존 경력의 연관성
3. **성장 가능성**: 부족한 부분의 보완 가능성

## 출력 형식 (반드시 JSON)

\`\`\`json
{
  "score": 75,
  "matchedSkills": ["TypeScript", "React", "Next.js"],
  "gaps": ["Kubernetes 경험 부족", "대규모 트래픽 처리 경험 필요"],
  "summary": "프론트엔드 기술 스택이 잘 맞지만 인프라 경험이 부족합니다."
}
\`\`\`

## 규칙

- score: 0~100 정수 (100 = 완벽 일치)
- matchedSkills: JD와 일치하는 보유 기술 목록 (최대 10개)
- gaps: 부족한 역량/기술 (최대 5개, 한국어)
- summary: 1~2문장 한국어 종합 평가
- JSON 외 텍스트 출력 금지`;

export function buildJdMatchPrompt(
  jobDescription: string,
  skills: { name: string; category: string | null }[],
  experiences: { company: string; role: string; techTags: string[]; summary: string | null; isCurrent: boolean }[],
): string {
  const skillsText = skills.length > 0
    ? skills.map((s) => `- ${s.name}${s.category ? ` (${s.category})` : ""}`).join("\n")
    : "(등록된 기술 없음)";

  const expText = experiences.length > 0
    ? experiences.map((e) => {
        const current = e.isCurrent ? " [재직 중]" : "";
        const tags = e.techTags.length > 0 ? ` | 기술: ${e.techTags.join(", ")}` : "";
        const summary = e.summary ? ` | ${e.summary.slice(0, 200)}` : "";
        return `- ${e.company} / ${e.role}${current}${tags}${summary}`;
      }).join("\n")
    : "(등록된 경력 없음)";

  return `## 채용 공고 (JD)

${jobDescription.slice(0, 10000)}

## 보유 기술

${skillsText}

## 경력 사항

${expText}

위 정보를 분석하여 JSON 형식으로 적합도를 평가해주세요.`;
}

export function parseJdMatchResponse(text: string): JdMatchResult {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch?.[1]) {
    return { score: 0, matchedSkills: [], gaps: ["AI 분석 결과를 파싱할 수 없습니다."], summary: "분석 실패" };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;

    const score = typeof parsed.score === "number" ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 0;
    const matchedSkills = Array.isArray(parsed.matchedSkills)
      ? (parsed.matchedSkills as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 10)
      : [];
    const gaps = Array.isArray(parsed.gaps)
      ? (parsed.gaps as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 5)
      : [];
    const summary = typeof parsed.summary === "string" ? parsed.summary.slice(0, 500) : "분석 완료";

    return { score, matchedSkills, gaps, summary };
  } catch {
    return { score: 0, matchedSkills: [], gaps: ["JSON 파싱 실패"], summary: "분석 실패" };
  }
}

// ─────────────────────────────────────────────
// 서비스 생성
// ─────────────────────────────────────────────

export function createJobTrackerService(deps: {
  prisma: JobTrackerServicePrismaClient;
  geminiClient?: GeminiClient;
}): JobTrackerService {
  const { prisma } = deps;
  const gemini = deps.geminiClient ?? getDefaultGeminiClient();

  return {
    async getBoardForOwner(ownerId): Promise<BoardDto> {
      const allTargets = await prisma.companyTarget.findMany({
        where: { ownerId },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        select: boardCardSelect,
      });

      const grouped = new Map<CompanyTargetStatus, BoardCardDto[]>();
      for (const status of STATUS_ORDER) {
        grouped.set(status, []);
      }

      for (const target of allTargets) {
        const cards = grouped.get(target.status);
        if (cards) {
          cards.push(mapBoardCard(target));
        }
      }

      const columns: BoardColumnDto[] = STATUS_ORDER.map((status) => ({
        status,
        label: STATUS_LABELS[status],
        cards: grouped.get(status) ?? [],
      }));

      return {
        columns,
        totalCount: allTargets.length,
      };
    },

    async changeStatus(ownerId, targetId, input): Promise<BoardCardDto> {
      const parsed = statusChangeSchema.safeParse(input);
      if (!parsed.success) {
        throw new JobTrackerServiceError(
          "VALIDATION_ERROR",
          422,
          "상태 변경 입력값이 올바르지 않습니다.",
          extractZodFieldErrors(parsed.error),
        );
      }

      const existing = await prisma.companyTarget.findUnique({
        where: { id: targetId },
        select: { id: true, ownerId: true, status: true },
      });

      if (!existing) {
        throw new JobTrackerServiceError("NOT_FOUND", 404, "기업 분석 카드를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new JobTrackerServiceError("FORBIDDEN", 403, "권한이 없습니다.");
      }

      const fromStatus = existing.status;
      const toStatus = parsed.data.status;

      // 상태 변경 + 이벤트 기록
      const updated = await prisma.companyTarget.update({
        where: { id: targetId },
        data: {
          status: toStatus,
          ...(toStatus === CompanyTargetStatus.APPLIED && !existing.status.includes("APPLIED")
            ? { appliedAt: new Date() }
            : {}),
        },
        select: boardCardSelect,
      });

      await prisma.applicationEvent.create({
        data: {
          companyTargetId: targetId,
          fromStatus,
          toStatus,
          note: parsed.data.note ?? null,
        },
      });

      return mapBoardCard(updated);
    },

    async runJdMatch(ownerId, targetId, input): Promise<JdMatchResult> {
      const existing = await prisma.companyTarget.findUnique({
        where: { id: targetId },
        select: { id: true, ownerId: true, jobDescriptionMd: true },
      });

      if (!existing) {
        throw new JobTrackerServiceError("NOT_FOUND", 404, "기업 분석 카드를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new JobTrackerServiceError("FORBIDDEN", 403, "권한이 없습니다.");
      }

      // input이 있으면 JD를 업데이트, 없으면 기존 JD 사용
      let jobDescription = existing.jobDescriptionMd;

      if (input) {
        const parsed = jdMatchInputSchema.safeParse(input);
        if (!parsed.success) {
          throw new JobTrackerServiceError(
            "VALIDATION_ERROR",
            422,
            "채용 공고 입력값이 올바르지 않습니다.",
            extractZodFieldErrors(parsed.error),
          );
        }
        jobDescription = parsed.data.jobDescriptionMd;

        // JD 저장
        await prisma.companyTarget.update({
          where: { id: targetId },
          data: { jobDescriptionMd: jobDescription },
        });
      }

      if (!jobDescription) {
        throw new JobTrackerServiceError("NO_JD", 422, "채용 공고(JD)가 등록되지 않았습니다.");
      }

      // 보유 기술/경력 조회
      const [skills, experiences] = await Promise.all([
        prisma.skill.findMany({
          where: { ownerId },
          select: { name: true, category: true },
          orderBy: { order: "asc" },
        }),
        prisma.experience.findMany({
          where: { ownerId, visibility: "PUBLIC" },
          select: { company: true, role: true, techTags: true, summary: true, isCurrent: true },
          orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
        }),
      ]);

      const prompt = buildJdMatchPrompt(jobDescription, skills, experiences);

      const { result } = await withGeminiFallback(
        gemini,
        async () => {
          const response = await gemini.generateText(prompt, {
            systemPrompt: JD_MATCH_SYSTEM_PROMPT,
            temperature: 0.3,
            maxOutputTokens: 1024,
          });
          return parseJdMatchResponse(response.text);
        },
        () => buildFallbackMatch(jobDescription!, skills, experiences),
      );

      // 매칭 결과 저장
      await prisma.companyTarget.update({
        where: { id: targetId },
        data: { matchScoreJson: result as unknown as import("@prisma/client").Prisma.InputJsonValue },
      });

      return result;
    },

    async getEventsForTarget(ownerId, targetId): Promise<ApplicationEventDto[]> {
      const existing = await prisma.companyTarget.findUnique({
        where: { id: targetId },
        select: { id: true, ownerId: true },
      });

      if (!existing) {
        throw new JobTrackerServiceError("NOT_FOUND", 404, "기업 분석 카드를 찾을 수 없습니다.");
      }

      if (existing.ownerId !== ownerId) {
        throw new JobTrackerServiceError("FORBIDDEN", 403, "권한이 없습니다.");
      }

      const events = await prisma.applicationEvent.findMany({
        where: { companyTargetId: targetId },
        orderBy: { createdAt: "desc" },
        select: applicationEventSelect,
      });

      return events;
    },
  };
}

// ─────────────────────────────────────────────
// Fallback 매칭 (키워드 기반)
// ─────────────────────────────────────────────

function buildFallbackMatch(
  jd: string,
  skills: { name: string; category: string | null }[],
  experiences: { company: string; role: string; techTags: string[]; summary: string | null; isCurrent: boolean }[],
): JdMatchResult {
  const jdLower = jd.toLowerCase();
  const allTechTags = new Set<string>();
  for (const exp of experiences) {
    for (const tag of exp.techTags) {
      allTechTags.add(tag.toLowerCase());
    }
  }

  const matchedSkills: string[] = [];
  for (const skill of skills) {
    if (jdLower.includes(skill.name.toLowerCase())) {
      matchedSkills.push(skill.name);
    }
  }

  for (const tag of allTechTags) {
    if (jdLower.includes(tag) && !matchedSkills.some((s) => s.toLowerCase() === tag)) {
      matchedSkills.push(tag);
    }
  }

  const uniqueMatched = matchedSkills.slice(0, 10);
  const score = skills.length > 0 ? Math.round((uniqueMatched.length / Math.max(skills.length, 1)) * 100) : 0;

  return {
    score: Math.min(100, score),
    matchedSkills: uniqueMatched,
    gaps: ["AI 분석 미사용 (키워드 기반 기본 매칭)"],
    summary: uniqueMatched.length > 0
      ? `${uniqueMatched.length}개 기술이 일치합니다 (키워드 기반).`
      : "일치하는 기술이 없습니다.",
  };
}
