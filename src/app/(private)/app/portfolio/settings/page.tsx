import { prisma } from "@/lib/prisma";
import { createPortfolioSettingsService } from "@/modules/portfolio-settings";
import { createResumesService } from "@/modules/resumes";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerPortfolioSettings } from "@/app/(private)/app/_lib/server-serializers";
import { PortfolioSettingsPageClient } from "./PortfolioSettingsPageClient";

const portfolioSettingsService = createPortfolioSettingsService({ prisma });
const resumesService = createResumesService({ prisma });

export default async function PortfolioSettingsPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/portfolio/settings");

  const [settings, resumes] = await Promise.all([
    portfolioSettingsService.getPortfolioSettingsForOwner(ownerId),
    resumesService.listResumesForOwner(ownerId),
  ]);

  const serializedSettings = settings ? serializeOwnerPortfolioSettings(settings) : null;
  const serializedResumes = resumes.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status as string,
  }));

  return (
    <PortfolioSettingsPageClient
      initialSettings={serializedSettings}
      initialResumes={serializedResumes}
    />
  );
}
