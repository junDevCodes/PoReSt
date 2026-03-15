import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createJobTrackerService, createJobTrackerErrorResponse } from "@/modules/job-tracker";

const service = createJobTrackerService({ prisma });

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const board = await service.getBoardForOwner(authResult.session.user.id);
    return NextResponse.json({ data: board });
  } catch (error) {
    return createJobTrackerErrorResponse(error);
  }
}
