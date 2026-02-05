import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireOwner();

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    await prisma.$connect();

    const [userCount, accountCount, sessionCount] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.session.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "데이터베이스 연결 성공",
      database: {
        connected: true,
        tables: {
          users: userCount,
          accounts: accountCount,
          sessions: sessionCount,
        },
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB 테스트 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "데이터베이스 연결 실패",
        error: "서버 내부 오류가 발생했습니다.",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
