import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { reportServerError } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { createBlogErrorResponse, createBlogService } from "@/modules/blog";

type BlogPostIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const blogService = createBlogService({ prisma });

export async function POST(request: Request, context: BlogPostIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  let postId = "";
  try {
    const params = await context.params;
    postId = params.id;
    const linted = await blogService.runLintForPost(authResult.session.user.id, postId);
    return NextResponse.json({ data: linted });
  } catch (error) {
    await reportServerError(
      {
        request,
        scope: "api.blog.lint",
        userId: authResult.session.user.id,
        extra: {
          postId,
        },
      },
      error,
    );
    return createBlogErrorResponse(error);
  }
}

