# PoReSt 작업 상세 계획서

기준일: 2026-03-19
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T91 ✅ / T92 ✅ / T93 ✅ / T94 ✅ (Sprint 3 완료)

> history.md 참조. 기준선: 69 suites, 482 tests + E2E 17 tests.

---

## T95 — 화면 전환 속도 병목 진단 ✅

> history.md 참조. D1~D9 전체 완료. P1/P2/P3 우선순위 확정.

---

## T96 — 진단 기반 성능 최적화 적용 ✅ 완료 (통합 게이트 최종 검증 2026-03-19)

### 배경

T95 진단 결과: **P1 병목 = loading.tsx 전무 (27개 페이지) + 레이아웃 Suspense 없음**

현재 private 페이지 loading.tsx **0개**. 공개 포트폴리오에만 T90에서 3개 추가.
사용자가 사이드바 메뉴를 클릭하면 빈 화면 → 콘텐츠가 나타나는 "깜빡임"이 체감 느림의 핵심 원인.

### 핵심 원칙

- **기존 포트폴리오 스켈레톤 패턴 재사용**: `animate-pulse` + `bg-black/10 dark:bg-white/10` (T90 패턴)
- **실제 페이지 레이아웃 매칭**: 각 스켈레톤은 해당 page.tsx의 구조를 반영하여 CLS 방지
- **공통 패턴 추출**: 목록 페이지(제목+카드 그리드), 대시보드 페이지(요약 카드+차트), 클라이언트 페이지(제목+로딩) 3가지 패턴

### 스켈레톤 패턴 분류

| 패턴 | 구조 | 해당 페이지 |
|---|---|---|
| **목록형** | h1 제목 + 카드 그리드 (2~3열) | projects, resumes, experiences, notes, blog, skills, testimonials |
| **대시보드형** | 요약 카드 행 + 차트/히트맵 영역 | 홈(page.tsx), analytics, growth-timeline |
| **클라이언트형** | h1 제목 + 로딩 스피너/카드 | feedback, audit, company-targets, domain-links, experience-stories, job-tracker |
| **설정형** | 폼 필드 스켈레톤 | portfolio/settings |

---

### 확정 작업 항목 (18개 — 신규 파일 17개 + layout 수정 1개)

#### Session A: 주요 페이지 loading.tsx (12개 신규) ✅

| # | 파일 | 패턴 | 상태 |
|---|---|---|---|
| A1 | `app/loading.tsx` | 대시보드형 (헤더+체크리스트+메트릭 4카드) | ✅ |
| A2 | `app/projects/loading.tsx` | 목록형 (h1+필터+카드 리스트) | ✅ |
| A3 | `app/resumes/loading.tsx` | 목록형 (h1+2버튼+카드 리스트) | ✅ |
| A4 | `app/experiences/loading.tsx` | 목록형 (h1+입력폼+카드 리스트) | ✅ |
| A5 | `app/notes/loading.tsx` | 목록형 (h1+2열 노트북/작성폼+노트 목록) | ✅ |
| A6 | `app/blog/loading.tsx` | 목록형 (h1+버튼+카드 리스트) | ✅ |
| A7 | `app/skills/loading.tsx` | 목록형 (h1+폼+프리셋 그리드+스킬 리스트) | ✅ |
| A8 | `app/analytics/loading.tsx` | 대시보드형 (4카드+바차트+2열 분포) | ✅ |
| A9 | `app/growth-timeline/loading.tsx` | 대시보드형 (3카드+히트맵+2열 차트) | ✅ |
| A10 | `app/feedback/loading.tsx` | 클라이언트형 (h1+버튼+카드 리스트) | ✅ |
| A11 | `app/job-tracker/loading.tsx` | 클라이언트형 (h1+칸반 6열) | ✅ |
| A12 | `app/testimonials/loading.tsx` | 클라이언트형 (h1+버튼+카드 리스트) | ✅ |

#### Session B: 레이아웃 Suspense + 나머지 loading.tsx (5개 신규 + 1개 수정)

