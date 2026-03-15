# PoReSt 작업 상세 계획서

기준일: 2026-03-15
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## 현재 태스크: T80-2/T80-3/T80-4 — 병렬 진행

### 배경

T80-1(Gemini 클라이언트 모듈) 완료 후 3개 AI 기능 병렬 진입.
각 세션이 독립적으로 `withGeminiFallback()` 패턴으로 AI/fallback 분기 구현.

---

## T80-3 — 노트 AI 평가 ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 노트 피드백 | regex 패턴 (4개 규칙) | Gemini `gemini-2.0-flash` LLM + regex fallback |
| 시스템 프롬프트 | 없음 | 5가지 평가 기준 (완성도/구조/근거/명확성/태그) |
| 응답 파싱 | 없음 | JSON 배열 파서 + 코드블록 추출 + 검증 |
| Fallback | 없음 | `withGeminiFallback()` — regex 자동 전환 |

### 핵심 변경

1. **기존 regex 로직 분리** — `buildNoteFeedbackItemsRegex()` (fallback)
2. **AI 경로 추가** — `buildNoteFeedbackItemsWithAI()` (Gemini LLM)
3. **`withGeminiFallback()` 통합** — GEMINI_API_KEY 미설정/AI 실패 시 regex fallback
4. **LLM 응답 파서** — `parseNoteFeedbackResponse()` (JSON 추출 + severity/title/message 검증)
5. **시스템 프롬프트** — `NOTE_FEEDBACK_SYSTEM_PROMPT` (5가지 평가 기준, 최대 5개 항목)
6. **AI 생성 추적** — `evidenceJson: { source: "gemini" }`

### 변경 파일 목록

**수정:**
- `src/modules/feedback/implementation.ts` — 노트 AI 평가 로직 추가

**신규:**
- `src/modules/feedback/tests/note-ai-feedback.test.ts` — 17개 테스트

### 완료 기준

- [x] `buildNoteFeedbackItems()` → Gemini LLM 호출 + regex fallback
- [x] `parseNoteFeedbackResponse()` JSON 파싱 + 검증 (severity/title/message)
- [x] `NOTE_FEEDBACK_SYSTEM_PROMPT` 5가지 평가 기준
- [x] GEMINI_API_KEY 미설정 → regex fallback 즉시 실행
- [x] LLM retryable 에러 → regex fallback 자동 전환
- [x] LLM 응답 파싱 실패 → GeminiClientError(retryable) → fallback
- [x] AI 생성 항목 `evidenceJson: { source: "gemini" }` 추적
- [x] 최대 5개 피드백 항목 제한
- [x] 테스트 17개 통과
- [x] 게이트 4종 통과

### 게이트

- [x] `npm run lint` 통과 (0 errors)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (57 suites, 263 tests)
- [x] `npm run vercel-build` 통과
- [x] push 후 Vercel 배포 성공 (`4ba94ca`)

---

## T80-2 — 임베딩 자동화 ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 임베딩 생성 | deterministic hash (재현 가능, 시맨틱 약함) | Gemini `text-embedding-004` + deterministic fallback |
| 임베딩 트리거 | 수동 `POST /embeddings/rebuild` | 노트 생성/수정 시 자동 (fire-and-forget) |
| 콘텐츠 준비 | `contentMd` 단독 | 제목+태그+요약+본문 조합 (`buildEmbeddingContent`) |
| Fallback | 없음 | `withGeminiFallback()` — 미설정/AI 실패 시 deterministic 자동 전환 |

### 핵심 변경

1. **Gemini 임베딩 통합** — `rebuildForOwner()`에서 `generateEmbeddingVector()` → Gemini + deterministic fallback
2. **콘텐츠 조합 헬퍼** — `buildEmbeddingContent(title, tags, summary, contentMd)` (9500자 절삭)
3. **단일 노트 임베딩** — `embedSingleNote(ownerId, noteId)` 메서드 추가
4. **자동 트리거** — `queueEmbeddingForNote()` fire-and-forget 함수
5. **API 연동** — POST `/api/app/notes`, PUT `/api/app/notes/[id]`에서 자동 호출
6. **DI 지원** — `createNoteEmbeddingPipelineService({ prisma, geminiClient? })` 테스트 편의

### 변경 파일 목록

**수정:**
- `src/modules/note-embeddings/interface.ts` — `embedSingleNote` 메서드 추가
- `src/modules/note-embeddings/implementation.ts` — Gemini 통합 + 자동 트리거
- `src/app/api/app/notes/route.ts` — POST 후 자동 임베딩
- `src/app/api/app/notes/[id]/route.ts` — PUT 후 자동 임베딩

