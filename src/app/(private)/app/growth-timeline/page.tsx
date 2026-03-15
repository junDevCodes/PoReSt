import { prisma } from "@/lib/prisma";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { createGrowthTimelineService } from "@/modules/growth-timeline";
import { GrowthTimelinePageClient } from "./GrowthTimelinePageClient";

const service = createGrowthTimelineService({ prisma });

export default async function GrowthTimelinePage() {
  const { ownerId } = await getRequiredOwnerSession("/app/growth-timeline");
  const timeline = await service.getTimeline(ownerId);

  return (
    <GrowthTimelinePageClient
      timeline={JSON.parse(JSON.stringify(timeline))}
    />
  );
}