| # | 파일 | 패턴 | 설명 |
|---|---|---|---|
| B1 | `layout.tsx` 수정 | — | `{children}`을 `<Suspense fallback={<워크스페이스 스켈레톤>}>` 래핑 |
| B2 | `app/audit/loading.tsx` | 클라이언트형 | h1 "감사 로그" + 테이블 placeholder |
| B3 | `app/company-targets/loading.tsx` | 클라이언트형 | h1 "기업 분석" + 카드 리스트 |
| B4 | `app/domain-links/loading.tsx` | 클라이언트형 | h1 "교차 링크" + 테이블 placeholder |
| B5 | `app/experience-stories/loading.tsx` | 클라이언트형 | h1 "STAR 스토리" + 카드 리스트 |
| B6 | `app/portfolio/settings/loading.tsx` | 설정형 | h1 "설정" + 폼 필드 스켈레톤 |

### 병렬 실행 구조

```
Session A (주요 12개)                Session B (레이아웃 + 5개)
──────────────────                  ──────────────────────
A1. 홈 대시보드 ✅                   B1. layout.tsx Suspense ✅/❌
A2. 프로젝트 ✅                     B2. 감사 로그 ✅/❌
A3. 이력서 ✅                       B3. 기업 분석 ✅/❌
A4. 경력 ✅                         B4. 교차 링크 ✅/❌
A5. 노트 ✅                         B5. STAR 스토리 ✅/❌
A6. 블로그 ✅                       B6. 포트폴리오 설정 ✅/❌
A7. 스킬 ✅
A8. 분석 ✅
A9. 성장 타임라인 ✅
A10. 피드백 ✅
A11. 지원 트래커 ✅
A12. 추천서 ✅
       ↘      통합: 게이트 4종 + E2E 17개 + 체감 확인       ↙
```

### 세션별 수정 파일 (충돌 없음)

| 세션 | 파일 | 수 |
|---|---|---|
| **Session A** | `app/loading.tsx` 외 11개 신규 (전부 loading.tsx) | 12개 |
| **Session B** | `layout.tsx` 수정 1개 + `app/*/loading.tsx` 신규 5개 | 6개 |

### B1 Suspense 경계 상세

현재 `layout.tsx`:
```tsx
// 현재: 세션 페칭 블로킹
const session = await getServerSession(authOptions);
return <AppShellWrapper userName={userName}>{children}</AppShellWrapper>;
```

변경 방향:
```tsx
// Suspense로 children 스트리밍
return (
  <AppShellWrapper userName={userName}>
    <Suspense fallback={<WorkspaceSkeleton />}>
      {children}
    </Suspense>
  </AppShellWrapper>
);
```
→ 사이드바는 즉시 렌더링, 메인 콘텐츠만 스트리밍 대기

### 제약 사항

- 기존 테스트 기준선 유지 (69 suites, 482 tests + E2E 17 tests)
- 게이트 4종 통과 (lint/build/jest/vercel-build)
- 스켈레톤 = 실제 페이지 구조 매칭 (CLS 방지)
- `animate-pulse` + `bg-black/10 dark:bg-white/10` (기존 T90 패턴)
- 외부 라이브러리 추가 없음 (Tailwind only)

### 제외 (archive 이관)

- P2: 중복 인증 통합 — 아키텍처 변경 큼, 체감 영향 낮음
- P3: 번들 크기 심화 — 서버 전용 라이브러리 영향 없음

---

## T96-H — T96 코드 리뷰 핫픽스 ✅ 완료 (2026-03-19)

### 배경

T96 완료 후 시니어 코드 리뷰(2026-03-19)에서 발견된 이슈. 프로덕션 배포 완료 상태이므로 핫픽스로 처리.

### 수정 항목

#### H1: Job Tracker 스켈레톤 레이아웃 불일치 (P1)

**문제**: `job-tracker/loading.tsx`가 `grid grid-cols-6 gap-3`을 사용하지만, 실제 `page.tsx`는 `flex gap-4 overflow-x-auto` + `w-64 min-w-[256px]` 패턴. 모바일/태블릿에서 스켈레톤이 실제 페이지와 크게 다르고 CLS 유발 가능.

**수정**:
```tsx
// Before: grid grid-cols-6 gap-3
// After:
<div className="mt-8 flex gap-4 overflow-x-auto pb-4">
  {Array.from({ length: 6 }).map((_, col) => (
    <div key={col} className="w-64 min-w-[256px] flex-shrink-0 rounded-xl border-2 border-black/10 bg-white p-3">
      ...
    </div>
  ))}
</div>
```

**파일**: `src/app/(private)/app/job-tracker/loading.tsx` (1개)

### 리뷰에서 확인된 보류 항목 (archive 이관)

