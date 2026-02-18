import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";

type LegacyProjectDetailProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export const revalidate = 60;

const projectsService = createProjectsService({ prisma });

export default async function LegacyProjectDetailPage({ params }: LegacyProjectDetailProps) {
  const resolvedParams = await params;

  try {
    const path = await projectsService.resolvePublicProjectPathBySlug(resolvedParams.slug);
    redirect(`/u/${encodeURIComponent(path.publicSlug)}/projects/${encodeURIComponent(path.slug)}`);
  } catch (error) {
    if (isProjectServiceError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
