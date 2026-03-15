import { NextResponse } from "next/server";
import { isPageViewServiceError } from "@/modules/pageviews/interface";

const INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다.";

export function createPageViewInvalidJsonResponse() {
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

export function createPageViewErrorResponse(error: unknown) {
  if (isPageViewServiceError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  console.error("방문 분석 API 오류:", error);
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
