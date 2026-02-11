import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createFeedbackErrorResponse, createFeedbackService } from "@/modules/feedback";

const feedbackService = createFeedbackService({ prisma });

export async function GET(request: Request) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const currentRequestId = url.searchParams.get("currentRequestId");
  const previousRequestId = url.searchParams.get("previousRequestId");

  try {
    const compared = await feedbackService.compareFeedbackRequestsForOwner(authResult.session.user.id, {
      currentRequestId: currentRequestId ?? "",
      previousRequestId: previousRequestId ?? "",
    });
    return NextResponse.json({ data: compared });
  } catch (error) {
    return createFeedbackErrorResponse(error);
  }
}
