import { NextResponse } from "next/server";
import { isJundevOsServiceError } from "@/modules/jundev-os/interface";

export function createJundevOsInvalidJsonResponse() {
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

export function createJundevOsPayloadTooLargeResponse() {
  return NextResponse.json(
    {
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "요청 본문 크기는 1MB를 넘을 수 없습니다.",
      },
    },
    { status: 413 },
  );
}

export function createJundevOsErrorResponse(error: unknown) {
  if (isJundevOsServiceError(error)) {
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

  console.error("jundev-os API error:", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "서버 내부 오류가 발생했습니다.",
      },
    },
    { status: 500 },
  );
}
