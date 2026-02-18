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

export async function GET() {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const experiences = await experiencesService.listExperiencesForOwner(authResult.session.user.id);
    return NextResponse.json({ data: experiences });
  } catch (error) {
    return createExperienceErrorResponse(error);
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
      return createExperiencePayloadTooLargeResponse();
    }
    return createExperienceInvalidJsonResponse();
  }

  try {
    const experience = await experiencesService.createExperience(
      authResult.session.user.id,
      parsedBody.value,
    );
    revalidatePublicPortfolio();
    return NextResponse.json({ data: experience }, { status: 201 });
  } catch (error) {
    return createExperienceErrorResponse(error);
  }
}

