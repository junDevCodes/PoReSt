import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTestimonialService, createTestimonialErrorResponse } from "@/modules/testimonials";

const service = createTestimonialService({ prisma });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "slug 파라미터가 필요합니다." } },
      { status: 422 },
    );
  }

  try {
    const testimonials = await service.listPublicBySlug(slug);
    return NextResponse.json({ data: testimonials });
  } catch (error) {
    return createTestimonialErrorResponse(error);
  }
}
