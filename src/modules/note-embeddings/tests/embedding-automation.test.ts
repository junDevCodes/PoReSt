import { NoteEmbeddingStatus } from "@prisma/client";
import {
  buildEmbeddingContent,
  buildDeterministicEmbeddingVector,
  createNoteEmbeddingPipelineService,
  queueEmbeddingForNote,
} from "@/modules/note-embeddings/implementation";
import type { GeminiClient } from "@/modules/gemini/interface";
import { GeminiClientError } from "@/modules/gemini/interface";

// ─── Gemini 클라이언트 mock ───
function createMockGeminiClient(overrides?: Partial<GeminiClient>): GeminiClient {
  return {
    isConfigured: jest.fn().mockReturnValue(true),
    generateEmbedding: jest.fn().mockResolvedValue({
      embedding: Array.from({ length: 1536 }, (_, i) => i * 0.001),
      dimensions: 1536,
    }),
    generateText: jest.fn().mockResolvedValue({
      text: "mock",
      model: "gemini-2.0-flash",
    }),
    ...overrides,
  };
}

function createUnconfiguredGeminiClient(): GeminiClient {
  return createMockGeminiClient({
    isConfigured: jest.fn().mockReturnValue(false),
  });
}

// ─── Prisma mock ───
function createMockPrisma() {
  return {
    note: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    noteEmbedding: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: "emb-1" }),
      update: jest.fn().mockResolvedValue({ id: "emb-1" }),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
}

