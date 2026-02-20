import type { SerializedOwnerNoteListItemDto } from "@/app/(private)/app/_lib/server-serializers";

export type OwnerNoteListItemDto = SerializedOwnerNoteListItemDto;

export type NotebookNoteSection = {
  notebook: {
    id: string;
    name: string;
  };
  notes: OwnerNoteListItemDto[];
};

function sortByUpdatedAtDesc(a: OwnerNoteListItemDto, b: OwnerNoteListItemDto) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function buildNotebookSections(notes: OwnerNoteListItemDto[]): NotebookNoteSection[] {
  const grouped = new Map<string, NotebookNoteSection>();

  for (const note of notes) {
    const existing = grouped.get(note.notebookId);
    if (existing) {
      existing.notes.push(note);
      continue;
    }

    grouped.set(note.notebookId, {
      notebook: {
        id: note.notebook.id,
        name: note.notebook.name,
      },
      notes: [note],
    });
  }

  const sections = Array.from(grouped.values());
  for (const section of sections) {
    section.notes.sort(sortByUpdatedAtDesc);
  }

  sections.sort((a, b) => a.notebook.name.localeCompare(b.notebook.name, "ko"));
  return sections;
}
