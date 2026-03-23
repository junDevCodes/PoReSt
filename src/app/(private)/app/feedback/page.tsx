import { prisma } from "@/lib/prisma";
import { createFeedbackService } from "@/modules/feedback";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeFeedbackRequestList } from "@/app/(private)/app/_lib/server-serializers";
import { FeedbackPageClient } from "./FeedbackPageClient";

const feedbackService = createFeedbackService({ prisma });

export default async function FeedbackListPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/feedback");
  const requests = await feedbackService.listFeedbackRequestsForOwner(ownerId);

  return <FeedbackPageClient initialRequests={serializeFeedbackRequestList(requests)} />;
}
