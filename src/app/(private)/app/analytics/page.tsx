import { prisma } from "@/lib/prisma";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { createPageViewsService } from "@/modules/pageviews";
import { AnalyticsPageClient } from "./AnalyticsPageClient";

const pageViewsService = createPageViewsService({ prisma });

export default async function AnalyticsPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/analytics");
  const analytics = await pageViewsService.getAnalytics(ownerId);

  return (
    <AnalyticsPageClient
      analytics={JSON.parse(JSON.stringify(analytics))}
    />
  );
}
