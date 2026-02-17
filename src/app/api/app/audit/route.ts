import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseLimit(value: string | null): number {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const actorId = authResult.session.user.id;
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursor = url.searchParams.get("cursor");

  const logs = await prisma.auditLog.findMany({
    where: { actorId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
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

  const hasNext = logs.length > limit;
  const data = hasNext ? logs.slice(0, limit) : logs;
  const nextCursor = hasNext ? data[data.length - 1]?.id ?? null : null;

  return NextResponse.json({
    data: {
      items: data,
      meta: {
        nextCursor,
        hasNext,
        limit,
      },
    },
  });
}