describe("임베딩 자동화 (T80-2)", () => {
  // ─── buildEmbeddingContent ───
  describe("buildEmbeddingContent", () => {
    it("제목 + 태그 + 요약 + 본문을 조합해야 한다", () => {
      const content = buildEmbeddingContent({
        title: "Prisma ORM 가이드",
        tags: ["prisma", "orm", "database"],
        summary: "Prisma ORM 사용법 요약",
        contentMd: "Prisma는 Node.js와 TypeScript를 위한 ORM입니다.",
      });

      expect(content).toContain("Prisma ORM 가이드");
      expect(content).toContain("prisma, orm, database");
      expect(content).toContain("Prisma ORM 사용법 요약");
      expect(content).toContain("Prisma는 Node.js와 TypeScript를 위한 ORM입니다.");
    });

    it("태그가 없으면 태그 줄을 생략해야 한다", () => {
      const content = buildEmbeddingContent({
        title: "테스트 노트",
        tags: [],
        summary: null,
        contentMd: "본문 내용",
      });

      expect(content).toBe("테스트 노트\n본문 내용");
    });

    it("요약이 없으면 요약 줄을 생략해야 한다", () => {
      const content = buildEmbeddingContent({
        title: "제목",
        tags: ["tag1"],
        summary: null,
        contentMd: "본문",
      });

      expect(content).toBe("제목\ntag1\n본문");
    });

    it("9500자를 초과하면 절삭해야 한다", () => {
      const content = buildEmbeddingContent({
        title: "긴 노트",
        tags: [],
        summary: null,
        contentMd: "가".repeat(10000),
      });

      expect(content.length).toBeLessThanOrEqual(9500);
    });
  });

  // ─── rebuildForOwner (Gemini 경로) ───
  describe("rebuildForOwner — Gemini 통합", () => {
    it("Gemini 설정 시 AI 임베딩을 사용해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createMockGeminiClient();

      const mockNote = { id: "note-1", title: "테스트", contentMd: "본문", tags: ["tag"], summary: null };
      mockPrisma.note.findMany.mockResolvedValue([mockNote]);
      mockPrisma.noteEmbedding.findFirst.mockResolvedValue(null);
      mockPrisma.noteEmbedding.findMany.mockResolvedValue([
        { id: "emb-1", noteId: "note-1", chunkIndex: 0, content: "테스트\ntag\n본문", status: NoteEmbeddingStatus.PENDING },
      ]);

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.rebuildForOwner("owner-1", { noteIds: ["note-1"] });

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockGemini.generateEmbedding).toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it("Gemini 미설정 시 deterministic fallback을 사용해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createUnconfiguredGeminiClient();

      const mockNote = { id: "note-1", title: "테스트", contentMd: "본문", tags: [], summary: null };
      mockPrisma.note.findMany.mockResolvedValue([mockNote]);
      mockPrisma.noteEmbedding.findFirst.mockResolvedValue(null);
      mockPrisma.noteEmbedding.findMany.mockResolvedValue([
        { id: "emb-1", noteId: "note-1", chunkIndex: 0, content: "테스트\n본문", status: NoteEmbeddingStatus.PENDING },
      ]);

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.rebuildForOwner("owner-1", { noteIds: ["note-1"] });

      expect(result.succeeded).toBe(1);
      expect(mockGemini.generateEmbedding).not.toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it("Gemini API 에러(retryable) 시 fallback으로 전환해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createMockGeminiClient({
        generateEmbedding: jest.fn().mockRejectedValue(
          new GeminiClientError("API_ERROR", 502, "네트워크 오류", true),
        ),
      });

      const mockNote = { id: "note-1", title: "테스트", contentMd: "본문", tags: [], summary: null };
      mockPrisma.note.findMany.mockResolvedValue([mockNote]);
      mockPrisma.noteEmbedding.findFirst.mockResolvedValue(null);
      mockPrisma.noteEmbedding.findMany.mockResolvedValue([
        { id: "emb-1", noteId: "note-1", chunkIndex: 0, content: "테스트\n본문", status: NoteEmbeddingStatus.PENDING },
      ]);

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.rebuildForOwner("owner-1", { noteIds: ["note-1"] });

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("Gemini non-retryable 에러 시 FAILED로 기록해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createMockGeminiClient({
        generateEmbedding: jest.fn().mockRejectedValue(
          new GeminiClientError("INVALID_INPUT", 422, "입력 오류", false),
        ),
      });

      const mockNote = { id: "note-1", title: "테스트", contentMd: "본문", tags: [], summary: null };
      mockPrisma.note.findMany.mockResolvedValue([mockNote]);
      mockPrisma.noteEmbedding.findFirst.mockResolvedValue(null);
      mockPrisma.noteEmbedding.findMany.mockResolvedValue([
        { id: "emb-1", noteId: "note-1", chunkIndex: 0, content: "테스트\n본문", status: NoteEmbeddingStatus.PENDING },
      ]);

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.rebuildForOwner("owner-1", { noteIds: ["note-1"] });

      expect(result.failed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(mockPrisma.noteEmbedding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: NoteEmbeddingStatus.FAILED,
          }),
        }),
      );
    });
  });

  // ─── embedSingleNote ───
  describe("embedSingleNote", () => {
    it("단일 노트 임베딩을 성공적으로 생성해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createMockGeminiClient();

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-1",
        title: "단일 노트",
        contentMd: "본문 내용",
        tags: ["test"],
        summary: "요약",
      });
      mockPrisma.noteEmbedding.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "emb-1", noteId: "note-1", chunkIndex: 0, content: "단일 노트\ntest\n요약\n본문 내용", status: NoteEmbeddingStatus.PENDING });

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.embedSingleNote("owner-1", "note-1");

      expect(result.scheduled).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.noteIds).toEqual(["note-1"]);
      expect(mockGemini.generateEmbedding).toHaveBeenCalled();
    });

    it("존재하지 않는 노트는 빈 결과를 반환해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createMockGeminiClient();

      mockPrisma.note.findFirst.mockResolvedValue(null);

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.embedSingleNote("owner-1", "nonexistent");

      expect(result.scheduled).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(mockGemini.generateEmbedding).not.toHaveBeenCalled();
    });

    it("임베딩 생성 실패 시 FAILED 상태를 기록해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createMockGeminiClient({
        generateEmbedding: jest.fn().mockRejectedValue(
          new GeminiClientError("INVALID_INPUT", 422, "입력 오류", false),
        ),
      });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-1",
        title: "실패 노트",
        contentMd: "",
        tags: [],
        summary: null,
      });
      mockPrisma.noteEmbedding.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "emb-1", noteId: "note-1", chunkIndex: 0, content: "실패 노트\n", status: NoteEmbeddingStatus.PENDING });

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.embedSingleNote("owner-1", "note-1");

      expect(result.scheduled).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockPrisma.noteEmbedding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: NoteEmbeddingStatus.FAILED,
          }),
        }),
      );
    });

    it("Gemini 미설정 시 deterministic fallback으로 성공해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const mockGemini = createUnconfiguredGeminiClient();

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-1",
        title: "Fallback 노트",
        contentMd: "본문",
        tags: [],
        summary: null,
      });
      mockPrisma.noteEmbedding.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "emb-1", noteId: "note-1", chunkIndex: 0, content: "Fallback 노트\n본문", status: NoteEmbeddingStatus.PENDING });

      const service = createNoteEmbeddingPipelineService({
        prisma: mockPrisma as never,
        geminiClient: mockGemini,
      });

      const result = await service.embedSingleNote("owner-1", "note-1");

      expect(result.succeeded).toBe(1);
      expect(mockGemini.generateEmbedding).not.toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });
  });

  // ─── queueEmbeddingForNote ───
  describe("queueEmbeddingForNote", () => {
    it("fire-and-forget으로 embedSingleNote를 호출해야 한다", async () => {
      const mockService = {
        prepareRebuildForOwner: jest.fn(),
        rebuildForOwner: jest.fn(),
        embedSingleNote: jest.fn().mockResolvedValue({
          scheduled: 1, succeeded: 1, failed: 0, noteIds: ["note-1"],
        }),
        searchSimilarNotesForOwner: jest.fn(),
      };

      queueEmbeddingForNote(mockService, "owner-1", "note-1");

      // fire-and-forget이므로 Promise 해소를 대기
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockService.embedSingleNote).toHaveBeenCalledWith("owner-1", "note-1");
    });

    it("embedSingleNote 실패 시 에러를 삼키고 warn 로그를 남겨야 한다", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const mockService = {
        prepareRebuildForOwner: jest.fn(),
        rebuildForOwner: jest.fn(),
        embedSingleNote: jest.fn().mockRejectedValue(new Error("DB 연결 실패")),
        searchSimilarNotesForOwner: jest.fn(),
      };

      queueEmbeddingForNote(mockService, "owner-1", "note-1");

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        "임베딩 자동 생성 실패:",
        "DB 연결 실패",
      );

      consoleSpy.mockRestore();
    });
  });

  // ─── buildDeterministicEmbeddingVector (기존 호환) ───
  describe("buildDeterministicEmbeddingVector", () => {
    it("동일 입력에 대해 동일 벡터를 반환해야 한다", () => {
      const v1 = buildDeterministicEmbeddingVector("Prisma ORM 가이드");
      const v2 = buildDeterministicEmbeddingVector("Prisma ORM 가이드");

      expect(v1).toEqual(v2);
      expect(v1).toHaveLength(1536);
    });

    it("다른 입력에 대해 다른 벡터를 반환해야 한다", () => {
      const v1 = buildDeterministicEmbeddingVector("React 컴포넌트 설계");
      const v2 = buildDeterministicEmbeddingVector("PostgreSQL 인덱스 최적화");

      expect(v1).not.toEqual(v2);
    });

    it("빈 입력에 대해 영벡터를 반환해야 한다", () => {
      const v = buildDeterministicEmbeddingVector("");
      expect(v).toHaveLength(1536);
      expect(v.every((val) => val === 0)).toBe(true);
    });
  });
});
