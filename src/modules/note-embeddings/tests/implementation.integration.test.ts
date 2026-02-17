import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { NoteEmbeddingStatus, Prisma, PrismaClient } from "@prisma/client";
import ws from "ws";
import {
  createNoteEmbeddingPipelineService,
  type NoteEmbeddingServicePrismaClient,
} from "@/modules/note-embeddings";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("note embedding pipeline integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }

    prisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: TEST_DATABASE_URL }),
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function runWithRollback(
    testFn: (service: ReturnType<typeof createNoteEmbeddingPipelineService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createNoteEmbeddingPipelineService({
          prisma: tx as NoteEmbeddingServicePrismaClient,
        });
        await testFn(service, tx);
        throw rollbackError;
      });
    } catch (error) {
      if (!(error instanceof Error && error.message === ROLLBACK_ERROR_MESSAGE)) {
        throw error;
      }
    }
  }

  async function createOwner(tx: Prisma.TransactionClient, suffix: string) {
    return tx.user.create({
      data: {
        email: `embedding-owner-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  async function createNote(tx: Prisma.TransactionClient, ownerId: string, suffix: string, content: string) {
    const notebook = await tx.notebook.create({
      data: {
        ownerId,
        name: `임베딩노트북-${suffix}`,
      },
    });

    return tx.note.create({
      data: {
        ownerId,
        notebookId: notebook.id,
        title: `임베딩노트-${suffix}`,
        contentMd: content,
        tags: ["embedding"],
      },
    });
  }

  it("재빌드 준비 시 note_embeddings를 PENDING 상태로 생성해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, unique);
      const note = await createNote(tx, owner.id, unique, "임베딩 대상 본문");

      const planned = await service.prepareRebuildForOwner(owner.id, {
        noteIds: [note.id],
      });

      expect(planned.scheduled).toBe(1);
      const embedding = await tx.noteEmbedding.findFirst({
        where: {
          noteId: note.id,
          chunkIndex: 0,
        },
      });

      expect(embedding).not.toBeNull();
      expect(embedding?.status).toBe(NoteEmbeddingStatus.PENDING);
      expect(embedding?.content).toContain("임베딩 대상 본문");
    });
  });

  it("기존 FAILED 상태는 재빌드 준비 시 PENDING으로 초기화되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `failed-${unique}`);
      const note = await createNote(tx, owner.id, `failed-${unique}`, "업데이트 대상 본문");

      await tx.noteEmbedding.create({
        data: {
          noteId: note.id,
          chunkIndex: 0,
          content: "오래된 본문",
          status: NoteEmbeddingStatus.FAILED,
          error: "모델 호출 실패",
        },
      });

      await service.prepareRebuildForOwner(owner.id, {
        noteIds: [note.id],
      });

      const latest = await tx.noteEmbedding.findFirst({
        where: { noteId: note.id, chunkIndex: 0 },
        orderBy: [{ updatedAt: "desc" }],
      });

      expect(latest?.status).toBe(NoteEmbeddingStatus.PENDING);
      expect(latest?.error).toBeNull();
      expect(latest?.content).toContain("업데이트 대상 본문");
    });
  });
});

