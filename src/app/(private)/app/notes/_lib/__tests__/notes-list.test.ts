import { buildNotebookSections, type OwnerNoteListItemDto } from "../list";

describe("notes list helper", () => {
  it("노트를 노트북별로 그룹핑하고 수정일 내림차순으로 정렬해야 한다", () => {
    const notes: OwnerNoteListItemDto[] = [
      {
        id: "note-1",
        notebookId: "nb-a",
        visibility: "PRIVATE",
        title: "A-오래된 노트",
        summary: null,
        tags: ["a"],
        updatedAt: "2026-02-10T01:00:00.000Z",
        notebook: { id: "nb-a", name: "Alpha" },
      },
      {
        id: "note-2",
        notebookId: "nb-b",
        visibility: "PRIVATE",
        title: "B-노트",
        summary: null,
        tags: ["b"],
        updatedAt: "2026-02-11T01:00:00.000Z",
        notebook: { id: "nb-b", name: "Beta" },
      },
      {
        id: "note-3",
        notebookId: "nb-a",
        visibility: "PUBLIC",
        title: "A-최신 노트",
        summary: null,
        tags: ["a", "new"],
        updatedAt: "2026-02-11T02:00:00.000Z",
        notebook: { id: "nb-a", name: "Alpha" },
      },
    ];

    const sections = buildNotebookSections(notes);

    expect(sections).toHaveLength(2);
    expect(sections[0].notebook.name).toBe("Alpha");
    expect(sections[0].notes.map((item) => item.id)).toEqual(["note-3", "note-1"]);
    expect(sections[1].notebook.name).toBe("Beta");
    expect(sections[1].notes.map((item) => item.id)).toEqual(["note-2"]);
  });

  it("입력이 비어 있으면 빈 배열을 반환해야 한다", () => {
    const sections = buildNotebookSections([]);
    expect(sections).toEqual([]);
  });
});
