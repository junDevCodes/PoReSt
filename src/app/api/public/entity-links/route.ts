import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDomainLinksService } from "@/modules/domain-links";

const domainLinksService = createDomainLinksService({ prisma });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "slug 파라미터는 필수입니다." } },
      { status: 422 },
    );
  }

  try {
    const links = await domainLinksService.listPublicLinksForOwner(slug);
    return NextResponse.json({ data: links });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
