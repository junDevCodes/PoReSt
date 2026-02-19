import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import {
  createExperienceStoriesService,
  createExperienceStoryErrorResponse,
  createExperienceStoryInvalidJsonResponse,
  createExperienceStoryPayloadTooLargeResponse,
} from "@/modules/experience-stories";

const service = createExperienceStoriesService({ prisma });

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const experienceId = url.searchParams.get("experienceId") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limitParam = url.searchParams.get("limit") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const result = await service.listStoriesForOwner(authResult.session.user.id, {
      experienceId,
      q,
      limit,
      cursor,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return createExperienceStoryErrorResponse(error);
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
      return createExperienceStoryPayloadTooLargeResponse();
    }
    return createExperienceStoryInvalidJsonResponse();
  }

  try {
    const created = await service.createStory(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createExperienceStoryErrorResponse(error);
  }
}

