import {
  buildDeterministicEmbeddingVector,
  createNoteEmbeddingPipelineService,
  type NoteEmbeddingServicePrismaClient,
} from "@/modules/note-embeddings";

function createMockPrisma(): NoteEmbeddingServicePrismaClient {
  return {
    note: {
      findMany: jest.fn(),
    },
    noteEmbedding: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
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
});

