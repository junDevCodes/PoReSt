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

const resumesService = createResumesService({ prisma });

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const resumes = await resumesService.listResumesForOwner(authResult.session.user.id);
    return NextResponse.json({ data: resumes });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

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
    const created = await resumesService.createResume(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

