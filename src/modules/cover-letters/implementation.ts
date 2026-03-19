// ─────────────────────────────────────────────
// 자기소개서 모듈 — 서비스 구현
// T97: 합격 자소서 RAG 파이프라인
// ─────────────────────────────────────────────

import { CoverLetterStatus } from "@prisma/client";
import { z } from "zod";
import {
  type CoverLetterServicePrismaClient,
  type CoverLettersService,
  type CoverLetterGenerateInput,
  type CoverLetterGenerateResult,
  type OwnerCoverLetterDetailDto,
  type OwnerCoverLetterListItemDto,
  CoverLetterServiceError,
} from "@/modules/cover-letters/interface";
import type { SimilarCoverLetterDto } from "@/modules/cover-letter-embeddings/interface";
import type { GeminiClient } from "@/modules/gemini/interface";
import { getDefaultGeminiClient, withGeminiFallback } from "@/modules/gemini/implementation";

// ── 상수 ──

const MIN_TEXT_LENGTH = 1;
const MAX_TITLE_LENGTH = 120;
const MAX_COMPANY_LENGTH = 120;
const MAX_ROLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 50000;
const EMPTY_LENGTH = 0;

// ── Zod 스키마 ──

const createSchema = z.object({
  title: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "자기소개서 제목은 비어 있을 수 없습니다.")
    .max(MAX_TITLE_LENGTH, "자기소개서 제목은 120자 이하로 입력해주세요."),
  targetCompany: z
    .string()
    .trim()
    .max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  targetRole: z
    .string()
    .trim()
    .max(MAX_ROLE_LENGTH, "직무명은 120자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  contentMd: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "자기소개서 본문은 비어 있을 수 없습니다.")
    .max(MAX_CONTENT_LENGTH, "자기소개서 본문은 50000자 이하로 입력해주세요."),
  status: z.nativeEnum(CoverLetterStatus).optional().default(CoverLetterStatus.DRAFT),
  isReference: z.boolean().optional().default(false),
  resumeId: z.string().trim().optional().nullable(),
  experienceId: z.string().trim().optional().nullable(),
});

const updateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "자기소개서 제목은 비어 있을 수 없습니다.")
      .max(MAX_TITLE_LENGTH, "자기소개서 제목은 120자 이하로 입력해주세요.")
      .optional(),
    targetCompany: z
      .string()
      .trim()
      .max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요.")
      .optional()
      .nullable(),
    targetRole: z
      .string()
      .trim()
      .max(MAX_ROLE_LENGTH, "직무명은 120자 이하로 입력해주세요.")
      .optional()
      .nullable(),
    contentMd: z
      .string()
      .trim()
      .min(MIN_TEXT_LENGTH, "자기소개서 본문은 비어 있을 수 없습니다.")
      .max(MAX_CONTENT_LENGTH, "자기소개서 본문은 50000자 이하로 입력해주세요.")
      .optional(),
    status: z.nativeEnum(CoverLetterStatus).optional(),
    isReference: z.boolean().optional(),
    resumeId: z.string().trim().optional().nullable(),
    experienceId: z.string().trim().optional().nullable(),
  })
  .refine((input) => Object.keys(input).length > EMPTY_LENGTH, {
    message: "수정할 필드를 최소 1개 이상 입력해주세요.",
    path: ["root"],
  });

// ── 헬퍼 ──

function toListItemDto(row: {
  id: string;
  status: CoverLetterStatus;
  isReference: boolean;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  updatedAt: Date;
}): OwnerCoverLetterListItemDto {
  return {
    id: row.id,
    status: row.status,
    isReference: row.isReference,
    title: row.title,
    targetCompany: row.targetCompany,
    targetRole: row.targetRole,
    updatedAt: row.updatedAt,
  };
}

function toDetailDto(row: {
  id: string;
  status: CoverLetterStatus;
  isReference: boolean;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  contentMd: string;
  resumeId: string | null;
  experienceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): OwnerCoverLetterDetailDto {
  return {
    id: row.id,
    status: row.status,
    isReference: row.isReference,
    title: row.title,
    targetCompany: row.targetCompany,
    targetRole: row.targetRole,
    contentMd: row.contentMd,
    resumeId: row.resumeId,
    experienceId: row.experienceId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseValidation<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "root";
      fields[key] = issue.message;
    }
    throw new CoverLetterServiceError(
      "VALIDATION_ERROR",
      422,
      "입력 데이터가 올바르지 않습니다.",
      fields,
    );
  }
  return result.data;
}

