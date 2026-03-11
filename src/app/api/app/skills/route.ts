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

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const skills = await skillsService.listSkillsForOwner(authResult.session.user.id);
    return NextResponse.json({ data: skills });
  } catch (error) {
    return createSkillErrorResponse(error);
  }
}

export async function POST(request: Request) {
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
    const skill = await skillsService.createSkill(
      authResult.session.user.id,
      parsedBody.value,
    );
    revalidatePublicPortfolio();
    return NextResponse.json({ data: skill }, { status: 201 });
  } catch (error) {
    return createSkillErrorResponse(error);
  }
}
