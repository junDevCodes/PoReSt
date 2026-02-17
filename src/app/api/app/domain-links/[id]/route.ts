import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { reportServerError } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import {
  createDomainLinkErrorResponse,
  createDomainLinksService,
  isDomainLinkServiceError,
} from "@/modules/domain-links";

type DomainLinkIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const domainLinksService = createDomainLinksService({ prisma });

export async function DELETE(request: Request, context: DomainLinkIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await domainLinksService.deleteLinkForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    if (!isDomainLinkServiceError(error)) {
      await reportServerError(
        {
          request,
          scope: "api.domain-links.delete",
          userId: authResult.session.user.id,
        },
        error,
      );
    }
    return createDomainLinkErrorResponse(error);
  }
}