| 심각도 | 항목 | 처리 |
|---|---|---|
| P2 | AppShellWrapper 다크모드 FOUC (`useState(false)` → useEffect 전환) | archive — 아키텍처 변경 필요 |
| P3 | `dark:` 접두사 이중 적용 방침 (globals.css 오버라이드 vs 명시적 dark:) | archive — 문서화만 필요 |

### 제약 사항

- 게이트 4종 통과 유지
- 기존 E2E 17개 회귀 없음

---

## T97 — 합격 자소서 RAG 파이프라인 ✅ 완료 (2026-03-19)

### 배경

구직 활동 진행 중. Gemini API KEY 입력 시 합격 자소서를 바탕으로 RAG 기반 프롬프팅.
archive.md "AI 자기소개서 생성" 복귀 (복귀 조건: 이력서 AI 초안 안정화 ✅).

### 완료 범위

1. **CoverLetter + CoverLetterEmbedding Prisma 모델** — 스키마 + 마이그레이션 + pgvector 인덱스
2. **cover-letters 모듈** — CRUD 서비스 (create/list/get/update/delete/toggleReference) + Zod 검증
3. **cover-letter-embeddings 모듈** — 임베딩 파이프라인 (rebuildForOwner/embedSingle/searchSimilarByQuery)
4. **RAG 검색** — 쿼리 텍스트 → Gemini 벡터 → 코사인 유사도 상위 3~5개 합격 자소서 검색
5. **프롬프트 설계** — "합격 자소서 작성 전문 컨설턴트" 페르소나 + few-shot 합격 예시 + 경력/스킬 자동 포함
6. **withGeminiFallback** — API KEY 없으면 구조화된 템플릿 fallback (지원동기/역량/성장/포부)
7. **테스트** — 37개 신규 (2 suites)

### 산출물

- `prisma/schema.prisma`: CoverLetter + CoverLetterEmbedding 모델, enum 2개
- `prisma/migrations/20260319120000_t97_cover_letter_rag/`: 마이그레이션 SQL
- `src/modules/cover-letters/`: interface + implementation + http + index
- `src/modules/cover-letter-embeddings/`: interface + implementation + http + index
- 테스트: `cover-letters.test.ts` (24개), `cover-letter-embeddings.test.ts` (13개)

### 게이트

- lint: 0 errors, 9 warnings ✅
- build: 성공 ✅
- jest: 71 suites, 519 tests ✅ (기존 69/482 + 신규 2/37)
- 기존 E2E 회귀 없음

---

## T97-H — T97 코드 리뷰 핫픽스 ✅ 완료 (2026-03-19)

### 배경

T97 완료 후 시니어 코드 리뷰(2026-03-19)에서 발견된 P1/P2 이슈. T98 착수 전 선행 수정.

### 수정 항목

#### H1: generateCoverLetter 자동 제목 120자 초과 버그 (P1)

**문제**: `generateCoverLetter()`에서 자동 생성하는 title이 `${targetCompany} ${targetRole} AI 초안` 패턴인데, targetCompany(120자) + targetRole(120자) = 최대 246자. 이후 `service.create()` 호출 시 createSchema의 MAX_TITLE_LENGTH(120) 검증에 걸려 VALIDATION_ERROR 발생.

**수정**: `implementation.ts:569` — title 생성 후 `.slice(0, 120)` 보호 추가

```typescript
// Before
const title = `${parsed.targetCompany} ${parsed.targetRole} AI 초안`;
// After
const title = `${parsed.targetCompany} ${parsed.targetRole} AI 초안`.slice(0, 120);
```

**파일**: `src/modules/cover-letters/implementation.ts` (1줄)

#### H2: Job Tracker 스켈레톤 다크모드 미대응 (P2)

**문제**: `job-tracker/loading.tsx`의 칸반 열 외곽(`:16`)과 내부 카드(`:25`)에 `bg-white` 하드코딩. 다크모드에서 흰 블록이 뜸.

**수정**: `bg-white` → `bg-white dark:bg-zinc-900` 적용

**파일**: `src/app/(private)/app/job-tracker/loading.tsx` (2줄)

### 리뷰 보류 항목 (archive 이관)

