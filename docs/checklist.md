# PoReSt 작업 검증 체크리스트

기준일: 2026-03-18
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T91 — TDD 미완료 보충 ✅ 완료

> 전체 체크 완료 — history.md 참조
> 통합 게이트: lint(0 errors, 8 warnings) / build / jest(69 suites, 482 tests) / vercel-build

---

## T92 — Playwright E2E 회귀 테스트 자동화

---

### Session A — 설정 + 페이지 스펙 (7개 파일) ✅ 완료

**수정 파일:** `playwright.config.ts`(신규), `package.json`(수정), `.gitignore`(수정), `jest.config.js`(수정), `e2e/portfolio-*.spec.ts` × 3

#### S1. Playwright 설치 + config

- [x] `@playwright/test` devDependency 설치
- [x] Chromium 브라우저 바이너리 설치
- [x] `playwright.config.ts` 생성
  - [x] `baseURL`: env 기반 (`E2E_BASE_URL` || production URL)
  - [x] `testDir`: `./e2e`
  - [x] `projects`: Chromium only
  - [x] `timeout`: 30000, `retries`: 1, `expect.timeout`: 15000
  - [x] `reporter`: html + list

#### S2. package.json scripts

- [x] `"test:e2e"` script 추가
- [x] `"test:e2e:headed"` script 추가
- [x] `"test:e2e:report"` script 추가

#### S3. .gitignore 업데이트

- [x] `playwright-report/` 추가
- [x] `test-results/` 추가
- [x] `blob-report/` 추가

#### E1. portfolio-home.spec.ts (3 tests)

- [x] 페이지 200 로드 + 프로필 이름/헤드라인 존재
- [x] 주요 섹션 제목 존재 ("대표 프로젝트")
- [x] 푸터 "이 포트폴리오는 PoReSt로 만들어졌습니다" 텍스트 존재

#### E2. portfolio-experiences.spec.ts (2 tests)

- [x] 페이지 200 로드 + "경력" 제목
- [x] 경력 카드 1개 이상 또는 빈 상태 메시지

#### E3. portfolio-projects.spec.ts (3 tests)

- [x] 목록 페이지 200 로드 + "프로젝트" 제목 + 카드 1개 이상
- [x] 카드 클릭 → 상세 페이지 URL 이동
- [x] 상세 페이지: 프로젝트 제목 존재

#### Session A 게이트

- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run test:e2e` — Session A 스펙 8개 통과
- [x] 기존 Jest 영향 없음 확인 (69 suites, 482 tests)
- [x] `jest.config.js` — `e2e/` 디렉토리 제외 (`testPathIgnorePatterns`)
- [x] **커밋 완료** (`bc583c3`)

---

### Session B — 기능 스펙 + CI (5개 파일)

**전제:** Session A 커밋 완료 (playwright.config.ts 존재) ✅
**신규 파일:** `e2e/portfolio-dark-mode.spec.ts`, `e2e/portfolio-mobile.spec.ts`, `e2e/resume-share.spec.ts`, `e2e/seo.spec.ts`, `.github/workflows/e2e.yml`

#### E4. portfolio-dark-mode.spec.ts (2 tests)

- [ ] 토글 클릭 → `data-theme="dark"` 전환
- [ ] 다시 클릭 → `data-theme="light"` 복귀

#### E5. portfolio-mobile.spec.ts (1 test)

- [ ] 390×844 뷰포트 홈 페이지 로드 + 프로필 + 섹션 존재

#### E6. resume-share.spec.ts (1 test)

- [ ] 무효 토큰 → 에러 메시지 또는 에러 UI 존재

#### E7. seo.spec.ts (2 tests)

- [ ] 홈 `<title>` 비어있지 않음 + `og:title` meta 존재
- [ ] `/sitemap.xml` 200 응답

#### C1. e2e.yml 워크플로우

- [ ] `.github/workflows/e2e.yml` 신규 생성
- [ ] 트리거: `workflow_dispatch` + `schedule`
- [ ] Node.js 22 + Playwright install + test 실행
- [ ] `E2E_BASE_URL` 환경변수 설정

#### C2. 리포트 아티팩트

- [ ] 실패 시 `playwright-report/` 아티팩트 업로드
- [ ] retention 7일 설정

#### Session B 게이트

- [ ] `npm run lint` 통과 (0 errors)
- [ ] `npm run test:e2e` — Session B 스펙 6개 통과

---

### 통합 게이트 (전 세션 완료 후)

- [ ] `npm run test:e2e` — **14개 E2E 전체 통과**
- [ ] `npm run lint` 통과 (0 errors)
- [ ] `npm run build` 통과
- [ ] `npx jest --runInBand` 통과 (69 suites, 482 tests — 변동 없음)
- [ ] Jest와 Playwright testDir 분리 확인 (`src/` vs `e2e/`)

---

### 매 태스크 종료 시 공통

- [ ] E2E 14개 테스트 전체 통과
- [ ] 기존 Jest 테스트 영향 없음
- [ ] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
