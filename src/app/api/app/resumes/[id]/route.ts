import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createResumeErrorResponse,
  createResumeInvalidJsonResponse,
  createResumePayloadTooLargeResponse,
  createResumesService,
} from "@/modules/resumes";

type ResumeIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const resumesService = createResumesService({ prisma });

export async function GET(_: Request, context: ResumeIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const resume = await resumesService.getResumeForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: resume });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

export async function PUT(request: Request, context: ResumeIdRouteContext) {
  const authResult = await requireAuth();
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
    const updated = await resumesService.updateResume(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: updated });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: ResumeIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await resumesService.deleteResume(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

