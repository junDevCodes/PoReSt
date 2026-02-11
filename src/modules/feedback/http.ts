import { NextResponse } from "next/server";
import { isFeedbackServiceError } from "@/modules/feedback/interface";

const INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다.";

export function createFeedbackInvalidJsonResponse() {
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

export function createFeedbackPayloadTooLargeResponse() {
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

export function createFeedbackErrorResponse(error: unknown) {
  if (isFeedbackServiceError(error)) {
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

  console.error("피드백 API 오류:", error);
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
