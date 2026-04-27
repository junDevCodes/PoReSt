import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { prisma } from "@/lib/prisma";
import { createJundevOsService } from "@/modules/jundev-os";
import { JundevOsPageClient } from "./JundevOsPageClient";

export const metadata: Metadata = {
  title: "jundev-os Control Plane | PoReSt",
  description: "PoReSt에 통합된 jundev-os 운영 콘솔입니다.",
};

const service = createJundevOsService({ prisma });

export default async function JundevOsPage() {
  const { session, ownerId } = await getRequiredOwnerSession("/app/jundev-os");

  if (!session.user.isOwner) {
    redirect("/app");
  }

  const dashboard = await service.getDashboard(ownerId);

  return (
    <JundevOsPageClient
      initialDashboard={dashboard}
      figmaUrl="https://www.figma.com/design/34RbWOwavm43VHX3T0P5jW"
      vercelProjectUrl="https://vercel.com/joonaengs-projects/porest"
    />
  );
}
