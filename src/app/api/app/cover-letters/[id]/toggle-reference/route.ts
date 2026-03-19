import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createCoverLetterErrorResponse,
  createCoverLettersService,
} from "@/modules/cover-letters";
import {
  createCoverLetterEmbeddingPipelineService,
  queueEmbeddingForCoverLetter,
} from "@/modules/cover-letter-embeddings";

type ToggleReferenceRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const service = createCoverLettersService({ prisma });
const embeddingService = createCoverLetterEmbeddingPipelineService({ prisma });

export async function POST(_: Request, context: ToggleReferenceRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const ownerId = authResult.session.user.id;
    const updated = await service.toggleReference(ownerId, params.id);

    // isReference=true 전환 시 자동 임베딩 트리거
    if (updated.isReference) {
      queueEmbeddingForCoverLetter(embeddingService, ownerId, updated.id);
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return createCoverLetterErrorResponse(error);
  }
}
