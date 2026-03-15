import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createNoteErrorResponse,
  createNoteInvalidJsonResponse,
  createNotePayloadTooLargeResponse,
  createNotesService,
} from "@/modules/notes";
import { createNoteEmbeddingPipelineService, queueEmbeddingAndEdgesForNote } from "@/modules/note-embeddings";

type NoteIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const notesService = createNotesService({ prisma });
const noteEmbeddingService = createNoteEmbeddingPipelineService({ prisma });

export async function GET(_: Request, context: NoteIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const note = await notesService.getNoteForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: note });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

export async function PUT(request: Request, context: NoteIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createNotePayloadTooLargeResponse();
    }
    return createNoteInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const ownerId = authResult.session.user.id;
    const updated = await notesService.updateNote(ownerId, params.id, parsedBody.value);
    queueEmbeddingAndEdgesForNote(
      noteEmbeddingService,
      (oid, nid, similar) => notesService.generateCandidateEdgesForNote(oid, nid, similar),
      ownerId,
      updated.id,
    );
    return NextResponse.json({ data: updated });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: NoteIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await notesService.deleteNote(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