| 심각도 | 항목 | 처리 |
|---|---|---|
| P2 | 프롬프트 내 합격 자소서 본문 길이 상수화 (C3) | archive — 토큰 한도 검증 필요 |
| P2 | `$executeRawUnsafe` → `Prisma.sql` 전환 (E1) | archive — note-embeddings와 동시 리팩 |
| P3 | rebuildForOwner 직렬 → 병렬 배치 (E3) | archive — 현재 합격본 수 소규모 |
| P3 | CRUD findFirst+update 2쿼리 → 1쿼리 최적화 (C2) | archive — 성능 영향 미미 |
| P3 | resumeId/experienceId FK 관계 미선언 (S1) | archive — 의도적 loose coupling |
| P3 | generateCoverLetter 통합 테스트 부재 (T1) | archive — 서비스 단위 테스트 충분 |

### 제약 사항

- 게이트 4종 통과 유지
- 기존 테스트 기준선 유지 (71 suites, 519 tests)

---

## T98 — 자기소개서 생성 API + 워크스페이스 UI ✅ 완료 (통합 게이트 최종 검증 2026-03-19)

### 배경

T97에서 합격 자소서 RAG 파이프라인(스키마 + 모듈 + 테스트) 완료. 이제 사용자가 실제로 자기소개서를 생성/관리할 수 있는 API 엔드포인트와 워크스페이스 UI를 구현한다.

### 핵심 원칙

- **기존 패턴 재사용**: resumes/notes API 라우트 + 페이지 패턴 그대로 따름
- **T97 모듈 활용**: `createCoverLettersService`, `generateCoverLetter`, `createCoverLetterEmbeddingPipelineService` 그대로 사용
- **구직 실전**: 합격본 등록 → RAG 검색 → AI 생성 → 편집 → 저장 흐름 완성

### 확정 작업 항목 (2세션 병렬 — 파일 무충돌)

#### Session A: API 라우트 (5개 파일 신규) ✅ 완료

| # | 파일 | 메서드 | 설명 | 상태 |
|---|---|---|---|---|
| A1 | `api/app/cover-letters/route.ts` | GET, POST | 목록 조회 + 수동 생성 (CRUD) | ✅ |
| A2 | `api/app/cover-letters/[id]/route.ts` | GET, PATCH, DELETE | 상세 조회 + 수정 + 삭제 | ✅ |
| A3 | `api/app/cover-letters/[id]/toggle-reference/route.ts` | POST | 합격본 마킹 토글 (isReference) | ✅ |
| A4 | `api/app/cover-letters/generate/route.ts` | POST | RAG 기반 AI 자기소개서 생성 | ✅ |
| A5 | `api/app/cover-letters/[id]/embed/route.ts` | POST | 임베딩 수동 트리거 | ✅ |

**A1 상세 — Collection Route**:
```typescript
// GET: requireAuth → service.listForOwner(ownerId) → { data: [...] }
// POST: requireAuth → parseJsonBodyWithLimit → service.create(ownerId, body) → 201 { data }
```

**A2 상세 — Item Route**:
```typescript
// GET: requireAuth → params.id → service.getForOwner(ownerId, id) → { data }
// PATCH: requireAuth → parseJsonBodyWithLimit → service.update(ownerId, id, body) → { data }
// DELETE: requireAuth → params.id → service.delete(ownerId, id) → { data: { id } }
```

**A3 상세 — Toggle Reference**:
```typescript
// POST: requireAuth → params.id → service.toggleReference(ownerId, id)
//       → isReference=true 전환 시 queueEmbeddingForCoverLetter() 자동 트리거
//       → { data: updatedCoverLetter }
```

**A4 상세 — Generate (핵심)**:
```typescript
// POST: requireAuth → parseJsonBodyWithLimit
//       → generateCoverLetter(service, prisma, ownerId, body, searchSimilar)
//       → 201 { data: { coverLetter, source: "gemini" | "fallback" } }
//
// searchSimilar: embeddingService.searchSimilarByQuery(ownerId, queryText)
```

**A5 상세 — Embed**:
```typescript
// POST: requireAuth → params.id → embeddingService.embedSingle(ownerId, id) → { data: result }
```

#### Session B: 워크스페이스 UI (7개 파일 신규 + 2개 수정) ✅ 완료 (2026-03-19)

