import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createFeedbackErrorResponse,
  createFeedbackInvalidJsonResponse,
  createFeedbackPayloadTooLargeResponse,
  createFeedbackService,
} from "@/modules/feedback";

const feedbackService = createFeedbackService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const list = await feedbackService.listFeedbackRequestsForOwner(authResult.session.user.id);
    return NextResponse.json({ data: list });
  } catch (error) {
    return createFeedbackErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createFeedbackPayloadTooLargeResponse();
    }
    return createFeedbackInvalidJsonResponse();
  }

  try {
    const created = await feedbackService.createFeedbackRequest(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createFeedbackErrorResponse(error);
  }
}
