// ─────────────────────────────────────────────
// 자기소개서 임베딩 모듈 — HTTP 에러 응답 헬퍼
// T97: 합격 자소서 RAG 파이프라인
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { isCoverLetterEmbeddingServiceError } from "@/modules/cover-letter-embeddings/interface";

const INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다.";

export function createCoverLetterEmbeddingErrorResponse(error: unknown) {
  if (isCoverLetterEmbeddingServiceError(error)) {
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

  console.error("자기소개서 임베딩 API 오류:", error);
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
