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

const service = createCoverLettersService({ prisma });

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const coverLetters = await service.listForOwner(authResult.session.user.id);
    return NextResponse.json({ data: coverLetters });
  } catch (error) {
    return createCoverLetterErrorResponse(error);
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
      return createCoverLetterPayloadTooLargeResponse();
    }
    return createCoverLetterInvalidJsonResponse();
  }

  try {
    const created = await service.create(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createCoverLetterErrorResponse(error);
  }
}
