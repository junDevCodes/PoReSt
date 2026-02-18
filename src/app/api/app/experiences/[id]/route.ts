import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { revalidatePublicPortfolio } from "@/lib/revalidate-public";
import {
  createExperienceErrorResponse,
  createExperienceInvalidJsonResponse,
  createExperiencePayloadTooLargeResponse,
  createExperiencesService,
} from "@/modules/experiences";

const experiencesService = createExperiencesService({ prisma });

type ExperienceIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function PUT(request: Request, context: ExperienceIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createExperiencePayloadTooLargeResponse();
    }
    return createExperienceInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const experience = await experiencesService.updateExperience(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    revalidatePublicPortfolio();
    return NextResponse.json({ data: experience });
  } catch (error) {
    return createExperienceErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: ExperienceIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await experiencesService.deleteExperience(authResult.session.user.id, params.id);
    revalidatePublicPortfolio();
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createExperienceErrorResponse(error);
  }
}

