# PoReSt 작업 검증 체크리스트

기준일: 2026-03-22
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## Sprint 4 (T95~T98) ✅ 완료

> history.md 참조

---

> **T99 완료 ✅** — T100~T103 순차 활성화 (Phase 2 병렬 진입 가능)

---

## T99 — 번들 분석 기준선 확립 ✅ 완료

### 도구 설정

- [x] `@next/bundle-analyzer` devDependency 설치
- [x] `next.config.ts`에 `ANALYZE=true` 조건부 래핑 (기존 config 구조 유지)
- [x] 번들 분석 빌드 실행 → `--webpack` 모드에서 리포트 생성 확인 (.next/analyze/client.html)

### route별 First Load JS 기준선

- [x] `/app/resumes/[id]/edit` First Load JS 기록 — 696.7 kB (200.1 kB gz)
- [x] `/app/portfolio/settings` First Load JS 기록 — 693.7 kB (200.5 kB gz)
- [x] `/app/cover-letters` First Load JS 기록 — 678.5 kB (195.6 kB gz)
- [x] `/app/job-tracker` First Load JS 기록 — 675.4 kB (195.2 kB gz)
- [x] `/app` (홈) First Load JS 기록 — 663.8 kB (191.7 kB gz)
- [x] 상위 10개 청크: 파일명 + 크기 + 주요 내용물 식별

### 네트워크 기준선 (보조지표)

- [x] 사이드바 진입 후 자동 prefetch 요청 수 기록 **(참고용, pass/fail 기준 아님)** — Link 20+개 전부 자동 prefetch 미지정 상태

### 게이트

- [x] `npm run lint` 통과 (0 errors, 9 warnings)
- [x] `npm run build` 통과 (73 pages)
- [x] `npx jest --runInBand` 통과 (71 suites, 519 tests)
- [x] 프로덕션 코드 변경 없음 확인 (src/ 변경 0건)

---

## T100 — next/dynamic 무거운 인라인 UI Lazy 로딩

> Phase 2 병렬 실행: Session A(T100-A), Session B(T100-B), Session C(T100-C)

### T100-A: cover-letters (Session A)

> 라인 번호는 작성 시점(2026-03-22) 스냅샷. 실제 작업 시 컴포넌트명 및 조건부 렌더 패턴으로 재확인.

- [x] `CoverLettersPageClient` — AI 생성 모달 (:301~398) → `GenerateCoverLetterModal` 추출 + dynamic
- [x] `CoverLettersPageClient` — 합격본 등록 모달 (:401~498) → `RegisterCoverLetterModal` 추출 + dynamic

### T100-B: portfolio/settings (Session B)

- [x] `portfolio/settings` — 미리보기 오버레이 (:930~980) → `PortfolioPreviewOverlay` 추출 + dynamic

### T100-C: job-tracker (Session C)

- [ ] `job-tracker` — 칸반 상세 모달 → `JobCardDetailModal` 추출 + dynamic

### 제외 확인

- [x] `ConfirmDialog` (59줄) — 건드리지 않음
- [x] `experience-stories` 생성 폼 (:354) — 항상 렌더, 건드리지 않음
- [x] `company-targets` 생성 폼 (:321) — 항상 렌더, 건드리지 않음
- [x] 20줄 이하 단순 조건부 UI — 건드리지 않음

### ssr 정책 확인

- [ ] `ssr: false`는 브라우저 API 의존 컴포넌트에만 적용
- [ ] 핵심 편집 UI는 eager (ssr 기본) 유지

### loading fallback 확인

- [ ] 각 dynamic 모달에 loading fallback 지정 (오버레이 dim + 셸 스켈레톤)
- [ ] 첫 클릭 시 빈 화면 없이 fallback → 실제 모달 전환 확인

### 회귀 자동화 (Jest/RTL — 각 모달별 최소 1개, 세션별 작성)

- [x] (Session A) `GenerateCoverLetterModal` RTL 테스트: 열기 → 필드 렌더 → 닫기 (4개 테스트)
- [x] (Session A) `RegisterCoverLetterModal` RTL 테스트: 열기 → 제목/본문 필드 렌더 → 닫기 (4개 테스트)
- [x] (Session B) `PortfolioPreviewOverlay` RTL 테스트: 열기 → PortfolioFullPreview 렌더 → 닫기 (4개 테스트)
- [ ] (Session C) `JobCardDetailModal` RTL 테스트: 열기 → 상세 정보 렌더 → 닫기

