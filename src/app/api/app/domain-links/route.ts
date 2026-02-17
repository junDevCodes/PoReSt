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
