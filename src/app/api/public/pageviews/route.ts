import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import {
  createPageViewErrorResponse,
  createPageViewInvalidJsonResponse,
  createPageViewsService,
} from "@/modules/pageviews";

const pageViewsService = createPageViewsService({ prisma });

export async function POST(request: Request) {
  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    return createPageViewInvalidJsonResponse();
  }

  try {
    const pageView = await pageViewsService.recordPageView(parsedBody.value);
    return NextResponse.json({ data: pageView }, { status: 201 });
  } catch (error) {
    return createPageViewErrorResponse(error);
  }
}
