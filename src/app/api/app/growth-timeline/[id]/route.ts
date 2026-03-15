import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createGrowthTimelineService,
  createGrowthTimelineErrorResponse,
} from "@/modules/growth-timeline";

const service = createGrowthTimelineService({ prisma });

/** DELETE /api/app/growth-timeline/[id] — 이벤트 삭제 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    await service.deleteEvent(authResult.session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return createGrowthTimelineErrorResponse(error);
  }
}
