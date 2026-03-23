import { prisma } from "@/lib/prisma";
import { createCompanyTargetsService } from "@/modules/company-targets";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeCompanyTargetsList } from "@/app/(private)/app/_lib/server-serializers";
import { CompanyTargetsPageClient } from "./CompanyTargetsPageClient";

const companyTargetsService = createCompanyTargetsService({ prisma });

export default async function CompanyTargetsPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/company-targets");
  const result = await companyTargetsService.listTargetsForOwner(ownerId, {});

  return <CompanyTargetsPageClient initialTargets={serializeCompanyTargetsList(result)} />;
}
