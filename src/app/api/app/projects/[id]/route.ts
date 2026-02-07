import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-guard";
import {
  createInvalidJsonResponse,
  createProjectErrorResponse,
  createProjectsService,
} from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

type ProjectIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_: Request, context: ProjectIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const project = await projectsService.getProjectForOwner(authResult.session.user.id, params.id);
    return NextResponse.json({ data: project });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

export async function PUT(request: Request, context: ProjectIdRouteContext) {
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
    const params = await context.params;
    const project = await projectsService.updateProject(authResult.session.user.id, params.id, body);
    return NextResponse.json({ data: project });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: ProjectIdRouteContext) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await projectsService.deleteProject(authResult.session.user.id, params.id);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}
