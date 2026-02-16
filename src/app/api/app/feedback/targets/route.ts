import { FeedbackTargetType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createFeedbackErrorResponse, createFeedbackService } from "@/modules/feedback";

const feedbackService = createFeedbackService({ prisma });

function isFeedbackTargetType(value: string): value is FeedbackTargetType {
  return Object.values(FeedbackTargetType).includes(value as FeedbackTargetType);
}

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const type = new URL(request.url).searchParams.get("type");
  if (!type || !isFeedbackTargetType(type)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "type 쿼리는 PORTFOLIO|RESUME|NOTE|BLOG 중 하나여야 합니다.",
        },
      },
      { status: 422 },
    );
  }

  try {
    const targets = await feedbackService.listFeedbackTargetsForOwner(authResult.session.user.id, type);
    return NextResponse.json({ data: targets });
  } catch (error) {
    return createFeedbackErrorResponse(error);
  }
}
