import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectErrorResponse, createProjectsService } from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

type PublicProjectDetailRouteContext = {
  params: Promise<{ publicSlug: string; slug: string }> | { publicSlug: string; slug: string };
};

export async function GET(_: Request, context: PublicProjectDetailRouteContext) {
  try {
    const params = await context.params;
    const project = await projectsService.getPublicProjectByPublicSlugAndSlug(
      params.publicSlug,
      params.slug,
    );
    return NextResponse.json({ data: project });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

