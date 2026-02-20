import { prisma } from "@/lib/prisma";
import { createNotesService } from "@/modules/notes";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import {
  serializeOwnerNoteList,
  serializeOwnerNotebookList,
} from "@/app/(private)/app/_lib/server-serializers";
import { NotesPageClient } from "./NotesPageClient";

const notesService = createNotesService({ prisma });

export default async function NotesPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/notes");

  const [notes, notebooks] = await Promise.all([
    notesService.listNotesForOwner(ownerId),
    notesService.listNotebooksForOwner(ownerId),
  ]);

  return (
    <NotesPageClient
      initialNotes={serializeOwnerNoteList(notes)}
      initialNotebooks={serializeOwnerNotebookList(notebooks)}
    />
  );
}
