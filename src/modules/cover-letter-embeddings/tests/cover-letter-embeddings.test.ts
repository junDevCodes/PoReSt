import { CoverLetterEmbeddingServiceError } from "@/modules/cover-letter-embeddings/interface";
import {
  buildCoverLetterEmbeddingContent,
  buildDeterministicEmbeddingVector,
  createCoverLetterEmbeddingPipelineService,
} from "@/modules/cover-letter-embeddings/implementation";
import type { GeminiClient } from "@/modules/gemini/interface";

// ─── Mock Gemini Client ───

function createMockGeminiClient(configured = true): GeminiClient {
  return {
    isConfigured: () => configured,
    generateEmbedding: jest.fn().mockResolvedValue({
      embedding: new Array(1536).fill(0.01),
      dimensions: 1536,
    }),
    generateText: jest.fn().mockResolvedValue({
      text: "테스트 응답",
      model: "gemini-2.0-flash",
    }),
  };
}

// ─── Mock Prisma ───

function createMockPrisma() {
  return {
    coverLetter: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    coverLetterEmbedding: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "emb-1" }),
      update: jest.fn().mockResolvedValue({ id: "emb-1" }),
    },
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    $queryRaw: jest.fn().mockResolvedValue([]),
  } as unknown as Parameters<
    typeof createCoverLetterEmbeddingPipelineService
  >[0]["prisma"];
}

// ─── buildCoverLetterEmbeddingContent ───

describe("buildCoverLetterEmbeddingContent", () => {
  it("제목과 본문을 결합해야 한다", () => {
    const result = buildCoverLetterEmbeddingContent({
      title: "테스트 자소서",
      targetCompany: null,
      targetRole: null,
      contentMd: "본문 내용입니다",
    });

    expect(result).toContain("테스트 자소서");
    expect(result).toContain("본문 내용입니다");
  });

  it("회사/직무 정보를 포함해야 한다", () => {
    const result = buildCoverLetterEmbeddingContent({
      title: "자소서",
      targetCompany: "네이버",
      targetRole: "프론트엔드",
      contentMd: "내용",
    });

    expect(result).toContain("회사: 네이버");
    expect(result).toContain("직무: 프론트엔드");
  });

  it("9500자 이내로 자른다", () => {
    const longContent = "A".repeat(20000);
    const result = buildCoverLetterEmbeddingContent({
      title: "자소서",
      targetCompany: null,
      targetRole: null,
      contentMd: longContent,
    });

    expect(result.length).toBeLessThanOrEqual(9500);
  });
});

// ─── buildDeterministicEmbeddingVector ───

describe("buildDeterministicEmbeddingVector", () => {
  it("1536차원 벡터를 반환해야 한다", () => {
    const vector = buildDeterministicEmbeddingVector("테스트 내용");
    expect(vector).toHaveLength(1536);
  });

  it("같은 입력에 같은 벡터를 반환해야 한다 (결정적)", () => {
    const v1 = buildDeterministicEmbeddingVector("동일 입력");
    const v2 = buildDeterministicEmbeddingVector("동일 입력");
    expect(v1).toEqual(v2);
  });

  it("다른 입력에 다른 벡터를 반환해야 한다", () => {
    const v1 = buildDeterministicEmbeddingVector("입력 A");
    const v2 = buildDeterministicEmbeddingVector("입력 B");
    expect(v1).not.toEqual(v2);
  });

  it("빈 입력에 영벡터를 반환해야 한다", () => {
    const vector = buildDeterministicEmbeddingVector("");
    expect(vector.every((v) => v === 0)).toBe(true);
  });

  it("정규화된 벡터여야 한다 (크기 ≈ 1)", () => {
    const vector = buildDeterministicEmbeddingVector("정규화 테스트");
    const magnitude = Math.sqrt(
      vector.reduce((sum, v) => sum + v * v, 0),
    );
    expect(magnitude).toBeCloseTo(1, 3);
  });
});

// ─── CoverLetterEmbeddingPipelineService ───

