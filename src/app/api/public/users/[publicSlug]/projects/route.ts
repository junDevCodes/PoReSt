import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectErrorResponse, createProjectsService } from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

type PublicProjectsRouteContext = {
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

export async function GET(_: Request, context: PublicProjectsRouteContext) {
  try {
    const params = await context.params;
    const projects = await projectsService.listPublicProjectsByPublicSlug(params.publicSlug);
    return NextResponse.json({ data: projects });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

