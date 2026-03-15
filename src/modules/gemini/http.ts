import { NextResponse } from "next/server";
import { isGeminiClientError } from "@/modules/gemini/interface";

const INTERNAL_ERROR_MESSAGE = "AI 서비스 오류가 발생했습니다.";

export function createGeminiErrorResponse(error: unknown) {
  if (isGeminiClientError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
        },
      },
      { status: error.status },
    );
  }

  console.error("Gemini API 오류:", error);
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
