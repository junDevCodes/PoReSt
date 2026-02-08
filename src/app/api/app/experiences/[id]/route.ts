import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createExperienceErrorResponse,
  createExperienceInvalidJsonResponse,
  createExperiencesService,
} from "@/modules/experiences";

const experiencesService = createExperiencesService({ prisma });

type ExperienceIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function PUT(request: Request, context: ExperienceIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createExperienceInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const experience = await experiencesService.updateExperience(
      authResult.session.user.id,
      params.id,
      body,
    );
    return NextResponse.json({ data: experience });
  } catch (error) {
    return createExperienceErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: ExperienceIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await experiencesService.deleteExperience(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createExperienceErrorResponse(error);
  }
}
