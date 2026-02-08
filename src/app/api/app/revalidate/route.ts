import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { parseJsonBodyWithLimit } from "@/lib/request-json";
import { revalidateCustomPaths } from "@/lib/revalidate-public";

const MAX_REVALIDATE_PATH_COUNT = 20;

function extractPaths(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is string => typeof item === "string")
    .slice(0, MAX_REVALIDATE_PATH_COUNT);
}

export async function POST(request: Request) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const expectedToken = process.env.REVALIDATE_TOKEN?.trim();
  if (!expectedToken) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "REVALIDATE_TOKEN 환경변수가 설정되지 않았습니다.",
        },
      },
      { status: 500 },
    );
  }

  const parsed = await parseJsonBodyWithLimit(request);
  if (!parsed.ok) {
    if (parsed.reason === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json(
        {
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "요청 본문 크기는 1MB를 초과할 수 없습니다.",
          },
        },
        { status: 413 },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "요청 본문이 올바른 JSON 형식이 아닙니다.",
        },
      },
      { status: 400 },
    );
  }

  const payload = (parsed.value ?? {}) as {
    token?: unknown;
    paths?: unknown;
  };
  const providedToken =
    request.headers.get("x-revalidate-token") ?? (typeof payload.token === "string" ? payload.token : "");

  if (providedToken.trim() !== expectedToken) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "리밸리데이트 토큰이 유효하지 않습니다.",
        },
      },
      { status: 403 },
    );
  }

  const paths = extractPaths(payload.paths);
  const revalidatedPaths = revalidateCustomPaths(paths);
  return NextResponse.json({
    data: {
      revalidated: true,
      paths: revalidatedPaths,
    },
  });
}
