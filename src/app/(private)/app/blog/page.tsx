import { prisma } from "@/lib/prisma";
import { createBlogService } from "@/modules/blog";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerBlogPostList } from "@/app/(private)/app/_lib/server-serializers";
import { BlogPostsPageClient } from "./BlogPostsPageClient";

const blogService = createBlogService({ prisma });

export default async function BlogPostsPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/blog");
  const posts = await blogService.listPostsForOwner(ownerId);

  return <BlogPostsPageClient initialPosts={serializeOwnerBlogPostList(posts)} />;
}
