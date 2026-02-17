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

  it("기존 FAILED 상태도 재빌드 준비 시 PENDING으로 초기화되어야 한다", async () => {
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

  it("재빌드 실행 후 PENDING 임베딩은 SUCCEEDED로 전환되어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `run-${unique}`);
      const note = await createNote(tx, owner.id, `run-${unique}`, "실행 대상 본문");

      const result = await service.rebuildForOwner(owner.id, {
        noteIds: [note.id],
      });

      expect(result.scheduled).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);

      const embedding = await tx.noteEmbedding.findFirst({
        where: { noteId: note.id, chunkIndex: 0 },
        orderBy: [{ updatedAt: "desc" }],
      });

      expect(embedding).not.toBeNull();
      expect(embedding?.status).toBe(NoteEmbeddingStatus.SUCCEEDED);
      expect(embedding?.lastEmbeddedAt).not.toBeNull();
      expect(embedding?.error).toBeNull();
    });
  });

  it("유사도 검색은 기준 노트를 제외하고 점수 순으로 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `similar-${unique}`);

      const baseNote = await createNote(
        tx,
        owner.id,
        `base-${unique}`,
        "prisma transaction isolation level deadlock retry",
      );
      const nearNote = await createNote(
        tx,
        owner.id,
        `near-${unique}`,
        "prisma transaction isolation lock retry strategy",
      );
      const farNote = await createNote(
        tx,
        owner.id,
        `far-${unique}`,
        "react animation motion ui component styling",
      );

      await service.rebuildForOwner(owner.id, {
        noteIds: [baseNote.id, nearNote.id, farNote.id],
      });

      const similar = await service.searchSimilarNotesForOwner(owner.id, baseNote.id, {
        limit: 2,
        minScore: 0,
      });

      expect(similar).toHaveLength(2);
      expect(similar.some((item) => item.noteId === baseNote.id)).toBe(false);
      expect(similar.map((item) => item.noteId).sort()).toEqual([nearNote.id, farNote.id].sort());
      expect(similar[0].score).toBeGreaterThanOrEqual(similar[1].score);
    });
  });

  it("유사도 검색은 owner 범위를 넘는 노트를 포함하면 안 된다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);

      const noteA1 = await createNote(
        tx,
        ownerA.id,
        `a1-${unique}`,
        "postgres transaction lock timeout retry",
      );
      const noteA2 = await createNote(
        tx,
        ownerA.id,
        `a2-${unique}`,
        "postgres transaction lock strategy rollback",
      );
      const noteB1 = await createNote(
        tx,
        ownerB.id,
        `b1-${unique}`,
        "postgres transaction lock timeout retry",
      );

      await service.rebuildForOwner(ownerA.id, { noteIds: [noteA1.id, noteA2.id] });
      await service.rebuildForOwner(ownerB.id, { noteIds: [noteB1.id] });

      const similar = await service.searchSimilarNotesForOwner(ownerA.id, noteA1.id, {
        limit: 5,
        minScore: 0,
      });

      expect(similar.some((item) => item.noteId === noteB1.id)).toBe(false);
      expect(similar.some((item) => item.noteId === noteA2.id)).toBe(true);
    });
  });
});
