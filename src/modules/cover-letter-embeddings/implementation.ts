// ─────────────────────────────────────────────
// 자기소개서 임베딩 모듈 — 서비스 구현
// T97: 합격 자소서 RAG 파이프라인
// ─────────────────────────────────────────────

import { CoverLetterEmbeddingStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import type {
  CoverLetterEmbeddingPipelineService,
  CoverLetterEmbeddingPrismaClient,
  SimilarCoverLetterDto,
} from "@/modules/cover-letter-embeddings/interface";
import { CoverLetterEmbeddingServiceError } from "@/modules/cover-letter-embeddings/interface";
import type { GeminiClient } from "@/modules/gemini/interface";
import {
  getDefaultGeminiClient,
  withGeminiFallback,
} from "@/modules/gemini/implementation";

// ── 상수 ──

const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_SIMILAR_LIMIT = 5;
const MAX_SIMILAR_LIMIT = 20;
const DEFAULT_MIN_SCORE = 0.4;
const MAX_EMBEDDING_CONTENT_LENGTH = 9500;
const MAX_REBUILD_LIMIT = 100;
const MAX_ERROR_MESSAGE_LENGTH = 500;

// ── Zod 스키마 ──

const similarSearchSchema = z.object({
  limit: z.number().int().positive().max(MAX_SIMILAR_LIMIT).optional(),
  minScore: z.number().min(0).max(1).optional(),
});

type NormalizedSimilarSearchInput = {
  limit: number;
  minScore: number;
};

type SimilarQueryRow = {
  coverLetterId: string;
  score: number | string | Prisma.Decimal;
};

// ── 헬퍼 ──

/** 자기소개서 필드를 임베딩용 텍스트로 조합 */
export function buildCoverLetterEmbeddingContent(letter: {
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  contentMd: string;
}): string {
  const parts: string[] = [letter.title];

  if (letter.targetCompany) {
    parts.push(`회사: ${letter.targetCompany}`);
  }
  if (letter.targetRole) {
    parts.push(`직무: ${letter.targetRole}`);
  }

  parts.push(letter.contentMd);

  return parts.join("\n").slice(0, MAX_EMBEDDING_CONTENT_LENGTH);
}

/**
 * Gemini 미설정 시 결정적 벡터 생성 (reproducible)
 * note-embeddings의 buildDeterministicEmbeddingVector와 동일 로직
 */
export function buildDeterministicEmbeddingVector(
  content: string,
  dimensions = DEFAULT_EMBEDDING_DIMENSIONS,
): number[] {
  const vector = new Array(Math.max(1, dimensions)).fill(0) as number[];
  const normalized = content.trim().toLowerCase();

  if (!normalized) {
    return vector;
  }

  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);
    const offset = (code * 31 + index * 17) % vector.length;
    vector[offset] += (code % 97) / 100;
  }

  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function buildVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, MAX_ERROR_MESSAGE_LENGTH);
  }
  return String(error).slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

function toSafeScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(6));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return Number(parsed.toFixed(6));
    }
  }
  if (value instanceof Prisma.Decimal) {
    return Number(value.toFixed(6));
  }
  return 0;
}

function parseSimilarSearchInput(
  input: unknown,
): NormalizedSimilarSearchInput {
  const parsed = similarSearchSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new CoverLetterEmbeddingServiceError(
      "VALIDATION_ERROR",
      422,
      "유사도 검색 입력값이 올바르지 않습니다.",
    );
  }
  return {
    limit: parsed.data.limit ?? DEFAULT_SIMILAR_LIMIT,
    minScore: parsed.data.minScore ?? DEFAULT_MIN_SCORE,
  };
}

// ── DB 조작 ──

async function upsertPendingEmbedding(
  prisma: CoverLetterEmbeddingPrismaClient,
  coverLetterId: string,
  content: string,
) {
  const existing = await prisma.coverLetterEmbedding.findFirst({
    where: { coverLetterId, chunkIndex: 0 },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });

  if (existing) {
    await prisma.coverLetterEmbedding.update({
      where: { id: existing.id },
      data: {
        content,
        status: CoverLetterEmbeddingStatus.PENDING,
        lastEmbeddedAt: null,
        error: null,
      },
      select: { id: true },
    });
    return;
  }

  await prisma.coverLetterEmbedding.create({
    data: {
      coverLetterId,
      chunkIndex: 0,
      content,
      status: CoverLetterEmbeddingStatus.PENDING,
    },
    select: { id: true },
  });
}

