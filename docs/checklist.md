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
- [ ] CRUD 동작 확인 (생성/상태변경/공개토글/삭제) _(프로덕션 배포 후 수동 확인 필요)_

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
- [ ] 전환된 5개 페이지 CRUD 스모크 _(프로덕션 배포 후 수동 확인 필요)_

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
- [ ] 칸반 보드 로드 + 카드 상세 모달(dynamic) 정상 _(프로덕션 배포 후 수동 확인 필요)_
- [ ] 상태 변경/JD 매칭 CRUD 동작 확인 _(프로덕션 배포 후 수동 확인 필요)_

### company-targets/page.tsx

- [x] Server Component 전환 + CompanyTargetsPageClient 분리
- [ ] 인라인 편집 + 필터(status/q) 변경 후 재조회 정상 _(프로덕션 배포 후 수동 확인 필요)_

### experience-stories/page.tsx

- [x] Server Component 전환 + ExperienceStoriesPageClient 분리
- [ ] STAR 편집 + 경력 선택 시 스토리 재조회 정상 _(프로덕션 배포 후 수동 확인 필요)_

### domain-links/page.tsx

- [x] Server Component 전환 + DomainLinksPageClient 분리 (7개 병렬 쿼리)
- [ ] 링크 생성/삭제 + 소스/타겟 셀렉트 동작 확인 _(프로덕션 배포 후 수동 확인)_

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

- [ ] settings: Server Component 전환 + PortfolioSettingsPageClient 분리
- [ ] settings: 폼 로드/저장 + 아바타 업로드 + 미리보기 모달(dynamic) 정상
- [ ] resumes/edit: Server Component 전환 + ResumeEditPageClient 분리
- [ ] resumes/edit: 항목 CRUD + BulletsEditor/MetricsEditor + 프리뷰/PDF/공유링크 정상

### After 측정 + stop-loss

- [ ] 5개 페이지 × cold 3회 + warm 3회 재측정, 중앙값 Before/After 비교표 작성
- [ ] useEffect 초기 fetch 제거 확인 (전환된 14개 전부)
- [ ] **stop-loss**: settings/resumes-edit warm 중앙값 개선폭 < 50ms → Sprint 7 이관 기록

### 최종 게이트 + 배포

- [ ] 게이트 4종 통과 (lint 0 errors / build / jest 540+ / vercel-build)
- [ ] E2E 17개 통과
- [ ] Vercel 배포 성공 + HTTP 200 확인
- [ ] 스모크 4개: audit 페이지네이션 + job-tracker 칸반 + settings 미리보기 + resumes/edit PDF

### 문서 동기화

- [ ] history.md Sprint 6 완료 기록
- [ ] plan.md Phase 체크
