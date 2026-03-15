import { NoteEdgeOrigin, NoteEdgeStatus } from "@prisma/client";
import { createNotesService } from "@/modules/notes/implementation";
import type { EmbeddingSimilarityInput } from "@/modules/notes/interface";

// ─── Prisma mock ───
function createMockPrisma() {
  return {
    notebook: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    note: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    noteEdge: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
}

describe("자동 후보 엣지 (T80-6)", () => {
  // ─── generateCandidateEdgesForNote ───
  describe("generateCandidateEdgesForNote", () => {
    it("임베딩 유사 노트 기반 CANDIDATE 엣지를 생성해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      // 소스 노트
      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: ["typescript", "react"],
      });

      // 후보 노트
      mockPrisma.note.findMany.mockResolvedValue([
        { id: "note-b", notebookId: "nb-2", tags: ["typescript", "nextjs"] },
        { id: "note-c", notebookId: "nb-1", tags: ["react", "hooks"] },
      ]);

      // 기존 엣지 없음
      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([]) // 기존 엣지 조회
        .mockResolvedValue([]); // listEdgesForNoteForOwner

      // ensureNoteOwner용
      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      const similarNotes: EmbeddingSimilarityInput[] = [
        { noteId: "note-b", score: 0.82 },
        { noteId: "note-c", score: 0.75 },
      ];

      await service.generateCandidateEdgesForNote("owner-1", "note-a", similarNotes);

      expect(mockPrisma.noteEdge.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skipDuplicates: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              status: NoteEdgeStatus.CANDIDATE,
              origin: NoteEdgeOrigin.AUTO,
              relationType: "related",
            }),
          ]),
        }),
      );
    });

    it("빈 유사 노트 배열이면 빈 배열을 반환해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      const result = await service.generateCandidateEdgesForNote("owner-1", "note-a", []);

      expect(result).toEqual([]);
      expect(mockPrisma.note.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.noteEdge.createMany).not.toHaveBeenCalled();
    });

    it("소스 노트가 존재하지 않으면 빈 배열을 반환해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue(null);

      const result = await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.8 },
      ]);

      expect(result).toEqual([]);
      expect(mockPrisma.noteEdge.createMany).not.toHaveBeenCalled();
    });

    it("기존 엣지가 있는 쌍은 스킵해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: ["typescript"],
      });

      mockPrisma.note.findMany.mockResolvedValue([
        { id: "note-b", notebookId: "nb-2", tags: ["typescript"] },
        { id: "note-c", notebookId: "nb-2", tags: ["react"] },
      ]);

      // note-a ↔ note-b 엣지가 이미 존재
      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([{ fromId: "note-a", toId: "note-b" }])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.9 },
        { noteId: "note-c", score: 0.7 },
      ]);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      if (createManyCall) {
        const fromToIds = createManyCall.data.map((d: { fromId: string; toId: string }) => `${d.fromId}:${d.toId}`);
        expect(fromToIds).not.toContain("note-a:note-b");
      }
    });

    it("동일 도메인(노트북)일 때 가중치 보너스를 적용해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: [],
      });

      mockPrisma.note.findMany.mockResolvedValue([
        { id: "note-b", notebookId: "nb-1", tags: [] }, // 동일 노트북
      ]);

      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.6 },
      ]);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      expect(createManyCall).toBeDefined();
      // 0.6 + 0.1 보너스 = 0.7
      expect(createManyCall.data[0].weight).toBe(0.7);
      expect(createManyCall.data[0].reason).toContain("동일 도메인 가중치 적용");
    });

    it("MAX(임베딩, 태그) 가중치를 적용해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: ["typescript", "react", "nextjs"],
      });

      mockPrisma.note.findMany.mockResolvedValue([
        { id: "note-b", notebookId: "nb-2", tags: ["typescript", "react", "nextjs"] }, // Jaccard = 1.0
      ]);

      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.6 }, // 임베딩 0.6 < 태그 1.0
      ]);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      expect(createManyCall).toBeDefined();
      // MAX(0.6, 1.0) = 1.0
      expect(createManyCall.data[0].weight).toBe(1);
    });

    it("fromId < toId로 정규화해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      // noteId "z-note" > "a-note" → fromId="a-note", toId="z-note"
      mockPrisma.note.findFirst.mockResolvedValue({
        id: "z-note",
        notebookId: "nb-1",
        tags: [],
      });

      mockPrisma.note.findMany.mockResolvedValue([
        { id: "a-note", notebookId: "nb-2", tags: [] },
      ]);

      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "z-note",
        ownerId: "owner-1",
        deletedAt: null,
      });

      await service.generateCandidateEdgesForNote("owner-1", "z-note", [
        { noteId: "a-note", score: 0.8 },
      ]);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      expect(createManyCall).toBeDefined();
      expect(createManyCall.data[0].fromId).toBe("a-note");
      expect(createManyCall.data[0].toId).toBe("z-note");
    });

    it("삭제된 후보 노트는 스킵해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: [],
      });

      // findMany에 deletedAt: null 조건이 있으므로, 삭제된 노트는 반환되지 않음
      mockPrisma.note.findMany.mockResolvedValue([]); // note-b가 삭제됨 → 조회 안 됨

      mockPrisma.noteEdge.findMany.mockResolvedValue([]);

      const result = await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.9 },
      ]);

      expect(result).toEqual([]);
      expect(mockPrisma.noteEdge.createMany).not.toHaveBeenCalled();
    });

    it("reason에 임베딩 유사도를 포함해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: ["react"],
      });

      mockPrisma.note.findMany.mockResolvedValue([
        { id: "note-b", notebookId: "nb-2", tags: ["react", "hooks"] },
      ]);

      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.7654 },
      ]);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      expect(createManyCall).toBeDefined();
      expect(createManyCall.data[0].reason).toContain("임베딩 유사도: 0.7654");
      expect(createManyCall.data[0].reason).toContain("태그 교집합");
    });

    it("태그가 없는 노트 쌍에서도 임베딩 점수로 엣지를 생성해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: [],
      });

      mockPrisma.note.findMany.mockResolvedValue([
        { id: "note-b", notebookId: "nb-2", tags: [] },
      ]);

      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.85 },
      ]);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      expect(createManyCall).toBeDefined();
      expect(createManyCall.data[0].weight).toBe(0.85);
      expect(createManyCall.data[0].reason).not.toContain("태그 교집합");
    });

    it("가중치 상한은 1.0이어야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: ["a", "b", "c"],
      });

      mockPrisma.note.findMany.mockResolvedValue([
        { id: "note-b", notebookId: "nb-1", tags: ["a", "b", "c"] }, // 동일 노트북 + 동일 태그
      ]);

      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      await service.generateCandidateEdgesForNote("owner-1", "note-a", [
        { noteId: "note-b", score: 0.95 }, // 0.95 + 0.1 = 1.05 → cap to 1.0
      ]);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      expect(createManyCall).toBeDefined();
      expect(createManyCall.data[0].weight).toBeLessThanOrEqual(1);
    });

    it("상위 20개 후보만 저장해야 한다", async () => {
      const mockPrisma = createMockPrisma();
      const service = createNotesService({ prisma: mockPrisma as never });

      mockPrisma.note.findFirst.mockResolvedValue({
        id: "note-a",
        notebookId: "nb-1",
        tags: [],
      });

      const manyNotes = Array.from({ length: 25 }, (_, i) => ({
        id: `note-${i}`,
        notebookId: "nb-2",
        tags: [],
      }));
      mockPrisma.note.findMany.mockResolvedValue(manyNotes);

      mockPrisma.noteEdge.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      mockPrisma.note.findUnique.mockResolvedValue({
        id: "note-a",
        ownerId: "owner-1",
        deletedAt: null,
      });

      const similarNotes = manyNotes.map((n, i) => ({
        noteId: n.id,
        score: 0.5 + i * 0.01,
      }));

      await service.generateCandidateEdgesForNote("owner-1", "note-a", similarNotes);

      const createManyCall = mockPrisma.noteEdge.createMany.mock.calls[0]?.[0];
      expect(createManyCall).toBeDefined();
      expect(createManyCall.data.length).toBeLessThanOrEqual(20);
    });
  });

  // ─── queueEmbeddingAndEdgesForNote ───
  describe("queueEmbeddingAndEdgesForNote", () => {
    // 이 테스트는 note-embeddings 모듈의 함수를 테스트
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { queueEmbeddingAndEdgesForNote } = require("@/modules/note-embeddings/implementation");

    function createMockEmbeddingService() {
      return {
        prepareRebuildForOwner: jest.fn(),
        rebuildForOwner: jest.fn(),
        embedSingleNote: jest.fn().mockResolvedValue({
          scheduled: 1,
          succeeded: 1,
          failed: 0,
          noteIds: ["note-1"],
        }),
        searchSimilarNotesForOwner: jest.fn().mockResolvedValue([]),
      };
    }

    it("임베딩 성공 후 유사 노트 검색 및 엣지 콜백을 호출해야 한다", async () => {
      const mockService = createMockEmbeddingService();
      const mockCallback = jest.fn().mockResolvedValue([]);

      mockService.searchSimilarNotesForOwner.mockResolvedValue([
        { noteId: "note-2", title: "유사 노트", score: 0.8, summary: null, tags: [], notebook: { id: "nb-1", name: "NB" }, updatedAt: new Date() },
      ]);

      queueEmbeddingAndEdgesForNote(mockService, mockCallback, "owner-1", "note-1");

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockService.embedSingleNote).toHaveBeenCalledWith("owner-1", "note-1");
      expect(mockService.searchSimilarNotesForOwner).toHaveBeenCalledWith(
        "owner-1",
        "note-1",
        { limit: 10, minScore: 0.5 },
      );
      expect(mockCallback).toHaveBeenCalledWith(
        "owner-1",
        "note-1",
        [{ noteId: "note-2", score: 0.8 }],
      );
    });

    it("임베딩 실패 시 엣지 콜백을 호출하지 않아야 한다", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const mockService = createMockEmbeddingService();
      mockService.embedSingleNote.mockRejectedValue(new Error("DB 연결 실패"));
      const mockCallback = jest.fn();

      queueEmbeddingAndEdgesForNote(mockService, mockCallback, "owner-1", "note-1");

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCallback).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("임베딩 자동 생성 실패:", "DB 연결 실패");

      consoleSpy.mockRestore();
    });

    it("임베딩 succeeded=0이면 엣지 콜백을 호출하지 않아야 한다", async () => {
      const mockService = createMockEmbeddingService();
      mockService.embedSingleNote.mockResolvedValue({
        scheduled: 1,
        succeeded: 0,
        failed: 1,
        noteIds: ["note-1"],
      });
      const mockCallback = jest.fn();

      queueEmbeddingAndEdgesForNote(mockService, mockCallback, "owner-1", "note-1");

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("유사 노트가 없으면 엣지 콜백을 호출하지 않아야 한다", async () => {
      const mockService = createMockEmbeddingService();
      mockService.searchSimilarNotesForOwner.mockResolvedValue([]);
      const mockCallback = jest.fn();

      queueEmbeddingAndEdgesForNote(mockService, mockCallback, "owner-1", "note-1");

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockService.searchSimilarNotesForOwner).toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("엣지 콜백 실패 시 에러를 삼키고 warn 로그를 남겨야 한다", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const mockService = createMockEmbeddingService();
      mockService.searchSimilarNotesForOwner.mockResolvedValue([
        { noteId: "note-2", score: 0.8, title: "T", summary: null, tags: [], notebook: { id: "nb-1", name: "NB" }, updatedAt: new Date() },
      ]);
      const mockCallback = jest.fn().mockRejectedValue(new Error("엣지 생성 실패"));

      queueEmbeddingAndEdgesForNote(mockService, mockCallback, "owner-1", "note-1");

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith("자동 후보 엣지 생성 실패:", "엣지 생성 실패");

      consoleSpy.mockRestore();
    });

    it("edgeCallback이 null이면 엣지 생성을 스킵해야 한다", async () => {
      const mockService = createMockEmbeddingService();

      queueEmbeddingAndEdgesForNote(mockService, null, "owner-1", "note-1");

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockService.embedSingleNote).toHaveBeenCalled();
      expect(mockService.searchSimilarNotesForOwner).not.toHaveBeenCalled();
    });
  });
});
