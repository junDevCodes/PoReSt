import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import {
  createJobTrackerService,
  createJobTrackerErrorResponse,
  createJobTrackerInvalidJsonResponse,
  createJobTrackerPayloadTooLargeResponse,
} from "@/modules/job-tracker";
import { NextResponse } from "next/server";

const service = createJobTrackerService({ prisma });

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createJobTrackerPayloadTooLargeResponse();
    }
    return createJobTrackerInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const card = await service.changeStatus(authResult.session.user.id, params.id, parsedBody.value);
    return NextResponse.json({ data: card });
  } catch (error) {
    return createJobTrackerErrorResponse(error);
  }
}
