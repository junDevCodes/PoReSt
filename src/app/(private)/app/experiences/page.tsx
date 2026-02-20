import { prisma } from "@/lib/prisma";
import { createExperiencesService } from "@/modules/experiences";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerExperienceList } from "@/app/(private)/app/_lib/server-serializers";
import { ExperiencesPageClient } from "./ExperiencesPageClient";

const experiencesService = createExperiencesService({ prisma });

export default async function ExperiencesAdminPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/experiences");
  const experiences = await experiencesService.listExperiencesForOwner(ownerId);

  return <ExperiencesPageClient initialExperiences={serializeOwnerExperienceList(experiences)} />;
}
