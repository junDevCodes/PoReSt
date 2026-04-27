import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { prisma } from "@/lib/prisma";
import {
  createJundevOsErrorResponse,
  createJundevOsInvalidJsonResponse,
  createJundevOsPayloadTooLargeResponse,
  createJundevOsService,
} from "@/modules/jundev-os";

const service = createJundevOsService({ prisma });

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createJundevOsPayloadTooLargeResponse();
    }
    return createJundevOsInvalidJsonResponse();
  }

  try {
    const { id } = await context.params;
    const decision = await service.resolveDecision(
      authResult.session.user.id,
      id,
      parsedBody.value as Parameters<typeof service.resolveDecision>[2],
    );
    return NextResponse.json({ data: decision });
  } catch (error) {
    return createJundevOsErrorResponse(error);
  }
}
