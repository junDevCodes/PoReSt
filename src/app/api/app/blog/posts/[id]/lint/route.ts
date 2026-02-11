import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createBlogErrorResponse, createBlogService } from "@/modules/blog";

type BlogPostIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const blogService = createBlogService({ prisma });

export async function POST(_: Request, context: BlogPostIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const linted = await blogService.runLintForPost(authResult.session.user.id, params.id);
    return NextResponse.json({ data: linted });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}
