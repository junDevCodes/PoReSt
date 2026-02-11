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

type ResumeItemsRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const resumesService = createResumesService({ prisma });

export async function GET(_: Request, context: ResumeItemsRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const items = await resumesService.listResumeItemsForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: items });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

export async function POST(request: Request, context: ResumeItemsRouteContext) {
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
    const created = await resumesService.createResumeItem(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}
