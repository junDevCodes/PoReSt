import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createJobTrackerService, createJobTrackerErrorResponse } from "@/modules/job-tracker";

const service = createJobTrackerService({ prisma });

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const events = await service.getEventsForTarget(authResult.session.user.id, params.id);
    return NextResponse.json({ data: events });
  } catch (error) {
    return createJobTrackerErrorResponse(error);
  }
}
