import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createResumeErrorResponse, createResumesService } from "@/modules/resumes";

type ResumePreviewRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const resumesService = createResumesService({ prisma });

export async function GET(_: Request, context: ResumePreviewRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const preview = await resumesService.getResumePreviewForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: preview });
  } catch (error) {
    return createResumeErrorResponse(error);
  }
}

