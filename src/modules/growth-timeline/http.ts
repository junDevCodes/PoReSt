import { NextResponse } from "next/server";
import { isGrowthTimelineServiceError } from "@/modules/growth-timeline/interface";

const INTERNAL_ERROR_MESSAGE = "서버 오류가 발생했습니다.";

export function createGrowthTimelineInvalidJsonResponse() {
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

export function createGrowthTimelineErrorResponse(error: unknown) {
  if (isGrowthTimelineServiceError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          fields: error.fields,
        },
      },
      { status: error.status },
    );
  }

  console.error("growth-timeline API 오류:", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: INTERNAL_ERROR_MESSAGE,
      },
    },
    { status: 500 },
  );
}
