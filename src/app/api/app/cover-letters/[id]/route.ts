import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createCoverLetterErrorResponse,
  createCoverLetterInvalidJsonResponse,
  createCoverLetterPayloadTooLargeResponse,
  createCoverLettersService,
} from "@/modules/cover-letters";

type CoverLetterIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const service = createCoverLettersService({ prisma });

export async function GET(_: Request, context: CoverLetterIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const coverLetter = await service.getForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: coverLetter });
  } catch (error) {
    return createCoverLetterErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: CoverLetterIdRouteContext) {
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
    const params = await context.params;
    const updated = await service.update(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: updated });
  } catch (error) {
    return createCoverLetterErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: CoverLetterIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await service.delete(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createCoverLetterErrorResponse(error);
  }
}
