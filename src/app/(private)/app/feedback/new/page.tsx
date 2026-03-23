import { prisma } from "@/lib/prisma";
import { createFeedbackService } from "@/modules/feedback";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeFeedbackTargetList } from "@/app/(private)/app/_lib/server-serializers";
import { FeedbackNewPageClient } from "./FeedbackNewPageClient";

const feedbackService = createFeedbackService({ prisma });

const DEFAULT_TARGET_TYPE = "RESUME" as const;

export default async function FeedbackNewPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/feedback/new");
  const targets = await feedbackService.listFeedbackTargetsForOwner(ownerId, DEFAULT_TARGET_TYPE);

  return (
    <FeedbackNewPageClient
      initialTargets={serializeFeedbackTargetList(targets)}
      initialTargetType={DEFAULT_TARGET_TYPE}
    />
  );
}