// ── 서비스 팩토리 ──

export function createCoverLettersService(deps: {
  prisma: CoverLetterServicePrismaClient;
}): CoverLettersService {
  const { prisma } = deps;

  return {
    async listForOwner(ownerId) {
      const rows = await prisma.coverLetter.findMany({
        where: { ownerId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          status: true,
          isReference: true,
          title: true,
          targetCompany: true,
          targetRole: true,
          updatedAt: true,
        },
      });
      return rows.map(toListItemDto);
    },

    async getForOwner(ownerId, id) {
      const row = await prisma.coverLetter.findFirst({
        where: { id, ownerId },
      });
      if (!row) {
        throw new CoverLetterServiceError(
          "NOT_FOUND",
          404,
          "자기소개서를 찾을 수 없습니다.",
        );
      }
      return toDetailDto(row);
    },

    async create(ownerId, input) {
      const data = parseValidation(createSchema, input);
      const row = await prisma.coverLetter.create({
        data: {
          ownerId,
          title: data.title,
          targetCompany: data.targetCompany ?? null,
          targetRole: data.targetRole ?? null,
          contentMd: data.contentMd,
          status: data.status,
          isReference: data.isReference,
          resumeId: data.resumeId ?? null,
          experienceId: data.experienceId ?? null,
        },
      });
      return toDetailDto(row);
    },

    async update(ownerId, id, input) {
      const existing = await prisma.coverLetter.findFirst({
        where: { id, ownerId },
      });
      if (!existing) {
        throw new CoverLetterServiceError(
          "NOT_FOUND",
          404,
          "자기소개서를 찾을 수 없습니다.",
        );
      }

      const data = parseValidation(updateSchema, input);
      const row = await prisma.coverLetter.update({
        where: { id },
        data,
      });
      return toDetailDto(row);
    },

    async delete(ownerId, id) {
      const existing = await prisma.coverLetter.findFirst({
        where: { id, ownerId },
      });
      if (!existing) {
        throw new CoverLetterServiceError(
          "NOT_FOUND",
          404,
          "자기소개서를 찾을 수 없습니다.",
        );
      }
      await prisma.coverLetter.delete({ where: { id } });
      return { id };
    },

    async toggleReference(ownerId, id) {
      const existing = await prisma.coverLetter.findFirst({
        where: { id, ownerId },
      });
      if (!existing) {
        throw new CoverLetterServiceError(
          "NOT_FOUND",
          404,
          "자기소개서를 찾을 수 없습니다.",
        );
      }
      const row = await prisma.coverLetter.update({
        where: { id },
        data: { isReference: !existing.isReference },
      });
      return toDetailDto(row);
    },
  };
}

// ── 자기소개서 생성 (RAG + Gemini) ──

const COVER_LETTER_SYSTEM_PROMPT =
  "당신은 대한민국 IT 업계 경력 15년 이상의 자기소개서 작성 전문 컨설턴트입니다. " +
  "합격 자소서의 패턴을 분석하여 지원 기업과 직무에 최적화된 자기소개서를 작성합니다. " +
  "자기소개서는 반드시 한국어로 작성하며, 구체적 수치와 성과를 포함합니다. " +
  "지원 동기 → 핵심 역량 → 성장 계획 → 입사 후 포부 순서로 구성합니다.";

const COVER_LETTER_TEMPERATURE = 0.6;
const COVER_LETTER_MAX_OUTPUT_TOKENS = 4096;
const MAX_JD_LENGTH = 5000;
const MAX_MOTIVATION_HINT_LENGTH = 2000;

const generateSchema = z.object({
  targetCompany: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "지원 회사명은 비어 있을 수 없습니다.")
    .max(MAX_COMPANY_LENGTH, "회사명은 120자 이하로 입력해주세요."),
  targetRole: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, "지원 직무명은 비어 있을 수 없습니다.")
    .max(MAX_ROLE_LENGTH, "직무명은 120자 이하로 입력해주세요."),
  jobDescription: z
    .string()
    .trim()
    .max(MAX_JD_LENGTH, "채용 공고는 5000자 이하로 입력해주세요.")
    .optional()
    .nullable(),
  motivationHint: z
    .string()
    .trim()
    .max(MAX_MOTIVATION_HINT_LENGTH, "지원 동기 힌트는 2000자 이하로 입력해주세요.")
    .optional()
    .nullable(),
});

