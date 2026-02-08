import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectErrorResponse, createProjectsService } from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

type SlugRouteContext = {
  params: Promise<{ slug: string }> | { slug: string };
};

export async function GET(_: Request, context: SlugRouteContext) {
  try {
    const params = await context.params;
    const project = await projectsService.getPublicProjectBySlug(params.slug);
    return NextResponse.json({ data: project });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}
