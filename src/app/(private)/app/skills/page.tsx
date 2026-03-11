import { prisma } from "@/lib/prisma";
import { createSkillsService } from "@/modules/skills";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerSkillList } from "@/app/(private)/app/_lib/server-serializers";
import { SkillsPageClient } from "./SkillsPageClient";

const skillsService = createSkillsService({ prisma });

export default async function SkillsAdminPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/skills");
  const skills = await skillsService.listSkillsForOwner(ownerId);

  return <SkillsPageClient initialSkills={serializeOwnerSkillList(skills)} />;
}
