import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createGrowthTimelineService,
  createGrowthTimelineErrorResponse,
} from "@/modules/growth-timeline";

const service = createGrowthTimelineService({ prisma });

/** POST /api/app/growth-timeline/sync — 자동 수집 실행 */
export async function POST() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const result = await service.syncFromEntities(authResult.session.user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return createGrowthTimelineErrorResponse(error);
  }
}