type ExperienceForGenerate = {
  company: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  summary: string | null;
  bulletsJson: unknown;
  metricsJson: unknown;
  techTags: string[];
};

type SkillForGenerate = {
  name: string;
  category: string | null;
};

function formatDateYM(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function safeJsonArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((v): v is string => typeof v === "string");
  return [];
}

function safeJsonRecord(value: unknown): Record<string, string> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record: Record<string, string> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      record[k] = String(v);
    }
    return record;
  }
  return {};
}

export function buildCoverLetterPrompt(
  input: CoverLetterGenerateInput,
  experiences: ExperienceForGenerate[],
  skills: SkillForGenerate[],
  referenceLetters: SimilarCoverLetterDto[],
): string {
  const sections: string[] = [];

  // 1. 지원 정보
  sections.push(
    `## 지원 정보\n- 회사: ${input.targetCompany}\n- 직무: ${input.targetRole}`,
  );

  // 2. 채용 공고
  if (input.jobDescription) {
    sections.push(
      `## 채용 공고 (JD)\n${input.jobDescription.slice(0, MAX_JD_LENGTH)}`,
    );
  }

  // 3. 지원 동기 힌트
  if (input.motivationHint) {
    sections.push(
      `## 지원 동기 힌트\n${input.motivationHint.slice(0, MAX_MOTIVATION_HINT_LENGTH)}`,
    );
  }

  // 4. 합격 자소서 예시 (RAG 검색 결과)
  if (referenceLetters.length > 0) {
    const examples = referenceLetters
      .map(
        (ref, i) =>
          `### 예시 ${i + 1}: ${ref.title} (${ref.targetCompany ?? "미상"} / ${ref.targetRole ?? "미상"}, 유사도 ${(ref.score * 100).toFixed(0)}%)\n${ref.contentMd.slice(0, 3000)}`,
      )
      .join("\n\n");
    sections.push(
      `## 합격 자소서 예시 (참고용 — 패턴과 구조를 참고하되 내용은 새로 작성)\n${examples}`,
    );
  }

  // 5. 지원자 경력
  if (experiences.length > 0) {
    const expList = experiences
      .map((exp, i) => {
        const period = exp.isCurrent
          ? `${formatDateYM(exp.startDate)} ~ 현재`
          : `${formatDateYM(exp.startDate)} ~ ${exp.endDate ? formatDateYM(exp.endDate) : "미정"}`;
        const lines = [`### ${i + 1}. ${exp.company} — ${exp.role} (${period})`];
        if (exp.summary) lines.push(`요약: ${exp.summary}`);
        const bullets = safeJsonArray(exp.bulletsJson);
        if (bullets.length > 0)
          lines.push(
            `성과:\n${bullets.map((b) => `  - ${b}`).join("\n")}`,
          );
        const metrics = safeJsonRecord(exp.metricsJson);
        if (Object.keys(metrics).length > 0) {
          lines.push(
            `지표:\n${Object.entries(metrics)
              .map(([k, v]) => `  - ${k}: ${v}`)
              .join("\n")}`,
          );
        }
        if (exp.techTags.length > 0)
          lines.push(`기술: ${exp.techTags.join(", ")}`);
        return lines.join("\n");
      })
      .join("\n\n");
    sections.push(`## 지원자 경력\n${expList}`);
  }

  // 6. 보유 기술
  if (skills.length > 0) {
    const skillText = skills.map((s) => s.name).join(", ");
    sections.push(`## 보유 기술\n${skillText}`);
  }

  // 7. 출력 형식 지시
  sections.push(
    `## 작성 지시사항
아래 구조로 자기소개서를 작성하세요. 마크다운 형식으로 출력합니다.

### 1. 지원 동기
- 왜 이 회사/직무에 지원하는지 (구체적 이유)

### 2. 핵심 역량
- 직무와 관련된 경력/프로젝트 성과 (수치 포함)
- 지원자의 경력 데이터에서 직무에 맞는 내용을 선별

### 3. 성장 계획
- 입사 후 어떻게 성장할 것인지

### 4. 입사 후 포부
- 회사에 어떤 기여를 할 수 있는지

각 섹션은 2~4문장으로 작성합니다. 전체 분량은 800~1500자 내외입니다.
자연스러운 문체로 작성하고, "~습니다" 경어체를 사용하세요.`,
  );

  return sections.join("\n\n");
}

