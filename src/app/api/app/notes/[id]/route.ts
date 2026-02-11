import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createNoteErrorResponse,
  createNoteInvalidJsonResponse,
  createNotePayloadTooLargeResponse,
  createNotesService,
} from "@/modules/notes";

type NoteIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const notesService = createNotesService({ prisma });

export async function GET(_: Request, context: NoteIdRouteContext) {
  const authResult = await requireOwner();
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
  const authResult = await requireOwner();
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
    const updated = await notesService.updateNote(authResult.session.user.id, params.id, parsedBody.value);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: NoteIdRouteContext) {
  const authResult = await requireOwner();
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
