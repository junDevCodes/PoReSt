import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { reportServerError } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import {
  createInvalidJsonResponse,
  createNoteEmbeddingErrorResponse,
  createNoteEmbeddingPipelineService,
  createPayloadTooLargeResponse,
  isNoteEmbeddingServiceError,
} from "@/modules/note-embeddings";

const noteEmbeddingService = createNoteEmbeddingPipelineService({ prisma });

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createPayloadTooLargeResponse();
    }
    return createInvalidJsonResponse();
  }

  try {
    const result = await noteEmbeddingService.rebuildForOwner(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (!isNoteEmbeddingServiceError(error)) {
      await reportServerError(
        {
          request,
          scope: "api.notes.embeddings.rebuild",
          userId: authResult.session.user.id,
        },
        error,
      );
    }
    return createNoteEmbeddingErrorResponse(error);
  }
}

