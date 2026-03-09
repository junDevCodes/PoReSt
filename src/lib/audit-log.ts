import type { Prisma } from "@prisma/client";
import { writeStructuredLog } from "@/lib/observability";

export type AuditLogWriteInput = {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metaJson?: Prisma.InputJsonValue;
};

export type AuditLogPrismaClient = Pick<Prisma.TransactionClient, "auditLog">;

export async function writeAuditLog(prisma: AuditLogPrismaClient, input: AuditLogWriteInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.metaJson !== undefined ? { metaJson: input.metaJson } : {}),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    writeStructuredLog("error", "audit.write.failed", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      errorMessage,
    });
  }
}
