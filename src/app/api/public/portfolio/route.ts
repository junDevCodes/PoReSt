import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectErrorResponse, createProjectsService } from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug") ?? undefined;
    const portfolio = await projectsService.getPublicPortfolio(slug);
    return NextResponse.json({ data: portfolio });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}
