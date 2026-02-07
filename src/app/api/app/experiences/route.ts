import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  createExperienceErrorResponse,
  createExperienceInvalidJsonResponse,
  createExperiencesService,
} from "@/modules/experiences";

const experiencesService = createExperiencesService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
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
    const experience = await experiencesService.createExperience(authResult.session.user.id, body);
    return NextResponse.json({ data: experience }, { status: 201 });
  } catch (error) {
    return createExperienceErrorResponse(error);
  }
}
