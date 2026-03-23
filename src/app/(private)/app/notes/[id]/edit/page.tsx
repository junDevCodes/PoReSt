import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createNotesService, isNoteServiceError } from "@/modules/notes";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import {
  serializeOwnerNoteDetail,
  serializeOwnerNotebookList,
} from "@/app/(private)/app/_lib/server-serializers";
import { NoteEditPageClient } from "./NoteEditPageClient";

const notesService = createNotesService({ prisma });

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditNotePage({ params }: Props) {
  const { ownerId } = await getRequiredOwnerSession("/app/notes");
  const { id } = await params;

  let note;
  try {
    note = await notesService.getNoteForOwner(ownerId, id);
  } catch (err) {
    if (isNoteServiceError(err) && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const notebooks = await notesService.listNotebooksForOwner(ownerId);

  return (
    <NoteEditPageClient
      initialNote={serializeOwnerNoteDetail(note)}
      initialNotebooks={serializeOwnerNotebookList(notebooks)}
    />
  );
}
