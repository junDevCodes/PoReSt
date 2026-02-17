import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { reportServerError } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import {
  createNoteEmbeddingErrorResponse,
  createNoteEmbeddingPipelineService,
  isNoteEmbeddingServiceError,
} from "@/modules/note-embeddings";

type NoteSimilarRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const noteEmbeddingService = createNoteEmbeddingPipelineService({ prisma });

function parseQueryNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

export async function GET(request: Request, context: NoteSimilarRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const params = await context.params;
  const url = new URL(request.url);
  const limit = parseQueryNumber(url.searchParams.get("limit"));
  const minScore = parseQueryNumber(url.searchParams.get("minScore"));

  try {
    const data = await noteEmbeddingService.searchSimilarNotesForOwner(authResult.session.user.id, params.id, {
      limit,
      minScore,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (!isNoteEmbeddingServiceError(error)) {
      await reportServerError(
        {
          request,
          scope: "api.notes.similar",
          userId: authResult.session.user.id,
        },
        error,
      );
    }
    return createNoteEmbeddingErrorResponse(error);
  }
}
