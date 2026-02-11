import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createBlogErrorResponse,
  createBlogInvalidJsonResponse,
  createBlogPayloadTooLargeResponse,
  createBlogService,
} from "@/modules/blog";

type BlogPostIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const blogService = createBlogService({ prisma });

export async function GET(_: Request, context: BlogPostIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const post = await blogService.getPostForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: post });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}

export async function PUT(request: Request, context: BlogPostIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createBlogPayloadTooLargeResponse();
    }
    return createBlogInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const updated = await blogService.updatePost(authResult.session.user.id, params.id, parsedBody.value);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: BlogPostIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await blogService.deletePost(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}