| # | 파일 | 유형 | 상태 |
|---|---|---|---|
| B1 | `components/app/AppSidebar.tsx` | 수정 | ✅ NAV_GROUPS에 "자기소개서" 추가 |
| B2 | `app/cover-letters/loading.tsx` | 신규 | ✅ 목록형 스켈레톤 (T96 패턴) |
| B3 | `app/cover-letters/page.tsx` | 신규 | ✅ 서버 컴포넌트: listForOwner → PageClient |
| B4 | `app/cover-letters/CoverLettersPageClient.tsx` | 신규 | ✅ 목록 + AI 생성 다이얼로그 + 합격본 등록 |
| B5 | `app/cover-letters/[id]/page.tsx` | 신규 | ✅ 서버 컴포넌트: getForOwner → DetailClient |
| B6 | `app/cover-letters/[id]/CoverLetterDetailClient.tsx` | 신규 | ✅ 편집 + 저장 + 삭제 + 합격본 토글 |
| B7 | `app/cover-letters/[id]/loading.tsx` | 신규 | ✅ 상세 페이지 스켈레톤 |
| B8 | `_lib/server-serializers.ts` | 수정 | ✅ CoverLetter List/Detail 직렬화 추가 |

**B3 상세 — List Page (서버 컴포넌트)**:
```typescript
// getRequiredOwnerSession("/app/cover-letters")
// → service.listForOwner(ownerId)
// → 직렬화(Date → ISO string)
// → <CoverLettersPageClient initialData={serialized} />
```

**B4 상세 — PageClient (핵심 UI)**:

1. **목록 카드**: 제목 + 회사/직무 + 상태(DRAFT/FINAL) + isReference 배지 + 업데이트 일시
2. **"AI 생성" 버튼**: 다이얼로그 열기 → targetCompany + targetRole + JD + 동기 힌트 입력 → POST /generate
3. **"합격본 등록" 버튼**: 다이얼로그 → 제목 + 본문 붙여넣기 + isReference=true + status=FINAL → POST /cover-letters
4. **카드 클릭**: `/app/cover-letters/[id]` 상세 페이지로 이동

**B5 상세 — Detail Page**:

1. **마크다운 편집기**: textarea + 실시간 미리보기 (또는 간단한 textarea)
2. **메타 편집**: title, targetCompany, targetRole, status 수정
3. **액션 버튼**: 저장(PATCH) + 삭제(DELETE) + 합격본 토글(POST toggle-reference)

### 병렬 실행 구조

```
Session A (API 5개)                    Session B (UI 6개 + 수정 1개)
──────────────────                    ──────────────────────────
A1. Collection route (GET/POST) ✅     B1. AppSidebar 메뉴 추가 ✅
A2. Item route (GET/PATCH/DELETE) ✅   B2. loading.tsx 스켈레톤 ✅
A3. toggle-reference route ✅          B3. page.tsx 서버 컴포넌트 ✅
A4. generate route (RAG) ✅            B4. PageClient 클라이언트 ✅
A5. embed route ✅                     B5. [id]/page.tsx 상세 ✅
                                       B6. [id]/loading.tsx 스켈레톤 ✅
       ↘      통합: 게이트 4종 + E2E + 브라우저 확인       ↙
```

### 세션별 수정 파일 (충돌 없음)

| 세션 | 파일 | 수 |
|---|---|---|
| **Session A** | `src/app/api/app/cover-letters/**/*.ts` 신규 5개 | 5개 |
| **Session B** | `AppSidebar.tsx` 수정 1개 + `app/cover-letters/**` 신규 5~6개 | 6~7개 |

### UI 디자인 기준

- **카드 스타일**: 기존 resumes/projects 카드 패턴 재사용
- **생성 다이얼로그**: shadcn Dialog + 폼 필드 4개 (회사/직무/JD/동기)
- **상태 배지**: DRAFT(회색), FINAL(초록), isReference=true(별 아이콘)
- **다크모드**: 기존 패턴 (`bg-black/10 dark:bg-white/10`) 준수
- **반응형**: 모바일 1열, 데스크톱 2~3열 카드 그리드

### 제약 사항

- 기존 테스트 기준선 유지 (71 suites, 519 tests)
- 게이트 4종 통과 (lint/build/jest/vercel-build)
- T97 모듈 코드 수정 없음 (API 라우트에서 조합만)
- 스켈레톤: `animate-pulse` + `bg-black/10 dark:bg-white/10` (T96 패턴)
- 외부 라이브러리 추가 없음 (기존 shadcn/ui + Tailwind only)
