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
    const target = await service.getTargetForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: target });
  } catch (error) {
    return createCompanyTargetErrorResponse(error);
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
      return createCompanyTargetPayloadTooLargeResponse();
    }
    return createCompanyTargetInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const target = await service.updateTarget(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    return NextResponse.json({ data: target });
  } catch (error) {
    return createCompanyTargetErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const result = await service.deleteTarget(authResult.session.user.id, params.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return createCompanyTargetErrorResponse(error);
  }
}
