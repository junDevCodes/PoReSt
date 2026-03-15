import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createTestimonialService,
  createTestimonialErrorResponse,
  createTestimonialInvalidJsonResponse,
} from "@/modules/testimonials";

const service = createTestimonialService({ prisma });

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const testimonials = await service.listForOwner(authResult.session.user.id);
    return NextResponse.json({ data: testimonials });
  } catch (error) {
    return createTestimonialErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createTestimonialInvalidJsonResponse();
  }

  try {
    const testimonial = await service.createRequest(authResult.session.user.id, body);
    return NextResponse.json({ data: testimonial }, { status: 201 });
  } catch (error) {
    return createTestimonialErrorResponse(error);
  }
}
