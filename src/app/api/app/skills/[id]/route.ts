import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { revalidatePublicPortfolio } from "@/lib/revalidate-public";
import {
  createSkillErrorResponse,
  createSkillInvalidJsonResponse,
  createSkillPayloadTooLargeResponse,
  createSkillsService,
} from "@/modules/skills";

const skillsService = createSkillsService({ prisma });

type SkillIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function PATCH(request: Request, context: SkillIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createSkillPayloadTooLargeResponse();
    }
    return createSkillInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const skill = await skillsService.updateSkill(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    revalidatePublicPortfolio();
    return NextResponse.json({ data: skill });
  } catch (error) {
    return createSkillErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: SkillIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await skillsService.deleteSkill(authResult.session.user.id, params.id);
    revalidatePublicPortfolio();
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createSkillErrorResponse(error);
  }
}
