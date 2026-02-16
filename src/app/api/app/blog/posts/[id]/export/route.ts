import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createBlogErrorResponse, createBlogService } from "@/modules/blog";

type BlogPostIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const blogService = createBlogService({ prisma });

export async function GET(request: Request, context: BlogPostIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "zip";
  if (format !== "html" && format !== "md" && format !== "zip") {
    return Response.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "吏?먰븯吏 ?딅뒗 export ?뺤떇?낅땲?? html, md, zip 以??섎굹瑜??ъ슜?댁＜?몄슂.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const params = await context.params;
    const artifact = await blogService.createExportForPost(authResult.session.user.id, params.id, format);

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

