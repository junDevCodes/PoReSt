import { prisma } from "@/lib/prisma";
import { createCoverLettersService } from "@/modules/cover-letters";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerCoverLetterList } from "@/app/(private)/app/_lib/server-serializers";
import { CoverLettersPageClient } from "./CoverLettersPageClient";

const coverLettersService = createCoverLettersService({ prisma });

export default async function CoverLettersPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/cover-letters");
  const coverLetters = await coverLettersService.listForOwner(ownerId);

  return <CoverLettersPageClient initialCoverLetters={serializeOwnerCoverLetterList(coverLetters)} />;
}
