import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // DB 연결 테스트
        await prisma.$connect();

        // 각 테이블의 레코드 수 확인
        const [userCount, accountCount, sessionCount] = await Promise.all([
            prisma.user.count(),
            prisma.account.count(),
            prisma.session.count(),
        ]);

        return NextResponse.json({
            success: true,
            message: "Database connection successful",
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
        console.error("DB test error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Database connection failed",
                error: error instanceof Error ? error.message : "Unknown error",
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