/** Gemini fallback 시 구조화된 템플릿 생성 */
function buildFallbackCoverLetter(
  input: CoverLetterGenerateInput,
  experiences: ExperienceForGenerate[],
  skills: SkillForGenerate[],
): string {
  const topExperiences = experiences.slice(0, 3);
  const topSkills = skills.slice(0, 10);

  const expSummary = topExperiences
    .map(
      (exp) =>
        `${exp.company}에서 ${exp.role}로 근무하며 ${exp.summary || "다양한 프로젝트를 수행"}했습니다.`,
    )
    .join(" ");

  const skillText =
    topSkills.length > 0
      ? topSkills.map((s) => s.name).join(", ")
      : "다양한 기술";

  return `## 1. 지원 동기

${input.targetCompany}의 ${input.targetRole} 포지션에 지원합니다. ${input.motivationHint || `${input.targetCompany}의 기술적 도전과 성장 가능성에 매력을 느꼈습니다.`}

## 2. 핵심 역량

${expSummary || "다양한 프로젝트 경험을 보유하고 있습니다."} 주요 기술 스택으로 ${skillText}을(를) 활용하여 문제를 해결해 왔습니다.

## 3. 성장 계획

${input.targetRole} 직무에서 전문성을 심화하고, ${input.targetCompany}의 기술 문화 속에서 지속적으로 성장하겠습니다.

## 4. 입사 후 포부

${input.targetCompany}에서 기존 경험과 기술력을 바탕으로 팀에 즉시 기여하고, 장기적으로는 기술 리더십을 발휘하여 조직의 성장에 함께하겠습니다.`;
}

export { COVER_LETTER_SYSTEM_PROMPT };

type CoverLetterGeneratePrismaClient = Pick<
  CoverLetterServicePrismaClient,
  "coverLetter" | "experience" | "skill"
>;

export async function generateCoverLetter(
  service: CoverLettersService,
  prisma: CoverLetterGeneratePrismaClient,
  ownerId: string,
  input: unknown,
  searchSimilar: (
    queryText: string,
  ) => Promise<SimilarCoverLetterDto[]>,
  geminiClient?: GeminiClient,
): Promise<CoverLetterGenerateResult> {
  const parsed = parseValidation(generateSchema, input) as CoverLetterGenerateInput;
  const client = geminiClient ?? getDefaultGeminiClient();

  // 경력 + 스킬 조회
  const [experiences, skills] = await Promise.all([
    prisma.experience.findMany({
      where: { ownerId },
      orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
      select: {
        company: true,
        role: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
        summary: true,
        bulletsJson: true,
        metricsJson: true,
        techTags: true,
      },
    }),
    prisma.skill.findMany({
      where: { ownerId },
      orderBy: { order: "asc" },
      select: { name: true, category: true },
    }),
  ]);

  // RAG 검색: targetRole + targetCompany + JD 키워드
  const queryText = [
    parsed.targetCompany,
    parsed.targetRole,
    parsed.jobDescription?.slice(0, 500),
  ]
    .filter(Boolean)
    .join(" ");

  const referenceLetters = await searchSimilar(queryText);

  // Gemini 생성 또는 Fallback
  const prompt = buildCoverLetterPrompt(
    parsed,
    experiences,
    skills,
    referenceLetters,
  );

  const { result: contentMd, source } = await withGeminiFallback(
    client,
    async () => {
      const { text } = await client.generateText(prompt, {
        systemPrompt: COVER_LETTER_SYSTEM_PROMPT,
        temperature: COVER_LETTER_TEMPERATURE,
        maxOutputTokens: COVER_LETTER_MAX_OUTPUT_TOKENS,
      });
      return text;
    },
    () => buildFallbackCoverLetter(parsed, experiences, skills),
  );

  // 생성된 자소서 저장
  const title = `${parsed.targetCompany} ${parsed.targetRole} AI 초안`.slice(0, 120);
  const coverLetter = await service.create(ownerId, {
    title,
    targetCompany: parsed.targetCompany,
    targetRole: parsed.targetRole,
    contentMd,
    status: "DRAFT",
    isReference: false,
  });

  return { coverLetter, source };
}
