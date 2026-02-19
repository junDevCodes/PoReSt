import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import {
  createCompanyTargetsService,
  createCompanyTargetErrorResponse,
  createCompanyTargetInvalidJsonResponse,
  createCompanyTargetPayloadTooLargeResponse,
} from "@/modules/company-targets";

const service = createCompanyTargetsService({ prisma });

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limitParam = url.searchParams.get("limit") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const result = await service.listTargetsForOwner(authResult.session.user.id, {
      status,
      q,
      limit,
      cursor,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return createCompanyTargetErrorResponse(error);
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
      return createCompanyTargetPayloadTooLargeResponse();
    }
    return createCompanyTargetInvalidJsonResponse();
  }

  try {
    const created = await service.createTarget(authResult.session.user.id, parsedBody.value);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return createCompanyTargetErrorResponse(error);
  }
}

