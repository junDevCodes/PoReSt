import { prisma } from "@/lib/prisma";
import { createResumesService } from "@/modules/resumes";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerResumeList } from "@/app/(private)/app/_lib/server-serializers";
import { ResumesPageClient } from "./ResumesPageClient";

const resumesService = createResumesService({ prisma });

export default async function ResumesPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/resumes");
  const resumes = await resumesService.listResumesForOwner(ownerId);

  return <ResumesPageClient initialResumes={serializeOwnerResumeList(resumes)} />;
}
