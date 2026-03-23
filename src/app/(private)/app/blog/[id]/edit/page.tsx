import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import {
  serializeOwnerBlogPostDetail,
  serializeOwnerBlogExportArtifactList,
} from "@/app/(private)/app/_lib/server-serializers";
import { createBlogService, BlogServiceError } from "@/modules/blog";
import { BlogEditPageClient } from "./BlogEditPageClient";

const blogService = createBlogService({ prisma });

export default async function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { ownerId } = await getRequiredOwnerSession("/app/blog");
  const { id: postId } = await params;

  let post;
  let exports;
  try {
    [post, exports] = await Promise.all([
      blogService.getPostForOwner(ownerId, postId),
      blogService.listExportsForPost(ownerId, postId),
    ]);
  } catch (err) {
    if (err instanceof BlogServiceError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return (
    <BlogEditPageClient
      initialPost={serializeOwnerBlogPostDetail(post)}
      initialExportsHistory={serializeOwnerBlogExportArtifactList(exports)}
    />
  );
}
