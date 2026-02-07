import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-guard";
import {
  createInvalidJsonResponse,
  createProjectErrorResponse,
  createProjectsService,
} from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

export async function GET() {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const projects = await projectsService.listProjectsForOwner(authResult.session.user.id);
    return NextResponse.json({ data: projects });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createInvalidJsonResponse();
  }

  try {
    const project = await projectsService.createProject(authResult.session.user.id, body);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}
