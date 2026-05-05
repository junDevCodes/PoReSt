import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { reportServerError } from "@/lib/monitoring";

// jundev-os dogfooding 통합 — 운영 layer (Control Plane) 호출 응답
// 책임 5 (dogfooding 통합) + 시스템 규약 5 (호출 결과 → jarvis event 자동 발생)
// 시스템 규약 1 (운영-제품 분리): 본 route.ts에 jundev-os 운영 코드 박힘 X.
export async function GET(request: Request) {
  // 1. Operator 권한 확인 (NextAuth session.user.isOwner — OWNER_EMAIL allowlist)
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response; // 401 또는 403
  }

  try {
    await prisma.$connect();

    // 2. PoReSt export 가능한 도메인 카운트 (read-only — 부작용 X)
    const [
      userCount,
      projectCount,
      experienceCount,
      resumeCount,
      blogPostCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.experience.count(),
      prisma.resume.count(),
      prisma.blogPost.count(),
    ]);

    // 3. PoReSt export 상태 응답 (jundev-os 운영 코드 박힘 X — 시스템 규약 1)
    return NextResponse.json({
      ok: true,
      service: "porest",
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        projects: projectCount,
        experiences: experienceCount,
        resumes: resumeCount,
        blog_posts: blogPostCount,
      },
      owner_id: authResult.session.user.id,
    });
  } catch (error) {
    // 4. 실패는 500 + 구조화 로그 (PoReSt 내부 — jarvis event는 호출자 integrations layer가 발행)
    await reportServerError(
      {
        request,
        scope: "api.jundev.export.status",
        userId: authResult.session.user.id,
      },
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        service: "porest",
        error: "서버 내부 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
