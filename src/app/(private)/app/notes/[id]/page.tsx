import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotesService, isNoteServiceError } from "@/modules/notes";
import { NoteDetailClient } from "./NoteDetailClient";

type NoteDetailPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

const notesService = createNotesService({ prisma });

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const resolvedParams = await params;
  const noteId = resolvedParams.id;
  const session = await getServerSession(authOptions);
  const ownerId = session?.user?.id;

  if (!ownerId) {
    redirect(`/login?next=/app/notes/${noteId}`);
  }

  let noteData: Awaited<ReturnType<typeof notesService.getNoteForOwner>>;
  let edgeData: Awaited<ReturnType<typeof notesService.listEdgesForNoteForOwner>>;

  try {
    await notesService.generateCandidateEdgesForOwner(ownerId);
    noteData = await notesService.getNoteForOwner(ownerId, noteId);
    edgeData = await notesService.listEdgesForNoteForOwner(ownerId, noteId);
  } catch (error) {
    if (isNoteServiceError(error) && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <NoteDetailClient
      note={{
        id: noteData.id,
        notebookId: noteData.notebookId,
        visibility: noteData.visibility,
        title: noteData.title,
        contentMd: noteData.contentMd,
        summary: noteData.summary,
        tags: noteData.tags,
        updatedAt: noteData.updatedAt.toISOString(),
        notebook: {
          id: noteData.notebook.id,
          name: noteData.notebook.name,
        },
      }}
      initialEdges={edgeData.map((edge) => ({
        id: edge.id,
        fromId: edge.fromId,
        toId: edge.toId,
        relationType: edge.relationType,
        weight: edge.weight,
        status: edge.status,
        origin: edge.origin,
        reason: edge.reason,
        updatedAt: edge.updatedAt.toISOString(),
        from: {
          id: edge.from.id,
          title: edge.from.title,
        },
        to: {
          id: edge.to.id,
          title: edge.to.title,
        },
      }))}
    />
  );
}
