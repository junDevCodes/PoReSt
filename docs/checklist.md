# PoReSt 작업 검증 체크리스트

기준일: 2026-03-15
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T80-1 — Gemini 클라이언트 모듈 ✅

---

### 모듈 구조

- [x] `src/modules/gemini/interface.ts` — GeminiClient 인터페이스, 에러 클래스, 타입 상수
- [x] `src/modules/gemini/implementation.ts` — createGeminiClient(), withGeminiFallback(), 싱글턴
- [x] `src/modules/gemini/http.ts` — createGeminiErrorResponse()
- [x] `src/modules/gemini/index.ts` — 모듈 export

### 인터페이스 검증

- [x] `GeminiClient.isConfigured()` — API 키 존재 시 true, 미설정/빈 문자열 시 false
- [x] `GeminiClient.generateEmbedding(content)` — 1536차원 벡터 반환
- [x] `GeminiClient.generateText(prompt, options?)` — 텍스트 + 모델명 + tokenCount 반환
- [x] `GeminiTextGenerationOptions` — model, systemPrompt, temperature, maxOutputTokens

### 에러 처리

- [x] NOT_CONFIGURED (503) — API 키 미설정 시
- [x] INVALID_INPUT (422) — 빈 텍스트, 길이 초과
- [x] EMPTY_RESPONSE (502) — SDK 응답 비어있을 때
- [x] API_ERROR (502, retryable) — SDK 일반 에러
- [x] RATE_LIMITED (429, retryable) — 429/rate limit 키워드 감지

### Fallback 전략

- [x] `withGeminiFallback()` — isConfigured() false → fallback 즉시 실행
- [x] `withGeminiFallback()` — AI 경로 retryable 실패 → fallback 자동 전환
- [x] `withGeminiFallback()` — AI 경로 non-retryable 에러 → 에러 전파

### 테스트 (26개)

- [x] isConfigured: API 키 있음/없음/빈 문자열 (3개)
- [x] generateEmbedding: 미설정/빈입력/긴입력/성공/빈응답/SDK에러/Rate limit (7개)
- [x] generateText: 미설정/빈입력/성공/커스텀옵션/빈응답/SDK에러 (6개)
- [x] GeminiClientError: 타입가드/retryable 플래그 (2개)
- [x] 싱글턴: 동일 인스턴스/리셋 (2개)
- [x] withGeminiFallback: fallback/AI/retryable전환/non-retryable전파 (4개)
- [x] 상수: 임베딩 모델/텍스트 모델 (2개)

### 환경변수

- [x] `.env.example`에 `GEMINI_API_KEY` 섹션 추가
- [x] `GEMINI_API_KEY` 미설정 시 기존 코드 영향 없음 (독립 모듈)

---

### 게이트 4종

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (55 suites, 229 tests)
- [x] `npm run vercel-build` 통과

---

### 매 태스크 종료 시 공통

- [x] 게이트 4종 통과
- [x] Jest SDK mock 기반 테스트 26개 통과
- [x] Vercel 배포 성공 (`1630168`)
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
