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

const notesService = createNotesService({ prisma });

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const notebooks = await notesService.listNotebooksForOwner(authResult.session.user.id);
    return NextResponse.json({ data: notebooks });
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
    const created = await notesService.createNotebook(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}
