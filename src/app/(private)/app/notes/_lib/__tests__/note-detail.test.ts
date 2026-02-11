import { splitEdgesByStatus, type NoteEdgeDto } from "../detail";

describe("note detail helper", () => {
  it("노트 기준으로 CONFIRMED와 CANDIDATE를 분리해야 한다", () => {
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
        fromId: "note-b",
        toId: "note-c",
        relationType: "related",
        weight: 0.7,
        status: "CANDIDATE",
        origin: "AUTO",
        reason: null,
        updatedAt: "2026-02-11T03:00:00.000Z",
        from: { id: "note-b", title: "B" },
        to: { id: "note-c", title: "C" },
      },
    ];

    const result = splitEdgesByStatus(noteId, edges);

    expect(result.confirmed.map((item) => item.edge.id)).toEqual(["edge-1"]);
    expect(result.candidates.map((item) => item.edge.id)).toEqual(["edge-2"]);
    expect(result.confirmed[0].counterpart.id).toBe("note-b");
    expect(result.candidates[0].counterpart.id).toBe("note-c");
  });
});
