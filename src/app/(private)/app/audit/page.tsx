import { prisma } from "@/lib/prisma";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { AuditPageClient } from "./AuditPageClient";

const DEFAULT_LIMIT = 20;

/** audit 모듈(서비스 레이어)이 없으므로 Prisma 직접 쿼리 — API route(api/app/audit)와 동일 패턴 */
async function fetchInitialAuditLogs(ownerId: string) {
  const rawLogs = await prisma.auditLog.findMany({
    where: { actorId: ownerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: DEFAULT_LIMIT + 1,
    select: {
      id: true,
      actorId: true,
      action: true,
      entityType: true,
      entityId: true,
      metaJson: true,
      createdAt: true,
    },
  });

  const hasNext = rawLogs.length > DEFAULT_LIMIT;
  const trimmed = hasNext ? rawLogs.slice(0, DEFAULT_LIMIT) : rawLogs;
  const items = trimmed.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));
  const nextCursor = hasNext ? (trimmed[trimmed.length - 1]?.id ?? null) : null;

  return { items, nextCursor, hasNext };
}

export default async function AuditPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/audit");
  const { items, nextCursor, hasNext } = await fetchInitialAuditLogs(ownerId);

  return (
    <AuditPageClient
      initialLogs={items}
      initialNextCursor={nextCursor}
      initialHasNext={hasNext}
    />
  );
}
