# PoReSt 작업 검증 체크리스트

기준일: 2026-03-15
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T80-2 — 임베딩 자동화 ✅

---

### Gemini 통합

- [x] `rebuildForOwner()` — Gemini text-embedding-004 + deterministic fallback
- [x] `generateEmbeddingVector()` — `withGeminiFallback()` 패턴 적용
- [x] `embedSingleNote(ownerId, noteId)` — 단일 노트 임베딩 메서드
- [x] `queueEmbeddingForNote()` — fire-and-forget 트리거 함수
- [x] `createNoteEmbeddingPipelineService({ prisma, geminiClient? })` — DI 지원

### 콘텐츠 준비

- [x] `buildEmbeddingContent()` — 제목+태그+요약+본문 조합
- [x] 9500자 절삭 (Gemini 10000자 입력 제한 대응)
- [x] 태그 없으면 태그 줄 생략
- [x] 요약 없으면 요약 줄 생략

### 자동 트리거

- [x] POST `/api/app/notes` — 노트 생성 후 `queueEmbeddingForNote()` 호출
- [x] PUT `/api/app/notes/[id]` — 노트 수정 후 `queueEmbeddingForNote()` 호출
- [x] fire-and-forget: API 응답 지연 없이 비동기 실행
- [x] 실패 시 에러 삼키고 `console.warn` 로그

### Fallback 동작

- [x] GEMINI_API_KEY 미설정 → deterministic fallback 즉시 실행
- [x] Gemini retryable 에러 (API_ERROR/RATE_LIMITED) → deterministic fallback
- [x] Gemini non-retryable 에러 (INVALID_INPUT) → FAILED 상태 기록

### 테스트 (17개)

- [x] buildEmbeddingContent: 제목+태그+요약+본문 조합 (1)
- [x] buildEmbeddingContent: 태그 없음 생략 (1)
- [x] buildEmbeddingContent: 요약 없음 생략 (1)
- [x] buildEmbeddingContent: 9500자 절삭 (1)
- [x] rebuildForOwner: Gemini AI 임베딩 사용 (1)
- [x] rebuildForOwner: Gemini 미설정 시 deterministic fallback (1)
- [x] rebuildForOwner: retryable 에러 시 fallback 전환 (1)
- [x] rebuildForOwner: non-retryable 에러 시 FAILED 기록 (1)
- [x] embedSingleNote: 성공 (1)
- [x] embedSingleNote: 존재하지 않는 노트 빈 결과 (1)
- [x] embedSingleNote: 실패 시 FAILED 기록 (1)
- [x] embedSingleNote: Gemini 미설정 시 fallback 성공 (1)
- [x] queueEmbeddingForNote: fire-and-forget 호출 (1)
- [x] queueEmbeddingForNote: 실패 시 에러 삼키기 (1)
- [x] buildDeterministicEmbeddingVector: 동일 입력 동일 결과 (1)
- [x] buildDeterministicEmbeddingVector: 다른 입력 다른 결과 (1)
- [x] buildDeterministicEmbeddingVector: 빈 입력 영벡터 (1)

### T80-2 게이트 4종

- [x] `npm run lint` 통과 (0 errors, 18 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (56 suites, 246 tests)
- [x] `npm run vercel-build` 통과

---

## T80-3 — 노트 AI 평가 ✅

---

### 아키텍처

- [x] `buildNoteFeedbackItems()` — Gemini LLM 경로 + regex fallback 통합
- [x] `buildNoteFeedbackItemsRegex()` — 기존 regex 로직 분리 (fallback)
- [x] `buildNoteFeedbackItemsWithAI()` — Gemini LLM 호출 경로
- [x] `withGeminiFallback()` — AI/fallback 자동 분기

### LLM 프롬프트

- [x] `NOTE_FEEDBACK_SYSTEM_PROMPT` — 노트 평가 전문가 페르소나
- [x] 5가지 평가 기준: 완성도, 구조, 근거, 명확성, 태그
- [x] JSON 배열 출력 형식 지시
- [x] 최대 5개 항목 제한
- [x] `buildNoteFeedbackPrompt()` — 노트 정보(제목/태그/요약/본문) 포함

### 응답 파싱

- [x] `parseNoteFeedbackResponse()` — LLM 텍스트 → FeedbackItemDraft[]
- [x] 코드 블록(`\`\`\`json`) 마커 자동 제거
- [x] JSON 배열 추출 (텍스트 앞뒤에 설명 있어도 추출)
- [x] severity 검증 (INFO/WARNING/CRITICAL만 허용)
- [x] title/message 빈 문자열 필터링
- [x] 최대 5개 슬라이싱
- [x] suggestion 없으면 null 처리
- [x] 파싱 실패 시 에러 throw (not silent)

### Fallback 동작

- [x] GEMINI_API_KEY 미설정 → regex fallback 즉시 실행
- [x] LLM retryable 에러 (API_ERROR/RATE_LIMITED) → regex fallback
- [x] LLM non-retryable 에러 (INVALID_INPUT) → 에러 전파
- [x] LLM 응답 파싱 실패 → GeminiClientError(retryable) → fallback 전환
- [x] LLM 정상 빈 배열 [] → "AI 점검 통과" INFO 항목

### 추적성

- [x] AI 생성 피드백 `evidenceJson: { source: "gemini" }` 추가
- [x] Regex fallback 피드백은 evidenceJson 없음 (기존 동작 유지)

### 테스트 (17개)

- [x] parseNoteFeedbackResponse: 유효 JSON 변환 (1)
- [x] parseNoteFeedbackResponse: 코드 블록 파싱 (1)
- [x] parseNoteFeedbackResponse: 빈 배열 반환 (1)
- [x] parseNoteFeedbackResponse: JSON 없는 텍스트 에러 (1)
- [x] parseNoteFeedbackResponse: 유효하지 않은 JSON 에러 (1)
- [x] parseNoteFeedbackResponse: 잘못된 severity 필터링 (1)
- [x] parseNoteFeedbackResponse: 최대 5개 제한 (1)
- [x] parseNoteFeedbackResponse: 빈 title/message 필터링 (1)
- [x] parseNoteFeedbackResponse: suggestion 없으면 null (1)
- [x] parseNoteFeedbackResponse: CRITICAL severity 처리 (1)
- [x] parseNoteFeedbackResponse: JSON 앞뒤 텍스트 추출 (1)
- [x] buildNoteFeedbackPrompt: 노트 정보 포함 (1)
- [x] buildNoteFeedbackPrompt: 태그/요약 없음 처리 (1)
- [x] buildNoteFeedbackPrompt: 공백 요약 처리 (1)
- [x] NOTE_FEEDBACK_SYSTEM_PROMPT: 5가지 평가 기준 (1)
- [x] NOTE_FEEDBACK_SYSTEM_PROMPT: JSON 출력 지시 (1)
- [x] NOTE_FEEDBACK_SYSTEM_PROMPT: 최대 항목 수 (1)

---

### 게이트 4종

- [x] `npm run lint` 통과 (0 errors, 12 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (57 suites, 263 tests)
- [x] `npm run vercel-build` 통과

---

### 매 태스크 종료 시 공통

- [x] 게이트 4종 통과
- [x] Jest 테스트 17개 통과 (note-ai-feedback.test.ts)
- [x] Vercel 배포 성공 (`4ba94ca`)
- [x] 프로덕션 검증 (홈, 포트폴리오, 사이트맵)
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
