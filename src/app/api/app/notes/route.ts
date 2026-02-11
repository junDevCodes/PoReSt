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

const notesService = createNotesService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
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
    const created = await notesService.createNote(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}
