import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createPageViewErrorResponse,
  createPageViewsService,
} from "@/modules/pageviews";

const pageViewsService = createPageViewsService({ prisma });

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : undefined;

    const analytics = await pageViewsService.getAnalytics(
      authResult.session.user.id,
      days && !isNaN(days) && days > 0 && days <= 90 ? days : undefined,
    );
    return NextResponse.json({ data: analytics });
  } catch (error) {
    return createPageViewErrorResponse(error);
  }
}
