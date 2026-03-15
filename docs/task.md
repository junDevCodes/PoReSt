# PoReSt 작업 상세 계획서

기준일: 2026-03-15
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## 현재 태스크: T80-1 — Gemini 클라이언트 모듈 ✅ 완료

### 배경

T79(커스텀 레이아웃) + T82(방문 분석) 완료 후 Wave6(AI Growth) 진입.
T80-1은 Gemini API 래퍼 모듈로, T80-2(임베딩), T80-3(노트 AI), T80-4(HR 피드백)의 공통 기반.

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| Gemini SDK | 없음 | `@google/generative-ai` 설치 |
| 클라이언트 모듈 | 없음 | `src/modules/gemini/` (interface → implementation → http → index) |
| 임베딩 API | deterministic hash | Gemini `text-embedding-004` (1536차원) + fallback |
| 텍스트 생성 API | regex 패턴 | Gemini `gemini-2.0-flash` + fallback |
| Fallback 전략 | 없음 | `withGeminiFallback()` — AI/deterministic 자동 분기 |
| 환경변수 | 없음 | `GEMINI_API_KEY` (.env.example 등록) |

### 모듈 구조

```
src/modules/gemini/
├── interface.ts          — GeminiClient 인터페이스, 에러 클래스, 타입 정의
├── implementation.ts     — createGeminiClient(), withGeminiFallback(), 싱글턴
├── http.ts              — API 에러 응답 헬퍼
├── index.ts             — 모듈 export
└── tests/
    └── client.test.ts   — SDK mock 기반 26개 테스트
```

### 핵심 API

**GeminiClient 인터페이스:**
- `isConfigured()` — API 키 설정 여부
- `generateEmbedding(content)` — 텍스트 → 1536차원 벡터
- `generateText(prompt, options?)` — LLM 텍스트 생성 (systemPrompt, temperature, maxOutputTokens)

**withGeminiFallback(client, aiPath, fallbackPath):**
- `isConfigured() === false` → fallback 즉시 실행
- AI 경로 retryable 실패 → fallback 자동 전환 + warn 로그
- AI 경로 non-retryable 에러 → 에러 전파 (입력 검증 등)

### 변경 파일 목록

**신규:**
- `src/modules/gemini/interface.ts`
- `src/modules/gemini/implementation.ts`
- `src/modules/gemini/http.ts`
- `src/modules/gemini/index.ts`
- `src/modules/gemini/tests/client.test.ts`

**수정:**
- `package.json` — `@google/generative-ai` 의존성 추가
- `.env.example` — `GEMINI_API_KEY` 섹션 추가

---

## T80-1 완료 기준

- [x] `@google/generative-ai` SDK 설치
- [x] GeminiClient 인터페이스 (임베딩 + 텍스트 생성)
- [x] GEMINI_API_KEY 미설정 시 NOT_CONFIGURED 에러
- [x] withGeminiFallback() AI/fallback 분기 유틸리티
- [x] SDK mock 기반 테스트 26개 통과
- [x] 게이트 4종 통과

## T80-1 게이트

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (55 suites, 229 tests)
- [x] `npm run vercel-build` 통과
- [x] push 후 Vercel 배포 성공 (`1630168`)

---

## 다음 태스크: T80-2/T80-3/T80-4 — 병렬 가능 (대기)

T80-1 ✅ 완료. plan.md Wave6 참조.

- T80-2: 임베딩 자동화 (Gemini text-embedding-004 → NoteEmbedding)
- T80-3: 노트 AI 평가 (Gemini gemini-2.0-flash → FeedbackItem)
- T80-4: HR 피드백 LLM (포트폴리오/이력서 AI 분석)
