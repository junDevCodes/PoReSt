import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { revalidatePublicPortfolio } from "@/lib/revalidate-public";
import {
  createInvalidJsonResponse,
  createProjectPayloadTooLargeResponse,
  createProjectErrorResponse,
  createProjectsService,
} from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

type ProjectIdRouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_: Request, context: ProjectIdRouteContext) {
  const authResult = await requireAuth();
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
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBodyWithLimit(request);
  if (!parsedBody.ok) {
    if (parsedBody.reason === "PAYLOAD_TOO_LARGE") {
      return createProjectPayloadTooLargeResponse();
    }
    return createInvalidJsonResponse();
  }

  try {
    const params = await context.params;
    const project = await projectsService.updateProject(
      authResult.session.user.id,
      params.id,
      parsedBody.value,
    );
    revalidatePublicPortfolio(project.slug);
    return NextResponse.json({ data: project });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: ProjectIdRouteContext) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const params = await context.params;
    const deleted = await projectsService.deleteProject(authResult.session.user.id, params.id);
    revalidatePublicPortfolio();
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

