import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createJundevOsErrorResponse, createJundevOsService } from "@/modules/jundev-os";

const service = createJundevOsService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const dashboard = await service.getDashboard(authResult.session.user.id);
    return NextResponse.json({ data: dashboard });
  } catch (error) {
    return createJundevOsErrorResponse(error);
  }
}
