import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { reportServerError } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { createFeedbackErrorResponse, createFeedbackService } from "@/modules/feedback";

type FeedbackIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const feedbackService = createFeedbackService({ prisma });

export async function POST(request: Request, context: FeedbackIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  let feedbackRequestId = "";
  try {
    const params = await context.params;
    feedbackRequestId = params.id;
    const executed = await feedbackService.runFeedbackRequestForOwner(
      authResult.session.user.id,
      feedbackRequestId,
    );
    return NextResponse.json({ data: executed });
  } catch (error) {
    await reportServerError(
      {
        request,
        scope: "api.feedback.run",
        userId: authResult.session.user.id,
        extra: {
          feedbackRequestId,
        },
      },
      error,
    );
    return createFeedbackErrorResponse(error);
  }
}

