import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerProject } from "@/app/(private)/app/_lib/server-serializers";
import { ProjectEditPageClient } from "./ProjectEditPageClient";

const projectsService = createProjectsService({ prisma });

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: Props) {
  const { ownerId } = await getRequiredOwnerSession("/app/projects");
  const { id } = await params;

  let project;
  try {
    project = await projectsService.getProjectForOwner(ownerId, id);
  } catch (err) {
    if (isProjectServiceError(err) && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return <ProjectEditPageClient initialProject={serializeOwnerProject(project)} />;
}
