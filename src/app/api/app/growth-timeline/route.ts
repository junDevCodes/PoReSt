import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createGrowthTimelineService,
  createGrowthTimelineErrorResponse,
  createGrowthTimelineInvalidJsonResponse,
} from "@/modules/growth-timeline";

const service = createGrowthTimelineService({ prisma });

/** GET /api/app/growth-timeline — 타임라인 조회 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const { searchParams } = request.nextUrl;
    const daysParam = searchParams.get("days");
    const days = daysParam ? Math.min(Math.max(Number(daysParam) || 365, 30), 730) : 365;

    const timeline = await service.getTimeline(authResult.session.user.id, days);
    return NextResponse.json({ data: timeline });
  } catch (error) {
    return createGrowthTimelineErrorResponse(error);
  }
}

/** POST /api/app/growth-timeline — 수동 이벤트 추가 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createGrowthTimelineInvalidJsonResponse();
  }

  try {
    const event = await service.createEvent(authResult.session.user.id, body);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    return createGrowthTimelineErrorResponse(error);
  }
}
