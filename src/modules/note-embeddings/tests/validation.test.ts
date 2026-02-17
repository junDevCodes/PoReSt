import {
  buildDeterministicEmbeddingVector,
  createNoteEmbeddingPipelineService,
  type NoteEmbeddingServicePrismaClient,
} from "@/modules/note-embeddings";

function createMockPrisma(): NoteEmbeddingServicePrismaClient {
  return {
    note: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    noteEmbedding: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
  } as unknown as NoteEmbeddingServicePrismaClient;
}

describe("note embeddings validation", () => {
  it("동일 본문은 항상 동일한 임베딩 벡터를 생성해야 한다", () => {
    const a = buildDeterministicEmbeddingVector("PoReSt note embedding", 16);
    const b = buildDeterministicEmbeddingVector("PoReSt note embedding", 16);

    expect(a).toHaveLength(16);
    expect(a).toEqual(b);
  });

  it("재빌드 입력에서 noteIds 개수가 최대치를 넘으면 검증 에러를 반환해야 한다", async () => {
    const service = createNoteEmbeddingPipelineService({ prisma: createMockPrisma() });
    const tooManyIds = Array.from({ length: 201 }, (_, index) => `note-${index}`);

    await expect(service.prepareRebuildForOwner("owner-1", { noteIds: tooManyIds })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("유사도 검색 입력에서 minScore 범위를 벗어나면 검증 에러를 반환해야 한다", async () => {
    const service = createNoteEmbeddingPipelineService({ prisma: createMockPrisma() });

    await expect(
      service.searchSimilarNotesForOwner("owner-1", "note-1", {
        minScore: 1.5,
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });
});
