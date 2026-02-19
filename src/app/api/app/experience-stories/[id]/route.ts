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

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const story = await service.getStoryForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: story });
  } catch (error) {
    return createExperienceStoryErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
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
    const params = await context.params;
    const story = await service.updateStory(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: story });
  } catch (error) {
    return createExperienceStoryErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const result = await service.deleteStory(authResult.session.user.id, params.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return createExperienceStoryErrorResponse(error);
  }
}
