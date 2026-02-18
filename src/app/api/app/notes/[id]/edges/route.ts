import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createNoteErrorResponse, createNotesService } from "@/modules/notes";

type NoteEdgesRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const notesService = createNotesService({ prisma });

export async function GET(_: Request, context: NoteEdgesRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const edges = await notesService.listEdgesForNoteForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: edges });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}

