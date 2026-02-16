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

type NotebookIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const notesService = createNotesService({ prisma });

export async function GET(_: Request, context: NotebookIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const notebook = await notesService.getNotebookForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: notebook });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

export async function PUT(request: Request, context: NotebookIdRouteContext) {
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
    const updated = await notesService.updateNotebook(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: updated });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: NotebookIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await notesService.deleteNotebook(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}