**신규:**
- `src/modules/note-embeddings/tests/embedding-automation.test.ts` — 17개 테스트

### 완료 기준

- [x] `rebuildForOwner()` Gemini text-embedding-004 사용 + deterministic fallback
- [x] `embedSingleNote()` 단일 노트 임베딩
- [x] `queueEmbeddingForNote()` fire-and-forget
- [x] `buildEmbeddingContent()` 제목+태그+요약+본문 조합
- [x] 노트 생성 API(POST)에서 자동 임베딩 트리거
- [x] 노트 수정 API(PUT)에서 자동 임베딩 트리거
- [x] GEMINI_API_KEY 미설정 → deterministic fallback 즉시 실행
- [x] Gemini retryable 에러 → deterministic fallback 자동 전환
- [x] Gemini non-retryable 에러 → FAILED 상태 기록
- [x] 테스트 17개 통과
- [x] 게이트 4종 통과

### 게이트

- [x] `npm run lint` 통과 (0 errors, 18 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (56 suites, 246 tests)
- [x] `npm run vercel-build` 통과
- [x] push 후 Vercel 배포 성공 (`27f6a5f`)

---

## T80-4 — HR 피드백 LLM ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 포트폴리오 피드백 | deterministic 규칙 (5개 체크) | Gemini `gemini-2.0-flash` HR 분석 + deterministic fallback |
| 이력서 피드백 | deterministic 규칙 (4개 체크) | Gemini `gemini-2.0-flash` HR 분석 + deterministic fallback |
| 시스템 프롬프트 | 없음 | HR 10년차 시니어 리크루터 페르소나 |
| contextJson 활용 | 미사용 | 지원 회사/직무/JD 맥락 전달 |
| 응답 파싱 | 없음 | `parseFeedbackItemsFromLLM()` 공용 파서 |

### 핵심 변경

1. **포트폴리오 HR 피드백** — `buildPortfolioFeedbackItemsWithAI()` (확장된 데이터 조회: 링크, 스킬, 경력, 프로젝트)
2. **이력서 HR 피드백** — `buildResumeFeedbackItemsWithAI()` (경력 상세: bullets, metrics, techTags)
3. **HR 프롬프트 빌더** — `buildPortfolioFeedbackPrompt()`, `buildResumeFeedbackPrompt()` (4~5가지 평가 기준)
4. **공용 LLM 파서** — `parseFeedbackItemsFromLLM()` (코드블록 추출, severity 정규화, 길이 제한)
5. **contextJson 전달** — `buildFeedbackItemsByTarget()`에 contextJson 파라미터 추가, `runFeedbackRequestForOwner()`에서 전달
6. **AI 생성 추적** — `evidenceJson: { source: "gemini" }`
7. **Fallback 패턴** — `withGeminiFallback()` + `getDefaultGeminiClient()` 싱글턴

### 변경 파일 목록

**수정:**
- `src/modules/feedback/implementation.ts` — HR LLM 포트폴리오/이력서 피드백 추가
- `src/modules/feedback/interface.ts` — `skill` 모델 PrismaClient 추가

**신규:**
- `src/modules/feedback/tests/hr-feedback.test.ts` — 11개 테스트

### 완료 기준

- [x] `buildPortfolioFeedbackItemsWithAI()` — Gemini LLM + deterministic fallback
- [x] `buildResumeFeedbackItemsWithAI()` — Gemini LLM + deterministic fallback
- [x] `parseFeedbackItemsFromLLM()` — 공용 JSON 파서 (코드블록/severity/길이 제한)
- [x] HR 시스템 프롬프트 (10년차 시니어 리크루터 페르소나)
- [x] 포트폴리오 프롬프트 (4가지 평가 기준: 첫인상/완성도/차별화/접근성)
- [x] 이력서 프롬프트 (5가지 평가 기준: 직무적합/정량화/기술매칭/요약품질/경력서술)
- [x] contextJson 지원 (targetCompany/targetRole/jobDescription)
- [x] GEMINI_API_KEY 미설정 → deterministic fallback
- [x] LLM retryable 에러 → deterministic fallback
- [x] 테스트 11개 통과
- [x] 게이트 4종 통과

### 게이트

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (58 suites, 274 tests)
- [x] `npm run vercel-build` 통과
- [x] 커밋 `4ba94ca` (T80-3과 병렬 병합)

---

## 다음 태스크: T80-5/T80-6 (대기)

T80-2/3/4 완료 후:
- T80-5: AI 이력서 초안 (T80-4 의존)
- T80-6: 자동 후보 엣지 (T80-2 의존)
