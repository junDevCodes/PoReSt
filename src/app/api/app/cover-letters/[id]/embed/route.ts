import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createCoverLetterEmbeddingPipelineService,
  createCoverLetterEmbeddingErrorResponse,
} from "@/modules/cover-letter-embeddings";

type EmbedRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const embeddingService = createCoverLetterEmbeddingPipelineService({ prisma });

export async function POST(_: Request, context: EmbedRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const result = await embeddingService.embedSingle(
      authResult.session.user.id,
      params.id,
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    return createCoverLetterEmbeddingErrorResponse(error);
  }
}
