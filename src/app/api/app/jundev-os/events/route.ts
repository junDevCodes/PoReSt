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

export async function POST(request: Request) {
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
    const event = await service.createEvent(
      authResult.session.user.id,
      parsedBody.value as Parameters<typeof service.createEvent>[1],
    );
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    return createJundevOsErrorResponse(error);
  }
}
