import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { Prisma, PrismaClient, Visibility } from "@prisma/client";
import ws from "ws";
import { createNotesService, type NotesServicePrismaClient } from "@/modules/notes";

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? "";
const ROLLBACK_ERROR_MESSAGE = "ROLLBACK_FOR_TEST";

const describeWithDatabase = TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase("notes service integration", () => {
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
    testFn: (service: ReturnType<typeof createNotesService>, tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    const rollbackError = new Error(ROLLBACK_ERROR_MESSAGE);

    try {
      await prisma.$transaction(async (tx) => {
        const service = createNotesService({ prisma: tx as NotesServicePrismaClient });
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
        email: `owner-notes-${suffix}@example.com`,
        isOwner: true,
      },
    });
  }

  async function createNotebook(tx: Prisma.TransactionClient, ownerId: string, name: string) {
    return tx.notebook.create({
      data: {
        ownerId,
        name,
      },
    });
  }

  it("노트 생성/목록/수정/삭제가 순서대로 동작해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `crud-${unique}`);
      const notebook = await createNotebook(tx, owner.id, `CS-${unique}`);

      const created = await service.createNote(owner.id, {
        notebookId: notebook.id,
        title: `노트-${unique}`,
        contentMd: "노트 본문",
        tags: ["Prisma", "Database"],
      });

      const listed = await service.listNotesForOwner(owner.id);
      expect(listed.some((item) => item.id === created.id)).toBe(true);

      const updated = await service.updateNote(owner.id, created.id, {
        title: `노트-수정-${unique}`,
        tags: ["prisma", "postgresql"],
        visibility: Visibility.PRIVATE,
      });

      expect(updated.title).toBe(`노트-수정-${unique}`);
      expect(updated.tags).toEqual(["prisma", "postgresql"]);

      const deleted = await service.deleteNote(owner.id, created.id);
      expect(deleted.id).toBe(created.id);

      await expect(service.getNoteForOwner(owner.id, created.id)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  it("검색은 q/tag/domain 조건을 적용해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `search-${unique}`);
      const notebookA = await createNotebook(tx, owner.id, `Backend-${unique}`);
      const notebookB = await createNotebook(tx, owner.id, `Infra-${unique}`);

      await service.createNote(owner.id, {
        notebookId: notebookA.id,
        title: "Prisma 트랜잭션 정리",
        contentMd: "데이터 무결성과 롤백 전략",
        tags: ["prisma", "transaction"],
      });

      await service.createNote(owner.id, {
        notebookId: notebookB.id,
        title: "Kubernetes 기본",
        contentMd: "오케스트레이션 개념",
        tags: ["k8s", "infra"],
      });

      const byKeyword = await service.searchNotesForOwner(owner.id, { q: "Prisma" });
      expect(byKeyword).toHaveLength(1);

      const byTag = await service.searchNotesForOwner(owner.id, { tag: "infra" });
      expect(byTag).toHaveLength(1);

      const byDomain = await service.searchNotesForOwner(owner.id, { domain: "Backend" });
      expect(byDomain).toHaveLength(1);
    });
  });

  it("다른 오너의 노트를 수정하려고 하면 403을 반환해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerA = await createOwner(tx, `owner-a-${unique}`);
      const ownerB = await createOwner(tx, `owner-b-${unique}`);
      const notebook = await createNotebook(tx, ownerA.id, `Network-${unique}`);

      const note = await service.createNote(ownerA.id, {
        notebookId: notebook.id,
        title: `노트-${unique}`,
        contentMd: "본문",
      });

      await expect(
        service.updateNote(ownerB.id, note.id, {
          title: "수정 시도",
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });
  });

  it("태그 유사도 기반 후보 엣지 생성 후 confirm/reject 상태 전이가 가능해야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `edges-${unique}`);
      const notebook = await createNotebook(tx, owner.id, `Algo-${unique}`);

      const noteA = await service.createNote(owner.id, {
        notebookId: notebook.id,
        title: `노트A-${unique}`,
        contentMd: "본문 A",
        tags: ["graph", "tree", "dp"],
      });

      const noteB = await service.createNote(owner.id, {
        notebookId: notebook.id,
        title: `노트B-${unique}`,
        contentMd: "본문 B",
        tags: ["graph", "tree", "dp", "bfs"],
      });

      const noteC = await service.createNote(owner.id, {
        notebookId: notebook.id,
        title: `노트C-${unique}`,
        contentMd: "본문 C",
        tags: ["graph", "tree", "dp", "dfs"],
      });

      void noteA;
      void noteB;
      void noteC;

      const generated = await service.generateCandidateEdgesForOwner(owner.id);
      expect(generated.length).toBeGreaterThanOrEqual(2);

      const first = generated[0];
      const second = generated[1];

      const confirmed = await service.confirmEdgeForOwner(owner.id, { edgeId: first.id });
      expect(confirmed.status).toBe("CONFIRMED");

      const rejected = await service.rejectEdgeForOwner(owner.id, { edgeId: second.id });
      expect(rejected.status).toBe("REJECTED");

      const remainingCandidates = await service.listCandidateEdgesForOwner(owner.id);
      expect(remainingCandidates.find((edge) => edge.id === first.id)).toBeUndefined();
      expect(remainingCandidates.find((edge) => edge.id === second.id)).toBeUndefined();
    });
  });

  it("동일 도메인(노트북) 노트 쌍은 가중치 보정을 받아야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `domain-${unique}`);
      const notebookA = await createNotebook(tx, owner.id, `Domain-A-${unique}`);
      const notebookB = await createNotebook(tx, owner.id, `Domain-B-${unique}`);

      const noteA1 = await service.createNote(owner.id, {
        notebookId: notebookA.id,
        title: `노트A1-${unique}`,
        contentMd: "본문 A1",
        tags: ["graph", "tree", "dp", "bfs"],
      });

      const noteA2 = await service.createNote(owner.id, {
        notebookId: notebookA.id,
        title: `노트A2-${unique}`,
        contentMd: "본문 A2",
        tags: ["graph", "tree", "dp", "bfs", "memo"],
      });

      const noteB1 = await service.createNote(owner.id, {
        notebookId: notebookB.id,
        title: `노트B1-${unique}`,
        contentMd: "본문 B1",
        tags: ["graph", "tree", "dp", "bfs", "queue"],
      });

      const generated = await service.generateCandidateEdgesForOwner(owner.id);
      const pairKey = (left: string, right: string) => [left, right].sort().join(":");

      const sameDomainPair = pairKey(noteA1.id, noteA2.id);
      const crossDomainPair = pairKey(noteA1.id, noteB1.id);

      const edgeByPair = new Map<string, (typeof generated)[number]>();
      for (const edge of generated) {
        edgeByPair.set(pairKey(edge.fromId, edge.toId), edge);
      }

      const sameDomainEdge = edgeByPair.get(sameDomainPair);
      const crossDomainEdge = edgeByPair.get(crossDomainPair);

      expect(sameDomainEdge).toBeDefined();
      expect(crossDomainEdge).toBeDefined();
      expect((sameDomainEdge?.weight ?? 0)).toBeGreaterThan(crossDomainEdge?.weight ?? 0);
    });
  });

  it("특정 노트 기준으로 CONFIRMED/CANDIDATE 엣지를 함께 조회할 수 있어야 한다", async () => {
    await runWithRollback(async (service, tx) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const owner = await createOwner(tx, `note-edges-${unique}`);
      const notebook = await createNotebook(tx, owner.id, `Edge-${unique}`);

      const noteA = await service.createNote(owner.id, {
        notebookId: notebook.id,
        title: `노트A-${unique}`,
        contentMd: "본문 A",
        tags: ["graph", "tree", "dp", "bfs", "sort"],
      });
      const noteB = await service.createNote(owner.id, {
        notebookId: notebook.id,
        title: `노트B-${unique}`,
        contentMd: "본문 B",
        tags: ["graph", "tree", "dp", "bfs", "memo"],
      });
      const noteC = await service.createNote(owner.id, {
        notebookId: notebook.id,
        title: `노트C-${unique}`,
        contentMd: "본문 C",
        tags: ["graph", "tree", "dp", "sort", "queue"],
      });

      void noteB;
      void noteC;

      const generated = await service.generateCandidateEdgesForOwner(owner.id);
      expect(generated).toHaveLength(2);

      await service.confirmEdgeForOwner(owner.id, { edgeId: generated[0].id });

      const noteEdges = await service.listEdgesForNoteForOwner(owner.id, noteA.id);

      expect(noteEdges.length).toBe(2);
      expect(noteEdges.filter((edge) => edge.status === "CONFIRMED")).toHaveLength(1);
      expect(noteEdges.filter((edge) => edge.status === "CANDIDATE")).toHaveLength(1);
      expect(
        noteEdges.every((edge) => edge.fromId === noteA.id || edge.toId === noteA.id),
      ).toBe(true);
    });
  });
});
