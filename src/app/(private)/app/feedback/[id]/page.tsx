import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createFeedbackService, isFeedbackServiceError } from "@/modules/feedback";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import {
  serializeFeedbackRequestDetail,
  serializeFeedbackRequestList,
} from "@/app/(private)/app/_lib/server-serializers";
import { FeedbackDetailPageClient } from "./FeedbackDetailPageClient";

const feedbackService = createFeedbackService({ prisma });

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ownerId } = await getRequiredOwnerSession(`/app/feedback/${id}`);

  let detail;
  try {
    detail = await feedbackService.getFeedbackRequestForOwner(ownerId, id);
  } catch (err) {
    if (isFeedbackServiceError(err) && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const requestList = await feedbackService.listFeedbackRequestsForOwner(ownerId);

  return (
    <FeedbackDetailPageClient
      initialDetail={serializeFeedbackRequestDetail(detail)}
      initialRequestList={serializeFeedbackRequestList(requestList)}
    />
  );
}
