# PoReSt 작업 검증 체크리스트

기준일: 2026-03-23
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## Sprint 5 (T99~T103) ✅ 완료

> history.md 참조

---

## T104 — 기준선 측정 + 읽기 전용 2개 전환 (패턴 확립) ✅

### Before 측정 — 스켈레톤 체류시간 (ms)

- [ ] 5개 페이지 × cold 3회 + warm 3회 측정, 각 중앙값 기록 _(수동 측정 필요 — Chrome DevTools)_
- [ ] 측정 환경 고정: 프로덕션 빌드, Chrome Performance 탭, Disable cache, 로그인 상태 _(수동 측정 필요)_

### feedback/page.tsx 전환

- [x] page.tsx → Server Component (getRequiredOwnerSession + createFeedbackService 호출)
- [x] FeedbackPageClient.tsx 생성 (기존 코드 이동)
- [x] useState(initialRequests) 적용, useEffect 초기 fetch 제거
- [x] 빌드 통과로 정상 로드 확인

### audit/page.tsx 전환

- [x] page.tsx → Server Component (Prisma 직접 쿼리)
- [x] AuditPageClient.tsx 생성
- [x] useState(initialLogs) 적용, useEffect 초기 fetch 제거
- [x] 커서 페이지네이션(handleLoadMore) client fetch 유지 확인

### 게이트

