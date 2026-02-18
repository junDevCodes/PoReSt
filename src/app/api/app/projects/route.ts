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

export async function GET() {
  const authResult = await requireAuth();
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
    const project = await projectsService.createProject(authResult.session.user.id, parsedBody.value);
    revalidatePublicPortfolio(project.slug);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}

