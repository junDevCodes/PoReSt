import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createBlogErrorResponse, createBlogService } from "@/modules/blog";

type BlogPostExportDetailRouteContext = {
  params:
    | Promise<{
        id: string;
        exportId: string;
      }>
    | {
        id: string;
        exportId: string;
      };
};

const blogService = createBlogService({ prisma });

export async function GET(_: Request, context: BlogPostExportDetailRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const artifact = await blogService.getExportForPost(
      authResult.session.user.id,
      params.id,
      params.exportId,
    );

    return new Response(new Uint8Array(artifact.payload), {
      status: 200,
      headers: {
        "Content-Type": artifact.contentType,
        "Content-Disposition": `attachment; filename=\"${artifact.fileName}\"`,
        "X-Blog-Export-Id": artifact.id,
      },
    });
  } catch (error) {
    return createBlogErrorResponse(error);
  }
}
