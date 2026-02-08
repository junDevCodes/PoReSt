import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { revalidatePublicPortfolio } from "@/lib/revalidate-public";
import {
  createPortfolioSettingsService,
} from "@/modules/portfolio-settings/implementation";
import {
  createPortfolioSettingsErrorResponse,
  createPortfolioSettingsInvalidJsonResponse,
  createPortfolioSettingsPayloadTooLargeResponse,
} from "@/modules/portfolio-settings/http";

const portfolioSettingsService = createPortfolioSettingsService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const settings = await portfolioSettingsService.getPortfolioSettingsForOwner(
      authResult.session.user.id,
    );
    return NextResponse.json({ data: settings });
  } catch (error) {
    return createPortfolioSettingsErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createPortfolioSettingsPayloadTooLargeResponse();
    }
    return createPortfolioSettingsInvalidJsonResponse();
  }

  try {
    const settings = await portfolioSettingsService.upsertPortfolioSettingsForOwner(
      authResult.session.user.id,
      parsedBody.value,
    );
    revalidatePublicPortfolio();
    return NextResponse.json({ data: settings });
  } catch (error) {
    return createPortfolioSettingsErrorResponse(error);
  }
}
