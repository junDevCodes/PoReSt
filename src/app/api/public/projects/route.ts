import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectErrorResponse, createProjectsService } from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

export async function GET() {
  try {
    const projects = await projectsService.listPublicProjects();
    return NextResponse.json({ data: projects });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}
