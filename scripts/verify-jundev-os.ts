import "dotenv/config";
import { ControlSystem } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { createJundevOsService } from "../src/modules/jundev-os";

async function main() {
  const owner = await prisma.user.findFirst({
    where: { isOwner: true },
    select: { id: true, email: true },
  });

  if (!owner) {
    throw new Error("No owner user found. Sign in once with OWNER_EMAIL before running jundev-os verification.");
  }

  const service = createJundevOsService({ prisma });
  const marker = new Date().toISOString();

  const workflow = await service.runWorkflow(owner.id, {
    system: ControlSystem.POREST,
    workflowKey: "porest-release-gate",
    summary: `Verification run for jundev-os control plane at ${marker}`,
  });

  const jobResult = await service.createContentJob(owner.id, {
    system: ControlSystem.TECH,
    title: `jundev-os verification job ${marker}`,
    channel: "verification",
    description: "Created by scripts/verify-jundev-os.ts to verify Neon-backed write/read behavior.",
    requiresApproval: true,
  });

  const resolvedDecision = jobResult.decision
    ? await service.resolveDecision(owner.id, jobResult.decision.id, {
        status: "APPROVED",
        result: "Verification decision approved by automated local check.",
      })
    : null;

  const dashboard = await service.getDashboard(owner.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        ownerEmail: owner.email,
        workflowRunId: workflow.run.id,
        reportId: workflow.report.id,
        eventId: workflow.event.id,
        contentJobId: jobResult.job.id,
        resolvedDecisionId: resolvedDecision?.id ?? null,
        totals: dashboard.totals,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
