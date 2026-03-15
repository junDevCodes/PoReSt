# PoReSt 작업 상세 계획서

기준일: 2026-03-16
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T80-6 — 자동 후보 엣지 ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 후보 엣지 생성 | 태그 Jaccard만 (수동 트리거) | 임베딩 유사도 + 태그 Jaccard + 자동 트리거 |
| 자동 생성 시점 | 없음 | 노트 생성/수정 → 임베딩 완료 후 자동 |
| 가중치 계산 | 태그 Jaccard 단독 | MAX(임베딩 코사인, 태그 Jaccard) |
| 트리거 함수 | `queueEmbeddingForNote()` | `queueEmbeddingAndEdgesForNote()` 체인 |

### 핵심 변경

1. **`generateCandidateEdgesForNote()`** — 단일 노트 임베딩 유사도 기반 CANDIDATE 엣지 생성
   - 소스 노트 + 후보 노트 조회 → 기존 엣지 중복 방지
   - 임베딩 점수 + 태그 Jaccard 동시 계산
   - MAX(임베딩, 태그) 최종 가중치 + 동일 도메인 보너스(+0.1)
   - fromId < toId 정규화, 상위 20개 제한
   - reason에 임베딩 유사도/태그 교집합/도메인 보너스 포함

2. **`queueEmbeddingAndEdgesForNote()`** — 임베딩 → 유사 검색 → 엣지 생성 체인
   - `embedSingleNote()` 성공 후 `searchSimilarNotesForOwner()` 호출
   - 유사 노트 있으면 `edgeCallback()`으로 엣지 생성
   - fire-and-forget 패턴, 에러 삼키기 + warn 로그
   - `edgeCallback: null`이면 엣지 생성 스킵

3. **API 라우트 연동**
   - POST `/api/app/notes` — `queueEmbeddingAndEdgesForNote()` 교체
   - PUT `/api/app/notes/[id]` — `queueEmbeddingAndEdgesForNote()` 교체

### 변경 파일 목록

**수정:**
- `src/modules/notes/interface.ts` — `EmbeddingSimilarityInput` 타입, `generateCandidateEdgesForNote` 메서드
- `src/modules/notes/implementation.ts` — 임베딩 기반 엣지 생성 구현
- `src/modules/note-embeddings/implementation.ts` — `queueEmbeddingAndEdgesForNote()`, `EdgeGenerationCallback` 타입
- `src/app/api/app/notes/route.ts` — 오케스트레이터 교체
- `src/app/api/app/notes/[id]/route.ts` — 오케스트레이터 교체

**신규:**
- `src/modules/notes/tests/auto-candidate-edges.test.ts` — 18개 테스트

### 완료 기준

- [x] `generateCandidateEdgesForNote()` 임베딩 유사 노트 기반 CANDIDATE 엣지 생성
- [x] MAX(임베딩 코사인, 태그 Jaccard) 가중치 계산
- [x] 동일 도메인 가중치 보너스 (+0.1, 상한 1.0)
- [x] 기존 엣지 중복 방지 (normalizePairKey)
- [x] fromId < toId 정규화
- [x] 상위 20개 후보 제한
- [x] 소스 노트 미존재 시 빈 배열 반환
- [x] 빈 유사 노트 배열 시 빈 배열 반환
- [x] 삭제된 후보 노트 스킵
- [x] reason에 임베딩 유사도 포함
- [x] `queueEmbeddingAndEdgesForNote()` 임베딩 → 엣지 체인
- [x] 임베딩 실패 시 엣지 콜백 미호출
- [x] 유사 노트 없으면 엣지 콜백 미호출
- [x] 엣지 콜백 실패 시 에러 삼키기
- [x] edgeCallback null이면 스킵
- [x] 테스트 18개 통과
- [x] 게이트 4종 통과

### 게이트

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (59 suites, 292 tests)
- [x] `npm run vercel-build` 통과
- [x] push 완료 (`976317b`)

---

## 다음 태스크: T80-5 (병렬 진행 중) → T83/T84

T80-5 완료 후 M8 종결:
- T83: 엔티티 연결 (Experience ↔ Project ↔ Skill)
- T84: 지원 이력 트래커 (칸반 + JD 매칭)