async function applyEmbeddingVector(
  prisma: CoverLetterEmbeddingPrismaClient,
  embeddingId: string,
  vector: number[],
) {
  const vectorLiteral = buildVectorLiteral(vector);
  await prisma.$executeRaw`
    UPDATE "cover_letter_embeddings"
       SET "embedding" = ${Prisma.raw(`'${vectorLiteral}'::vector`)},
           "status" = 'SUCCEEDED',
           "lastEmbeddedAt" = CURRENT_TIMESTAMP,
           "error" = NULL,
           "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = ${embeddingId}
  `;
}

async function markEmbeddingFailed(
  prisma: CoverLetterEmbeddingPrismaClient,
  embeddingId: string,
  error: unknown,
) {
  await prisma.coverLetterEmbedding.update({
    where: { id: embeddingId },
    data: {
      status: CoverLetterEmbeddingStatus.FAILED,
      error: normalizeErrorMessage(error),
    },
    select: { id: true },
  });
}

/** Gemini + fallback으로 임베딩 벡터 생성 */
async function generateEmbeddingVector(
  geminiClient: GeminiClient,
  content: string,
): Promise<number[]> {
  const { result } = await withGeminiFallback(
    geminiClient,
    async () => {
      const { embedding } = await geminiClient.generateEmbedding(content);
      return embedding;
    },
    () => buildDeterministicEmbeddingVector(content),
  );
  return result;
}

/**
 * 쿼리 텍스트 임베딩 → 코사인 유사도로 합격 자소서 검색
 * NoteEmbedding과 달리 쿼리 벡터를 직접 생성하여 비교
 */
async function findSimilarByQueryVector(
  prisma: CoverLetterEmbeddingPrismaClient,
  ownerId: string,
  queryVector: number[],
  input: NormalizedSimilarSearchInput,
): Promise<SimilarQueryRow[]> {
  const vectorLiteral = buildVectorLiteral(queryVector);
  return prisma.$queryRaw<SimilarQueryRow[]>(Prisma.sql`
    SELECT
      cl."id" AS "coverLetterId",
      GREATEST(
        0,
        LEAST(
          1,
          1 - (cle."embedding" <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)})
        )
      )::double precision AS "score"
    FROM "cover_letter_embeddings" AS cle
    JOIN "cover_letters" AS cl
      ON cl."id" = cle."coverLetterId"
    WHERE cl."ownerId" = ${ownerId}
      AND cl."isReference" = true
      AND cle."chunkIndex" = 0
      AND cle."status" = ${CoverLetterEmbeddingStatus.SUCCEEDED}
      AND cle."embedding" IS NOT NULL
      AND (1 - (cle."embedding" <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)})) >= ${input.minScore}
    ORDER BY cle."embedding" <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)} ASC
    LIMIT ${input.limit}
  `);
}

// ── 서비스 팩토리 ──

