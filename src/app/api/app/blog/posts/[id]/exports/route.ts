import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createBlogErrorResponse, createBlogService } from "@/modules/blog";

type BlogPostExportsRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const blogService = createBlogService({ prisma });

export async function GET(_: Request, context: BlogPostExportsRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const exports = await blogService.listExportsForPost(authResult.session.user.id, params.id);
    return Response.json({ data: exports });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}
