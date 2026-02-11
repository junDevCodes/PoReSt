import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createNoteErrorResponse, createNotesService } from "@/modules/notes";

const notesService = createNotesService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const edges = await notesService.generateCandidateEdgesForOwner(authResult.session.user.id);
    return NextResponse.json({ data: edges });
  } catch (error) {
    return createNoteErrorResponse(error);
  }
}
