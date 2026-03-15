import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createTestimonialService,
  createTestimonialErrorResponse,
  createTestimonialInvalidJsonResponse,
} from "@/modules/testimonials";

const service = createTestimonialService({ prisma });

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const info = await service.getByShareToken(token);
    return NextResponse.json({ data: info });
  } catch (error) {
    return createTestimonialErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createTestimonialInvalidJsonResponse();
  }

  try {
    await service.submitByShareToken(token, body);
    return NextResponse.json({ data: { message: "추천서가 제출되었습니다." } }, { status: 201 });
  } catch (error) {
    return createTestimonialErrorResponse(error);
  }
}
