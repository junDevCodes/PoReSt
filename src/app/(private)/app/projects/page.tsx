import { prisma } from "@/lib/prisma";
import { createProjectsService } from "@/modules/projects";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerProjectList } from "@/app/(private)/app/_lib/server-serializers";
import { ProjectsPageClient } from "./ProjectsPageClient";

const projectsService = createProjectsService({ prisma });

export default async function ProjectsAdminPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/projects");
  const projects = await projectsService.listProjectsForOwner(ownerId);

  return <ProjectsPageClient initialProjects={serializeOwnerProjectList(projects)} />;
}
