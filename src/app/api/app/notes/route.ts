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
import { createNoteEmbeddingPipelineService, queueEmbeddingForNote } from "@/modules/note-embeddings";

const notesService = createNotesService({ prisma });
const noteEmbeddingService = createNoteEmbeddingPipelineService({ prisma });

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const notes = await notesService.listNotesForOwner(authResult.session.user.id);
    return NextResponse.json({ data: notes });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

export async function POST(request: Request) {
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
    const ownerId = authResult.session.user.id;
    const created = await notesService.createNote(ownerId, parsedBody.value);
    queueEmbeddingForNote(noteEmbeddingService, ownerId, created.id);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