### 회귀 수동 스모크 (RTL 보완 — 제출/취소 + fallback 확인)

> **측정 환경**: production 빌드 기준 (`npm run build && npm run start`)

- [ ] AI 생성 모달: 열기 → **fallback 표시** → 4필드 입력 → 생성 → 결과 → 닫기
- [ ] 합격본 등록 모달: 열기 → **fallback 표시** → 제목+본문 → 등록 → 목록 반영 → 닫기
- [ ] 미리보기 오버레이: 열기 → **fallback 표시** → PortfolioFullPreview 렌더링 → 닫기
- [ ] 칸반 상세 모달: 카드 클릭 → **fallback 표시** → 상세 표시 → 상태 변경 → 닫기

> 롤백 규칙: RTL 또는 수동 스모크 실패 시 해당 모달의 dynamic 전환을 즉시 revert, 원인 분석 후 재적용.

### 측정

- [ ] 초기 페이지 로드 시 모달 코드 미포함 확인 (bundle analyzer route chunk 제외 + Network waterfall 미포함 **2중 확인**)
- [ ] route별 First Load JS 변화 확인 (T99 대비)

### 게이트 (각 세션 내 빌드 확인)

- [x] (Session A) `npm run build` 통과 — T100-A 커밋 후
- [x] (Session B) `npm run build` 통과 — T100-B 커밋 후
- [ ] (Session C) `npm run build` 통과 — T100-C 커밋 후

---

## Phase 2 통합 게이트 (3세션 병합 후)

> Session A + B + C 전부 완료 후 main에 병합하고 통합 확인

- [ ] `npm run lint` 통과 (0 errors)
- [ ] `npm run build` 통과
- [ ] `npx jest --runInBand` 통과 (71 suites, 519 tests + RTL 모달 테스트 신규분)
- [ ] E2E 17개 통과
- [ ] route별 First Load JS 중간 측정 (T99 대비 변화 확인)

---

## T102 — 네비게이션 prefetch 전략 최적화 (Session B, T100-B 완료 후)

### prefetch 설정

- [x] AppSidebar.tsx 내 NAV_GROUPS 구조 확인
- [x] 저빈도 메뉴에 `prefetch={false}` 적용 (11개: 포트폴리오설정, 블로그, STAR스토리, 기업분석, 지원트래커, 추천서, 피드백, 방문분석, 성장타임라인, 교차링크, 감사로그)
- [x] 핵심 메뉴 prefetch 유지 확인 (대시보드/프로젝트/경력/기술스택/이력서/노트/자기소개서)
- [x] NAV_GROUPS 코드에 분류 근거 주석 추가 (향후 재분류 시 판단 기준 보존)

### 동작 검증

- [x] 핵심 메뉴 클릭 → 즉시 로드 (체감 변화 없음) — prefetch 기본값 유지
- [x] 저빈도 메뉴 클릭 → loading.tsx 스켈레톤 표시 → 정상 로드 — prefetch={false} + loading.tsx 존재 확인
- [ ] Network 탭: 사이드바 진입 후 prefetch 요청 수 감소 확인 **(보조지표, 참고 기록)** — production 빌드 측정 필요 (T103)

### 게이트

