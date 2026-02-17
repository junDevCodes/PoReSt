import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectErrorResponse, createProjectsService } from "@/modules/projects";

const projectsService = createProjectsService({ prisma });

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const rawLimit = query.get("limit");
    const result = await projectsService.searchPublicUsersDirectory({
      q: query.get("q") ?? undefined,
      limit: rawLimit === null ? undefined : Number(rawLimit),
      cursor: query.get("cursor") ?? undefined,
    });

    return NextResponse.json({
      data: result.items,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    return createProjectErrorResponse(error);
  }
}
