import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createResumeErrorResponse,
  createResumeInvalidJsonResponse,
  createResumePayloadTooLargeResponse,
  createResumesService,
  generateResumeDraft,
} from "@/modules/resumes";

const resumesService = createResumesService({ prisma });

export async function POST(request: Request) {
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
    const result = await generateResumeDraft(
      resumesService,
      prisma,
      authResult.session.user.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}
