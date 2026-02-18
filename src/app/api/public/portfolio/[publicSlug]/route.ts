import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectErrorResponse, createProjectsService } from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

type PublicSlugRouteContext = {
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

export async function GET(_: Request, context: PublicSlugRouteContext) {
  try {
    const params = await context.params;
    const portfolio = await projectsService.getPublicPortfolioBySlug(params.publicSlug);
    return NextResponse.json({ data: portfolio });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

