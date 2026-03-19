import { prisma } from "@/lib/prisma";
import { createCoverLettersService } from "@/modules/cover-letters";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerCoverLetterDetail } from "@/app/(private)/app/_lib/server-serializers";
import { CoverLetterDetailClient } from "./CoverLetterDetailClient";

const coverLettersService = createCoverLettersService({ prisma });

type CoverLetterDetailPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function CoverLetterDetailPage({ params }: CoverLetterDetailPageProps) {
  const { ownerId } = await getRequiredOwnerSession("/app/cover-letters");
  const resolvedParams = await params;
  const coverLetter = await coverLettersService.getForOwner(ownerId, resolvedParams.id);

  return <CoverLetterDetailClient initialData={serializeOwnerCoverLetterDetail(coverLetter)} />;
}
