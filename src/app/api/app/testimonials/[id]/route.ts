import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createTestimonialService,
  createTestimonialErrorResponse,
  createTestimonialInvalidJsonResponse,
} from "@/modules/testimonials";

const service = createTestimonialService({ prisma });

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createTestimonialInvalidJsonResponse();
  }

  try {
    const testimonial = await service.updateForOwner(authResult.session.user.id, id, body);
    return NextResponse.json({ data: testimonial });
  } catch (error) {
    return createTestimonialErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await context.params;

  try {
    await service.deleteForOwner(authResult.session.user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createTestimonialErrorResponse(error);
  }
}
