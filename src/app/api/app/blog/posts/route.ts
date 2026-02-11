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

const blogService = createBlogService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const posts = await blogService.listPostsForOwner(authResult.session.user.id);
    return NextResponse.json({ data: posts });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}

export async function POST(request: Request) {
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
    const created = await blogService.createPost(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}
