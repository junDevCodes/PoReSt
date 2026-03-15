# PoReSt 작업 검증 체크리스트

기준일: 2026-03-16
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T80-6 — 자동 후보 엣지 ✅

---

### generateCandidateEdgesForNote

- [x] 임베딩 유사 노트 기반 CANDIDATE 엣지 생성 (`status: CANDIDATE`, `origin: AUTO`)
- [x] MAX(임베딩 코사인, 태그 Jaccard) 가중치 계산
- [x] 동일 도메인(노트북) 가중치 보너스 +0.1 적용
- [x] 가중치 상한 1.0 cap
- [x] 기존 엣지 중복 방지 (normalizePairKey)
- [x] fromId < toId 정규화
- [x] 상위 20개 후보만 저장
- [x] 소스 노트 미존재 → 빈 배열 반환
- [x] 빈 유사 노트 배열 → 빈 배열 반환 (DB 조회 없음)
- [x] 삭제된 후보 노트 스킵 (`deletedAt: null` 필터)
- [x] reason에 임베딩 유사도 포함 (`임베딩 유사도: 0.XXXX`)
- [x] reason에 태그 교집합 포함 (태그 유사도 > 0인 경우)
- [x] reason에 동일 도메인 가중치 표시 (해당 시)
- [x] 태그 없는 노트 쌍에서도 임베딩 점수로 엣지 생성

### queueEmbeddingAndEdgesForNote

- [x] `embedSingleNote()` 성공 (succeeded > 0) 후 유사 검색 실행
- [x] `searchSimilarNotesForOwner()` 호출 (limit: 10, minScore: 0.5)
- [x] 유사 노트 있으면 `edgeCallback()` 호출 (noteId + score 전달)
- [x] 임베딩 실패 시 엣지 콜백 미호출
- [x] 임베딩 succeeded=0이면 엣지 콜백 미호출
- [x] 유사 노트 없으면 엣지 콜백 미호출
- [x] 엣지 콜백 실패 시 에러 삼키고 warn 로그
- [x] `edgeCallback: null`이면 유사 검색 자체 스킵
- [x] fire-and-forget 패턴 (API 응답 지연 없음)

### API 연동

- [x] POST `/api/app/notes` — `queueEmbeddingAndEdgesForNote()` 호출
- [x] PUT `/api/app/notes/[id]` — `queueEmbeddingAndEdgesForNote()` 호출
- [x] `EdgeGenerationCallback` 타입으로 notesService.generateCandidateEdgesForNote 연결

### 테스트 (18개)

- [x] 임베딩 유사 노트 기반 CANDIDATE 엣지 생성 (1)
- [x] 빈 유사 노트 배열 → 빈 배열 반환 (1)
- [x] 소스 노트 미존재 → 빈 배열 반환 (1)
- [x] 기존 엣지 중복 스킵 (1)
- [x] 동일 도메인 가중치 보너스 (1)
- [x] MAX(임베딩, 태그) 가중치 (1)
- [x] fromId < toId 정규화 (1)
- [x] 삭제된 후보 노트 스킵 (1)
- [x] reason에 임베딩 유사도 포함 (1)
- [x] 태그 없는 노트 임베딩 엣지 생성 (1)
- [x] 가중치 상한 1.0 (1)
- [x] 상위 20개 제한 (1)
- [x] 임베딩 성공 → 유사 검색 → 엣지 콜백 호출 (1)
- [x] 임베딩 실패 → 엣지 콜백 미호출 (1)
- [x] succeeded=0 → 엣지 콜백 미호출 (1)
- [x] 유사 노트 없음 → 엣지 콜백 미호출 (1)
- [x] 엣지 콜백 실패 → 에러 삼키기 (1)
- [x] edgeCallback null → 스킵 (1)

### T80-6 게이트 4종

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (59 suites, 292 tests)
- [x] `npm run vercel-build` 통과

---

### Playwright 브라우저 검증

- [x] 홈페이지 정상 렌더링 (타이틀 확인)
- [x] 포트폴리오 공개 페이지 정상 (프로필/프로젝트/경력/기술 스택)
- [x] Private API 인증 보호 (notes/edges/analytics → 401)
- [x] Public API 정상 (pageviews 201, 422, 404)
- [x] Sitemap XML 200 반환

---

### 매 태스크 종료 시 공통

- [x] 게이트 4종 통과
- [x] Jest 테스트 18개 통과 (auto-candidate-edges.test.ts)
- [x] Playwright 브라우저 검증 통과
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