- [x] `npm run lint` 통과 (0 errors, 9 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (74 suites, 540 tests — T100 RTL 신규분 포함)
- [x] E2E 17개 통과 (12.7s)

---

## T101 — 초기 화면 불필요 섹션 lazy 분리 (Phase 3, 통합 게이트 후)

### 1차 대상 — resume edit

> 라인 번호는 작성 시점 스냅샷. 함수명/import 경로로 재확인.
> T101#1은 Phase 2 Session C에서 T100-C 완료 후 실행. T101#2~#3은 Phase 3 (통합 게이트 후 조건부).

- [ ] **(사전 확인)** T99 기준선에서 pdf-download.ts 래퍼의 route chunk 기여도 확인 — 기여도 낮을 시 #2(프리뷰 결과 본문)를 1순위로 승격
- [ ] **(T101#1, Session C)** PDF `_lib/pdf` 정적 import (:13) → 버튼 클릭 시 `await import()` 전환 — route JS 직접 절감 기대
- [ ] 빌드 통과 확인 + route별 First Load JS 변화 확인
- [ ] **(T101#2, Phase 3 조건부 — T100/T102로 KPI 달성 시 생략 가능)** 프리뷰 **결과 본문** (:1272~1327) → `ResumePreviewResult` 추출 + dynamic — 소폭 감소, 보조 최적화
- [ ] ShareLinksSection — 이번 Sprint 제외 확인 (단순 dynamic 효과 제한적)
- [ ] 빌드 통과 확인
- [ ] route별 First Load JS 변화 확인

### 1차 대상 — settings

- [ ] T100에서 미리보기 모달 미처리 시: 여기서 추출 + dynamic
- [ ] 빌드 통과 확인
- [ ] route별 First Load JS 변화 확인

### 1차 수치 확인

- [ ] 핵심 route First Load JS 감소 확인 → 목표 달성 시 2차 스킵
- [ ] 목표 미달 시에만 2차 분해 진행

### 회귀 스모크

- [ ] 이력서 편집: 항목 추가 → 수정 → 순서 변경 → 저장
- [ ] 프리뷰: 프리뷰 갱신 → 내용 표시 정상
- [ ] PDF: PDF 다운로드 정상
- [ ] 공유 링크: 링크 생성 → 복사 → 비활성화
- [ ] 설정: 설정 변경 → 미리보기 → 저장

### 게이트

- [ ] `npm run lint` 통과 (0 errors)
- [ ] `npm run build` 통과
- [ ] `npx jest --runInBand` 통과 (71 suites, 519 tests 이상 — T100 RTL 신규분 포함)
- [ ] E2E 17개 통과

---

## T103 — 최종 route별 First Load JS 비교 + 프로덕션 배포 검증

### route별 First Load JS 비교

- [ ] `/app/resumes/[id]/edit` before/after
- [ ] `/app/portfolio/settings` before/after
- [ ] `/app/cover-letters` before/after
- [ ] `/app/job-tracker` before/after
- [ ] `/app` (홈) before/after
- [ ] 성공 기준 **(유일한 pass/fail 주지표)**: 핵심 3개(resumes/edit, settings, cover-letters) T99 대비 감소. 나머지 2개(job-tracker, 홈) 보조 — 비정상 증가 시 원인 확인

### 네트워크 비교 (T99 측정 조건 동일 적용: production 빌드, 로그인 상태, hard reload)

- [ ] 사이드바 prefetch 요청 수 before/after **(보조지표, 참고 기록)**
- [ ] lazy 대상 모달의 초기 번들 미포함 확인 (bundle analyzer route chunk 제외 + Network waterfall 미포함 2중) **(필수 확인)**

### 최종 게이트

- [ ] `npm run lint` 통과 (0 errors)
- [ ] `npm run build` 통과
- [ ] `npx jest --runInBand` 통과 (71 suites, 519 tests 이상 — T100 RTL 신규분 포함)
- [ ] `npm run vercel-build` 통과
- [ ] E2E 17개 통과

### 프로덕션 배포 + 스모크

- [ ] Vercel 배포 성공
- [ ] 프로덕션 HTTP 200 확인 (홈/경력/프로젝트/sitemap)
- [ ] E2E 17개 프로덕션 검증 통과
- [ ] 프로덕션 스모크: `/app/resumes/[id]/edit` 정상
- [ ] 프로덕션 스모크: `/app/portfolio/settings` 정상
- [ ] 프로덕션 스모크: `/app/cover-letters` 정상
- [ ] 프로덕션 스모크: 저빈도 메뉴 1개 클릭 정상

### prefetch 분류 재검토

- [ ] T102 prefetch 분류 재검토 기록 (배포 후 1주일 실사용 후 재분류 계획 history.md 기록)

### 문서 동기화

- [ ] history.md Sprint 5 완료 기록
- [ ] plan.md Phase 체크
