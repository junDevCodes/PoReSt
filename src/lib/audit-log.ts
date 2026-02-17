import type { Prisma } from "@prisma/client";

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
    console.error("감사 로그 저장 실패:", error);
  }
}
