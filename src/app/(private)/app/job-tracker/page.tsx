import { prisma } from "@/lib/prisma";
import { createJobTrackerService } from "@/modules/job-tracker";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeBoard } from "@/app/(private)/app/_lib/server-serializers";
import { JobTrackerPageClient } from "./JobTrackerPageClient";

const jobTrackerService = createJobTrackerService({ prisma });

export default async function JobTrackerPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/job-tracker");
  const board = await jobTrackerService.getBoardForOwner(ownerId);

  return <JobTrackerPageClient initialBoard={serializeBoard(board)} />;
}
