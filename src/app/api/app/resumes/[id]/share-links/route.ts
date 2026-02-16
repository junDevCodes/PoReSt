import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import {
  createResumeErrorResponse,
  createResumeInvalidJsonResponse,
  createResumePayloadTooLargeResponse,
  createResumesService,
  parseResumeShareLinkDeleteInput,
} from "@/modules/resumes";

type ResumeShareLinksRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const resumesService = createResumesService({ prisma });

export async function GET(_: Request, context: ResumeShareLinksRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const links = await resumesService.listResumeShareLinksForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: links });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

export async function POST(request: Request, context: ResumeShareLinksRouteContext) {
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
    const created = await resumesService.createResumeShareLink(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: ResumeShareLinksRouteContext) {
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
    const parsed = parseResumeShareLinkDeleteInput(parsedBody.value);
    const revoked = await resumesService.revokeResumeShareLink(
      authResult.session.user.id,
      params.id,
      parsed.shareLinkId,
    );
    return NextResponse.json({ data: revoked });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}
