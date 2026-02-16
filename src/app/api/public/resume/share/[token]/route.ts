import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResumeErrorResponse, createResumesService } from "@/modules/resumes";

type PublicResumeShareRouteContext = {
  params: Promise<{ token: string }> | { token: string };
};

const resumesService = createResumesService({ prisma });

export async function GET(_: Request, context: PublicResumeShareRouteContext) {
  try {
    const params = await context.params;
    const preview = await resumesService.getResumePreviewByShareToken(params.token);
    return NextResponse.json({ data: preview });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}
