import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createResumeErrorResponse,
  createResumeInvalidJsonResponse,
  createResumePayloadTooLargeResponse,
  createResumesService,
} from "@/modules/resumes";

type ResumeItemRouteContext = {
  params: Promise<{ id: string; itemId: string }> | { id: string; itemId: string };
};

const resumesService = createResumesService({ prisma });

export async function PUT(request: Request, context: ResumeItemRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createResumePayloadTooLargeResponse();
    }
    return createResumeInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const updated = await resumesService.updateResumeItem(
      authResult.session.user.id,
      params.id,
      params.itemId,
      parsedBody.value,
    );
    return NextResponse.json({ data: updated });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: ResumeItemRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await resumesService.deleteResumeItem(
      authResult.session.user.id,
      params.id,
      params.itemId,
    );
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}
