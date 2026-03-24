import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createResumesService, isResumeServiceError } from "@/modules/resumes";
import { createExperiencesService } from "@/modules/experiences";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerResumeDetail } from "@/app/(private)/app/_lib/server-serializers";
import { ResumeEditPageClient } from "./ResumeEditPageClient";

const resumesService = createResumesService({ prisma });
const experiencesService = createExperiencesService({ prisma });

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ResumeEditPage({ params }: Props) {
  const { ownerId } = await getRequiredOwnerSession("/app/resumes");
  const { id } = await params;

  let resume;
  try {
    resume = await resumesService.getResumeForOwner(ownerId, id);
  } catch (err) {
    if (isResumeServiceError(err) && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const experiences = await experiencesService.listExperiencesForOwner(ownerId);
  const experienceOptions = experiences.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
  }));

  return (
    <ResumeEditPageClient
      resumeId={id}
      initialResume={serializeOwnerResumeDetail(resume)}
      initialExperiences={experienceOptions}
    />
  );
}
