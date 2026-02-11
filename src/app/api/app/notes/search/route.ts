import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createNoteErrorResponse, createNotesService } from "@/modules/notes";

const notesService = createNotesService({ prisma });

export async function GET(request: Request) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const tag = url.searchParams.get("tag") ?? undefined;
  const domain = url.searchParams.get("domain") ?? undefined;

  try {
    const notes = await notesService.searchNotesForOwner(authResult.session.user.id, {
      q,
      tag,
      domain,
    });
    return NextResponse.json({ data: notes });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}