describe("CoverLetterEmbeddingPipelineService", () => {
  describe("rebuildForOwner", () => {
    it("합격 자소서가 없으면 빈 결과를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const gemini = createMockGeminiClient();
      const service = createCoverLetterEmbeddingPipelineService({
        prisma,
        geminiClient: gemini,
      });

      const result = await service.rebuildForOwner("owner-1");

      expect(result.scheduled).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.coverLetterIds).toEqual([]);
    });

    it("합격 자소서가 있으면 임베딩을 생성해야 한다", async () => {
      const prisma = createMockPrisma();
      const gemini = createMockGeminiClient();

      (prisma.coverLetter.findMany as jest.Mock).mockResolvedValue([
        {
          id: "cl-1",
          title: "합격 자소서",
          targetCompany: "A사",
          targetRole: "개발자",
          contentMd: "합격 내용",
        },
      ]);
      (prisma.coverLetterEmbedding.findFirst as jest.Mock).mockResolvedValue({
        id: "emb-1",
        content: "합격 자소서\n회사: A사\n직무: 개발자\n합격 내용",
      });

      const service = createCoverLetterEmbeddingPipelineService({
        prisma,
        geminiClient: gemini,
      });

      const result = await service.rebuildForOwner("owner-1");

      expect(result.scheduled).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
    });

    it("Gemini 미설정 시 fallback 벡터를 사용해야 한다", async () => {
      const prisma = createMockPrisma();
      const gemini = createMockGeminiClient(false);

      (prisma.coverLetter.findMany as jest.Mock).mockResolvedValue([
        {
          id: "cl-1",
          title: "자소서",
          targetCompany: null,
          targetRole: null,
          contentMd: "내용",
        },
      ]);
      (prisma.coverLetterEmbedding.findFirst as jest.Mock).mockResolvedValue({
        id: "emb-1",
        content: "자소서\n내용",
      });

      const service = createCoverLetterEmbeddingPipelineService({
        prisma,
        geminiClient: gemini,
      });

      const result = await service.rebuildForOwner("owner-1");

      expect(result.succeeded).toBe(1);
      expect(gemini.generateEmbedding).not.toHaveBeenCalled();
    });
  });

  describe("embedSingle", () => {
    it("존재하지 않는 자소서는 NOT_FOUND를 발생시켜야 한다", async () => {
      const prisma = createMockPrisma();
      const gemini = createMockGeminiClient();
      const service = createCoverLetterEmbeddingPipelineService({
        prisma,
        geminiClient: gemini,
      });

      await expect(
        service.embedSingle("owner-1", "nonexist"),
      ).rejects.toThrow(CoverLetterEmbeddingServiceError);
    });

    it("단일 자소서 임베딩을 생성해야 한다", async () => {
      const prisma = createMockPrisma();
      const gemini = createMockGeminiClient();

      (prisma.coverLetter.findFirst as jest.Mock).mockResolvedValue({
        id: "cl-1",
        title: "자소서",
        targetCompany: "B사",
        targetRole: "백엔드",
        contentMd: "내용",
      });
      (prisma.coverLetterEmbedding.findFirst as jest.Mock).mockResolvedValue({
        id: "emb-1",
        content: "자소서\n회사: B사\n직무: 백엔드\n내용",
      });

      const service = createCoverLetterEmbeddingPipelineService({
        prisma,
        geminiClient: gemini,
      });

      const result = await service.embedSingle("owner-1", "cl-1");

      expect(result.scheduled).toBe(1);
      expect(result.succeeded).toBe(1);
    });
  });

  describe("searchSimilarByQuery", () => {
    it("빈 쿼리는 빈 결과를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const gemini = createMockGeminiClient();
      const service = createCoverLetterEmbeddingPipelineService({
        prisma,
        geminiClient: gemini,
      });

      const result = await service.searchSimilarByQuery(
        "owner-1",
        "   ",
      );

      expect(result).toEqual([]);
    });

    it("유사한 자소서가 있으면 결과를 반환해야 한다", async () => {
      const prisma = createMockPrisma();
      const gemini = createMockGeminiClient();

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { coverLetterId: "cl-1", score: 0.85 },
      ]);
      (prisma.coverLetter.findMany as jest.Mock).mockResolvedValue([
        {
          id: "cl-1",
          title: "합격 자소서",
          targetCompany: "네이버",
          targetRole: "FE",
          contentMd: "합격 내용",
        },
      ]);

      const service = createCoverLetterEmbeddingPipelineService({
        prisma,
        geminiClient: gemini,
      });

      const result = await service.searchSimilarByQuery(
        "owner-1",
        "프론트엔드 개발자 네이버",
      );

      expect(result).toHaveLength(1);
      expect(result[0].coverLetterId).toBe("cl-1");
      expect(result[0].score).toBe(0.85);
    });
  });
});
