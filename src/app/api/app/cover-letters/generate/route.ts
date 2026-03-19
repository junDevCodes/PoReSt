import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createCoverLetterErrorResponse,
  createCoverLetterInvalidJsonResponse,
  createCoverLetterPayloadTooLargeResponse,
  createCoverLettersService,
  generateCoverLetter,
} from "@/modules/cover-letters";
import { createCoverLetterEmbeddingPipelineService } from "@/modules/cover-letter-embeddings";

const service = createCoverLettersService({ prisma });
const embeddingService = createCoverLetterEmbeddingPipelineService({ prisma });

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createCoverLetterPayloadTooLargeResponse();
    }
    return createCoverLetterInvalidJsonResponse();
  }

  try {
    const ownerId = authResult.session.user.id;
    const result = await generateCoverLetter(
      service,
      prisma,
      ownerId,
      parsedBody.value,
      (queryText) => embeddingService.searchSimilarByQuery(ownerId, queryText),
    );
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return createCoverLetterErrorResponse(error);
  }
}
