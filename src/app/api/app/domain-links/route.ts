import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { reportServerError } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import {
  createDomainLinkErrorResponse,
  createDomainLinksService,
  createInvalidJsonResponse,
  createPayloadTooLargeResponse,
  isDomainLinkServiceError,
} from "@/modules/domain-links";

const domainLinksService = createDomainLinksService({ prisma });

function parseLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const entityId = url.searchParams.get("entityId") ?? undefined;

  // 양방향 조회: entityType + entityId → source 또는 target 어느 쪽이든 매칭
  if (entityType && entityId) {
    try {
      const { DomainLinkEntityType } = await import("@prisma/client");
      const validTypes = Object.values(DomainLinkEntityType) as string[];
      if (!validTypes.includes(entityType)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "유효하지 않은 entityType입니다." } },
          { status: 422 },
        );
      }
      const links = await domainLinksService.listBidirectionalLinksForOwner(
        authResult.session.user.id,
        entityType as typeof DomainLinkEntityType[keyof typeof DomainLinkEntityType],
        entityId,
      );
      return NextResponse.json({ data: links });
    } catch (error) {
      if (!isDomainLinkServiceError(error)) {
        await reportServerError({ request, scope: "api.domain-links.bidirectional", userId: authResult.session.user.id }, error);
      }
      return createDomainLinkErrorResponse(error);
    }
  }

  const query = {
    sourceType: url.searchParams.get("sourceType") ?? undefined,
    sourceId: url.searchParams.get("sourceId") ?? undefined,
    targetType: url.searchParams.get("targetType") ?? undefined,
    targetId: url.searchParams.get("targetId") ?? undefined,
    limit: parseLimit(url.searchParams.get("limit")),
  };

  try {
    const links = await domainLinksService.listLinksForOwner(authResult.session.user.id, query);
    return NextResponse.json({ data: links });
  } catch (error) {
    if (!isDomainLinkServiceError(error)) {
      await reportServerError(
        {
          request,
          scope: "api.domain-links.list",
          userId: authResult.session.user.id,
        },
        error,
      );
    }
    return createDomainLinkErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsed = await parseJsonBodyWithLimit(request);
  if (!parsed.ok) {
    if (parsed.reason === "PAYLOAD_TOO_LARGE") {
      return createPayloadTooLargeResponse();
    }
    return createInvalidJsonResponse();
  }

  try {
    const created = await domainLinksService.createLinkForOwner(authResult.session.user.id, parsed.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (!isDomainLinkServiceError(error)) {
      await reportServerError(
        {
          request,
          scope: "api.domain-links.create",
          userId: authResult.session.user.id,
        },
        error,
      );
    }
    return createDomainLinkErrorResponse(error);
  }
}