export function createCoverLetterEmbeddingPipelineService(deps: {
  prisma: CoverLetterEmbeddingPrismaClient;
  geminiClient?: GeminiClient;
}): CoverLetterEmbeddingPipelineService {
  const { prisma } = deps;
  const geminiClient = deps.geminiClient ?? getDefaultGeminiClient();

  return {
    async rebuildForOwner(ownerId) {
      const letters = await prisma.coverLetter.findMany({
        where: { ownerId, isReference: true },
        select: {
          id: true,
          title: true,
          targetCompany: true,
          targetRole: true,
          contentMd: true,
        },
        take: MAX_REBUILD_LIMIT,
        orderBy: { updatedAt: "desc" },
      });

      if (letters.length === 0) {
        return { scheduled: 0, succeeded: 0, failed: 0, coverLetterIds: [] };
      }

      // Phase 1: PENDING 임베딩 upsert
      for (const letter of letters) {
        const content = buildCoverLetterEmbeddingContent(letter);
        await upsertPendingEmbedding(prisma, letter.id, content);
      }

      // Phase 2: 벡터 생성 + 적용
      let succeeded = 0;
      let failed = 0;

      for (const letter of letters) {
        const embedding = await prisma.coverLetterEmbedding.findFirst({
          where: {
            coverLetterId: letter.id,
            chunkIndex: 0,
            status: CoverLetterEmbeddingStatus.PENDING,
          },
          select: { id: true, content: true },
        });
        if (!embedding) continue;

        try {
          const vector = await generateEmbeddingVector(
            geminiClient,
            embedding.content,
          );
          await applyEmbeddingVector(prisma, embedding.id, vector);
          succeeded += 1;
        } catch (error) {
          await markEmbeddingFailed(prisma, embedding.id, error);
          failed += 1;
        }
      }

      return {
        scheduled: letters.length,
        succeeded,
        failed,
        coverLetterIds: letters.map((l) => l.id),
      };
    },

    async embedSingle(ownerId, coverLetterId) {
      const letter = await prisma.coverLetter.findFirst({
        where: { id: coverLetterId, ownerId },
        select: {
          id: true,
          title: true,
          targetCompany: true,
          targetRole: true,
          contentMd: true,
        },
      });

      if (!letter) {
        throw new CoverLetterEmbeddingServiceError(
          "NOT_FOUND",
          404,
          "자기소개서를 찾을 수 없습니다.",
        );
      }

      const content = buildCoverLetterEmbeddingContent(letter);
      await upsertPendingEmbedding(prisma, letter.id, content);

      const embedding = await prisma.coverLetterEmbedding.findFirst({
        where: {
          coverLetterId: letter.id,
          chunkIndex: 0,
          status: CoverLetterEmbeddingStatus.PENDING,
        },
        select: { id: true, content: true },
      });

      if (!embedding) {
        return {
          scheduled: 1,
          succeeded: 0,
          failed: 1,
          coverLetterIds: [letter.id],
        };
      }

      try {
        const vector = await generateEmbeddingVector(
          geminiClient,
          embedding.content,
        );
        await applyEmbeddingVector(prisma, embedding.id, vector);
        return {
          scheduled: 1,
          succeeded: 1,
          failed: 0,
          coverLetterIds: [letter.id],
        };
      } catch (error) {
        await markEmbeddingFailed(prisma, embedding.id, error);
        return {
          scheduled: 1,
          succeeded: 0,
          failed: 1,
          coverLetterIds: [letter.id],
        };
      }
    },

    async searchSimilarByQuery(ownerId, queryText, input) {
      const normalized = parseSimilarSearchInput(input);

      // 쿼리 텍스트를 벡터로 변환
      const queryContent = queryText
        .trim()
        .slice(0, MAX_EMBEDDING_CONTENT_LENGTH);
      if (!queryContent) {
        return [];
      }

      const queryVector = await generateEmbeddingVector(
        geminiClient,
        queryContent,
      );

      // 코사인 유사도 검색
      const rows = await findSimilarByQueryVector(
        prisma,
        ownerId,
        queryVector,
        normalized,
      );

      if (rows.length === 0) {
        return [];
      }

      // 매칭된 자소서 상세 정보 조회
      const letterIds = rows.map((r) => r.coverLetterId);
      const letters = await prisma.coverLetter.findMany({
        where: { id: { in: letterIds } },
        select: {
          id: true,
          title: true,
          targetCompany: true,
          targetRole: true,
          contentMd: true,
        },
      });

      const letterMap = new Map(letters.map((l) => [l.id, l]));

      const results: SimilarCoverLetterDto[] = [];
      for (const row of rows) {
        const letter = letterMap.get(row.coverLetterId);
        if (!letter) continue;
        results.push({
          coverLetterId: letter.id,
          title: letter.title,
          targetCompany: letter.targetCompany,
          targetRole: letter.targetRole,
          contentMd: letter.contentMd,
          score: toSafeScore(row.score),
        });
      }

      return results;
    },
  };
}

/** isReference 토글 시 자동 임베딩 트리거 (fire-and-forget) */
export function queueEmbeddingForCoverLetter(
  service: CoverLetterEmbeddingPipelineService,
  ownerId: string,
  coverLetterId: string,
): void {
  service.embedSingle(ownerId, coverLetterId).catch((error) => {
    console.warn(
      "자기소개서 임베딩 자동 생성 실패:",
      error instanceof Error ? error.message : error,
    );
  });
}
