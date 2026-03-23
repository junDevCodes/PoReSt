import { prisma } from "@/lib/prisma";
import { createExperienceStoriesService } from "@/modules/experience-stories";
import { createExperiencesService } from "@/modules/experiences";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import {
  serializeOwnerExperienceList,
  serializeExperienceStoriesList,
} from "@/app/(private)/app/_lib/server-serializers";
import { ExperienceStoriesPageClient } from "./ExperienceStoriesPageClient";

const experiencesService = createExperiencesService({ prisma });
const storiesService = createExperienceStoriesService({ prisma });

export default async function ExperienceStoriesPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/experience-stories");

  const [experiences, storiesResult] = await Promise.all([
    experiencesService.listExperiencesForOwner(ownerId),
    storiesService.listStoriesForOwner(ownerId, {}),
  ]);

  return (
    <ExperienceStoriesPageClient
      initialExperiences={serializeOwnerExperienceList(experiences)}
      initialStories={serializeExperienceStoriesList(storiesResult)}
    />
  );
}