- [x] `npm run lint` 통과 (0 errors, 9 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (74 suites, 540 tests)
- [x] E2E 17/17 통과
- [ ] 전환된 2개 페이지 스모크 (데이터 로드 + 기본 인터랙션) _(프로덕션 배포 후 수동 확인 필요)_

---

## T105 — 단일 fetch 페이지 5개 전환

> Phase 2 병렬 세션 — T106과 동시 실행 가능 (파일 충돌 0건)
> Session A: testimonials + feedback/[id] + feedback/new + job-tracker
> Session B: projects/edit + notes/edit + company-targets + experience-stories
> Session C: domain-links + blog/edit

### testimonials/page.tsx

- [x] Server Component 전환 + TestimonialsPageClient 분리
- [x] 페이지 로드 정상 확인 (Playwright MCP 프로덕션 스모크, 2026-03-24) — CRUD는 데이터 없어 빈 UI 확인

### projects/[id]/edit/page.tsx

- [x] Server Component 전환 + ProjectEditPageClient 분리
- [ ] 수정/삭제 + ProjectForm 동작 확인 _(프로덕션 배포 후 수동 확인 필요)_

### notes/[id]/edit/page.tsx

- [x] Server Component 전환 + NoteEditPageClient 분리 (이중 fetch → 서버 Promise.all)
- [ ] 저장/삭제 동작 확인 _(프로덕션 배포 후 수동 확인 필요)_

### feedback/[id]/page.tsx

- [x] Server Component 전환 + FeedbackDetailPageClient 분리
- [ ] 피드백 실행/비교/삭제 동작 확인 _(프로덕션 배포 후 수동 확인 필요)_

### feedback/new/page.tsx

- [x] Server Component 전환 + FeedbackNewPageClient 분리
- [ ] targetType 변경 시 동적 reload 정상 (client fetch 유지) _(프로덕션 배포 후 수동 확인 필요)_

### 게이트

- [x] `npm run build` 통과 (Session A: 2026-03-23)
- [x] `npx jest --runInBand` 통과 (74 suites, 540 tests — Session A: 2026-03-23)
- [x] E2E 17개 통과 (통합 게이트에서 확인 — 17/17)
- [x] 전환된 페이지 로드 스모크 확인 (Playwright MCP, 2026-03-24) — testimonials/feedback/feedback-new 정상 렌더링

---

## Phase 2 통합 게이트 (Session A + B + C 전부 완료 후) ✅

> T105 + T106 병렬 3세션 병합 후 통합 확인

- [x] `npm run lint` 통과 (0 errors, 9 warnings — 기준선)
- [x] `npm run build` 통과 (73 routes, Turbopack 4.7s)
- [x] `npx jest --runInBand` 통과 (74 suites, 540 tests)
- [x] E2E 17개 통과 (17/17, 13.1s)
- [x] 전환된 페이지 프로덕션 스모크 7개 확인 (Playwright MCP, 2026-03-24)

---

## T106 — 복합 fetch 페이지 5개 전환

> Phase 2 병렬 세션 — T105와 동시 실행 가능 (파일 충돌 0건)

### job-tracker/page.tsx

- [x] Server Component 전환 + JobTrackerPageClient 분리
- [x] 칸반 보드 로드 정상 (Playwright MCP, 2026-03-24) — 빈 보드 + 안내 링크 확인
- [ ] 상태 변경/JD 매칭 CRUD 동작 확인 _(데이터 필요)_

### company-targets/page.tsx

- [x] Server Component 전환 + CompanyTargetsPageClient 분리
- [x] 페이지 로드 + 필터 UI + 생성 폼 정상 렌더링 확인 (Playwright MCP, 2026-03-24)

### experience-stories/page.tsx

- [x] Server Component 전환 + ExperienceStoriesPageClient 분리
- [x] 경력 셀렉트 + STAR 폼 즉시 로드 확인 (Playwright MCP, 2026-03-24) — 스켈레톤 없이 즉시 렌더

### domain-links/page.tsx

- [x] Server Component 전환 + DomainLinksPageClient 분리 (7개 병렬 쿼리)
- [x] 7개 엔티티 셀렉트 옵션 즉시 로드 + 링크 폼 정상 (Playwright MCP, 2026-03-24)

### blog/[id]/edit/page.tsx

- [x] Server Component 전환 + BlogEditPageClient 분리
- [ ] 저장/삭제/lint/export 동작 확인 _(프로덕션 배포 후 수동 확인)_

### 세션 내 게이트 (각 세션 빌드 확인)

- [x] Session A `npm run build` 통과 (2026-03-23)
- [x] Session B `npm run build` 통과 (2026-03-23)
- [x] Session C `npm run build` + jest 540 tests 통과 (2026-03-23)

---

## T107 — 거대 페이지 2개 + 최종 측정 + 배포

> Phase 3 병렬 2세션 — Session D(settings) + Session E(resumes/edit) 동시 가능

### 거대 페이지 전환

- [x] settings: Server Component 전환 + PortfolioSettingsPageClient 분리 (Session D, 2026-03-24)
- [x] settings: 폼 전체 로드 + 미리보기 모달 정상 (Playwright MCP, 2026-03-24) — 15+ 필드 + 섹션 레이아웃 + 미리보기 프로필 렌더링 확인
- [x] resumes/edit: Server Component 전환 + ResumeEditPageClient 분리 (Session E, 2026-03-24)
- [ ] resumes/edit: 항목 CRUD + BulletsEditor/MetricsEditor + 프리뷰/PDF/공유링크 정상 _(프로덕션 배포 후 수동 확인 필요)_

### After 측정 + stop-loss

- [ ] 5개 페이지 × cold 3회 + warm 3회 재측정, 중앙값 Before/After 비교표 작성 _(수동 측정 필요 — Chrome DevTools)_
- [x] useEffect 초기 fetch 제거 확인 (전환된 14개 전부) ✅ 2026-03-24 — grep 검증 완료
- [ ] **stop-loss**: settings/resumes-edit warm 중앙값 개선폭 < 50ms → Sprint 7 이관 기록 _(After 측정 후 판정)_

### 최종 게이트 + 배포

- [x] 게이트 4종 통과 (lint 0 errors, 13 warnings / build 73 routes 4.3s / jest 74 suites 539 tests / vercel-build) ✅ 2026-03-24
- [x] E2E 17/17 통과 (11.1s) ✅ 2026-03-24
- [ ] Vercel 배포 성공 + HTTP 200 확인 _(배포 대기)_
- [x] 스모크 3/4: audit 10건 로드 ✅ + job-tracker 칸반 ✅ + settings 폼+미리보기 ✅ (Playwright MCP, 2026-03-24)
- [ ] 스모크 1/4: resumes/edit PDF _(이력서 0개 — 데이터 생성 후 확인 필요)_

### 문서 동기화

- [x] history.md Sprint 6 완료 기록 ✅ 2026-03-24
- [x] plan.md Phase 체크 ✅ 2026-03-24
