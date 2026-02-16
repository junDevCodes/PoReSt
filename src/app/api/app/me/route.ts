import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: authResult.session.user.id,
    },
    select: {
      id: true,
      email: true,
      isOwner: true,
      portfolioSettings: {
        select: {
          publicSlug: true,
          isPublic: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "사용자 정보를 찾을 수 없습니다.",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      isOwner: user.isOwner,
      workspace: {
        publicSlug: user.portfolioSettings?.publicSlug ?? null,
        isPublic: user.portfolioSettings?.isPublic ?? null,
      },
    },
  });
}
