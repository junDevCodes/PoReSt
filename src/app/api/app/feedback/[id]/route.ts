import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createFeedbackErrorResponse, createFeedbackService } from "@/modules/feedback";

type FeedbackIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const feedbackService = createFeedbackService({ prisma });

export async function GET(_: Request, context: FeedbackIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const detail = await feedbackService.getFeedbackRequestForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: detail });
  } catch (error) {
    return createFeedbackErrorResponse(error);
  }
}

