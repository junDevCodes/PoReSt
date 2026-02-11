import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createFeedbackErrorResponse, createFeedbackService } from "@/modules/feedback";

type FeedbackIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const feedbackService = createFeedbackService({ prisma });

export async function POST(_: Request, context: FeedbackIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const executed = await feedbackService.runFeedbackRequestForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: executed });
  } catch (error) {
    return createFeedbackErrorResponse(error);
  }
}
