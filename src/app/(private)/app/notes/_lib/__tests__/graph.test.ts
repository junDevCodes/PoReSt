import type { NoteEdgeDto } from "../detail";
import { buildNoteGraph } from "../graph";

describe("note graph helper", () => {
  it("노트 기준 연결 그래프를 구성해야 한다", () => {
    const noteId = "note-a";
    const edges: NoteEdgeDto[] = [
      {
        id: "edge-1",
        fromId: "note-a",
        toId: "note-b",
        relationType: "related",
        weight: 0.9,
        status: "CONFIRMED",
        origin: "MANUAL",
        reason: null,
        updatedAt: "2026-02-11T01:00:00.000Z",
        from: { id: "note-a", title: "A" },
        to: { id: "note-b", title: "B" },
      },
      {
        id: "edge-2",
        fromId: "note-c",
        toId: "note-a",
        relationType: "related",
        weight: 0.8,
        status: "CANDIDATE",
        origin: "AUTO",
        reason: null,
        updatedAt: "2026-02-11T02:00:00.000Z",
        from: { id: "note-c", title: "C" },
        to: { id: "note-a", title: "A" },
      },
      {
        id: "edge-3",
        fromId: "note-d",
        toId: "note-e",
        relationType: "related",
        weight: 0.7,
        status: "CONFIRMED",
        origin: "AUTO",
        reason: null,
        updatedAt: "2026-02-11T03:00:00.000Z",
        from: { id: "note-d", title: "D" },
        to: { id: "note-e", title: "E" },
      },
    ];

    const graph = buildNoteGraph(noteId, "A", edges);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.nodes.find((node) => node.id === noteId)?.kind).toBe("CENTER");
    expect(graph.nodes.find((node) => node.id === "note-b")?.kind).toBe("CONFIRMED");
    expect(graph.nodes.find((node) => node.id === "note-c")?.kind).toBe("CANDIDATE");
  });

  it("연결 엣지가 없어도 중심 노드는 유지해야 한다", () => {
    const graph = buildNoteGraph("note-a", "A", []);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]).toMatchObject({
      id: "note-a",
      kind: "CENTER",
    });
    expect(graph.edges).toHaveLength(0);
  });
});

