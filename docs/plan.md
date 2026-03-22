# PoReSt 전체 작업 계획서 — Sprint 5

기준일: 2026-03-22
문서 정의: 프로젝트 비전·마일스톤·로드맵·게이트를 관리하는 단일 기준 문서
관련 문서: `task.md`(현재 태스크 상세), `checklist.md`(검증 체크리스트), `history.md`(완료 이력·맥락), `archive.md`(보류 항목·아이디어)

---

## 1) 비전과 전략

### 1.1 비전

PoReSt는 공개 포트폴리오(`/portfolio/[publicSlug]`)와 개인 워크스페이스(`/app`)를 통합한 **개인 개발자 OS**다.

### 1.2 제품 전략

**Dogfooding → 폴리시 → 품질 보증 → 실전 최적화 → Lazy 로딩**

1. **Sprint 1 (M6~M10)**: 기능 구현 완료 ✅
2. **Sprint 2 (M11-P)**: 포트폴리오/이력서 프로덕션 폴리시 ✅
3. **Sprint 3 (M12)**: 품질 보증 — 테스트 + E2E + 접근성 + 성능 기준선 ✅
4. **Sprint 4 (M13)**: 실전 최적화 — 화면 전환 속도 + AI 자기소개서 RAG ✅
5. **Sprint 5 (M14, 현재)**: UI 레벨 next/dynamic Lazy 로딩 리팩토링

### 1.3 Sprint 5 핵심 원칙

- **기능 변경 ZERO** — 사용자가 볼 수 있는 동작은 바꾸지 않는다
- **측정 → 변경 → 검증** — 감이 아닌 숫자로 판단한다
- **태스크당 독립 배포** — 각 T는 단독으로 프로덕션 배포 가능하다
- **게이트 실패 즉시 롤백** — Jest 519 + E2E 17 기준선을 사수한다
- **한 번에 하나만** — 여러 최적화 기법을 동시에 섞지 않는다

---

## 2) Sprint 1~4 완료 요약

> 상세 이력은 `history.md` 참조

| Sprint      | 마일스톤        | 핵심                                  | 상태 |
| ----------- | --------------- | ------------------------------------- | ---- |
| S1 (M6~M10) | 기능 구현       | 17개 모듈, 72+ API                    | ✅   |
| S2 (M11-P)  | 프로덕션 폴리시 | T88~T90, 디자인/성능/코드품질         | ✅   |
| S3 (M12)    | 품질 보증       | T91~T94, 테스트/E2E/접근성/Lighthouse | ✅   |
| S4 (M13)    | 실전 최적화     | T95~T98, loading.tsx + RAG 파이프라인 | ✅   |

**Sprint 4 최종 기준선**: 71 suites, 519 tests + E2E 17 tests / lint 0 errors, 9 warnings

---

## 3) Sprint 5 마일스톤 — M14: UI 레벨 next/dynamic Lazy 로딩

### 목표

> 기존 기능을 100% 유지하면서 주요 route의 초기 로드 JS를 줄여 체감 속도를 개선한다

### 진입 근거

- 번들 분석: 총 청크 2.6MB, 상위 4개 청크만 1.1MB
- UI 레벨 `next/dynamic` 사용 0건 — 무거운 인라인 모달/폼/미리보기가 전부 초기 JS에 포함
- 200줄+ 거대 `'use client'` 컴포넌트 15개 — 최대 1,330줄 (resume edit)
- 사이드바 Link 20+개 전부 자동 prefetch — 불필요한 네트워크 요청

> 참고: `src/lib/pdf-download.ts`에서 jsPDF/html2canvas-pro는 이미 native `import()` 기반 동적 로드 적용됨.
> 이번 Sprint는 **UI 컴포넌트 레벨의 next/dynamic 미활용** 문제를 해결한다.

### 성공 기준 (KPI)

코드 스플리팅은 총 static/chunks 크기가 약간 늘어도 정상이다.
**성공 판단은 총량이 아닌 route별 First Load JS 기준**:

| KPI                                    | 측정 대상                                                                 | 성공 기준                                                            | 구분                          |
| -------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------- |
| Route별 First Load JS                 | `/app/resumes/[id]/edit`, `/app/portfolio/settings`, `/app/cover-letters` | 핵심 3개 route 감소                                                  | **pass/fail 주지표 (유일)**   |
| Lazy 대상 초기 번들 포함              | 모달/미리보기 JS가 페이지 초기 로드에 미포함                              | bundle analyzer route chunk 제외 + Network waterfall 미포함 2중 확인 | 필수 확인                     |
| 모달 기능 회귀                        | 열기/닫기 (Jest/RTL) + 제출/취소 (수동 스모크)                            | 전부 정상                                                            | 필수 확인                     |
| 프로덕션 스모크                       | edit, settings, cover-letters, 저빈도 메뉴 1개                            | 전부 정상                                                            | 필수 확인                     |
| 사이드바 자동 prefetch 요청 수        | `/app` 진입 후 Network 탭 (수동 측정)                                     | 감소 (참고용, pass/fail 기준 아님)                                   | 보조지표                      |

### Phase 1: 측정 기준선

| ID  | 핵심 내용                                               | 상태 |
| --- | ------------------------------------------------------- | ---- |
| T99 | 번들 분석 도구 설정 + route별 First Load JS 기준선 기록 | ✅   |

### Phase 2: Lazy 로딩 + prefetch 최적화

| ID   | 핵심 내용                                               | 상태 |
| ---- | ------------------------------------------------------- | ---- |
| T100 | next/dynamic — 무거운 인라인 모달/폼/미리보기 Lazy 로딩 |      |
| T102 | 사이드바 Link prefetch 전략 최적화                      |      |

### Phase 3: 컴포넌트 분할 + 검증

| ID   | 핵심 내용                                            | 상태 |
| ---- | ---------------------------------------------------- | ---- |
| T101 | 거대 페이지 내 초기 화면 불필요 섹션만 lazy 분리     |      |
| T103 | 최종 route별 First Load JS 비교 + 프로덕션 배포 검증 |      |

### 실행 순서 (병렬 세션 구조)

```
Phase 1 (직렬)          Phase 2 (병렬 3세션)                    Phase 3       Phase 4
──────────────      ────────────────────────────────      ──────────    ──────────
T99 (기준선)
      ↓
                    ┌─ Session A: T100-A (cover-letters)
                    ├─ Session B: T100-B (settings) → T102 (sidebar)   → 통합     → T101#2~#3  → T103
                    └─ Session C: T100-C (job-tracker) → T101#1 (PDF)     게이트     (조건부)     (최종)
```

- **Phase 2 병렬 근거**: 3세션이 수정하는 파일이 완전히 독립적 (충돌 없음)
- **Session B에 T102 배치**: AppSidebar.tsx는 settings와 파일 충돌 없음, 가장 작은 작업이라 세션 B에 붙임
- **Session C에 T101#1 배치**: resume edit는 T100 대상이 아니므로 독립 실행 가능
- **통합 게이트**: 3세션 병합 후 lint/build/jest/E2E 통합 확인
- **Phase 3 조건부**: KPI 달성 시 T101#2~#3 생략 가능

---

## 4) 태스크 상세

### T99 — 번들 분석 기준선 확립

**범위**: `@next/bundle-analyzer` 설치 + route별 First Load JS 기준선 기록

**산출물**:

1. bundle-analyzer devDependency 설치 + next.config 연동
2. **route별 First Load JS 표** (핵심 3개: resumes/edit, settings, cover-letters + 기타)
3. 상위 청크 내용물 식별
4. 사이드바 진입 후 자동 prefetch 요청 수 기록
5. 기준선 수치를 history.md에 기록

**측정 대상 route** (인증된 private 페이지):

- `/app/resumes/[id]/edit` — 1,330줄 거대 컴포넌트
- `/app/portfolio/settings` — 980줄 거대 컴포넌트
- `/app/cover-letters` — 500줄 + 모달 2개
- `/app/job-tracker` — 529줄 + 칸반 모달
- `/app` (홈) — 기본 대시보드

**위험도**: 없음 — devDependency 추가, 프로덕션 코드 변경 0

### T100 — next/dynamic 무거운 인라인 UI Lazy 로딩

**범위**: 초기 렌더에 불필요한 **무거운 조건부 UI**만 선별하여 `next/dynamic` 전환

**대상 선별 기준**:

- ✅ 무거운 인라인 폼/미리보기 (100줄+ JSX 블록) → lazy
- ❌ 경량 공용 컴포넌트 (ConfirmDialog 59줄 등) → 이득 없음, 제외

**확정 대상**:

> 라인 번호는 작성 시점(2026-03-22) 스냅샷. 실제 작업 시 컴포넌트명 및 조건부 렌더 패턴(`{isOpen && ...}`)으로 재확인.

| #   | 파일                                       | 대상 (라인, 참고)              | 이유                                                  |
| --- | ------------------------------------------ | ------------------------------ | ----------------------------------------------------- |
| 1   | `cover-letters/CoverLettersPageClient.tsx` | AI 생성 모달 (:301~398)        | 조건부 렌더링 인라인 폼 ~100줄, 4개 input + 생성 로직 |
| 2   | `cover-letters/CoverLettersPageClient.tsx` | 합격본 등록 모달 (:401~498)    | 조건부 렌더링 인라인 폼 ~100줄, textarea + 등록 로직  |
| 3   | `portfolio/settings/page.tsx`              | 미리보기 오버레이 (:930~980)   | 조건부 렌더링, PortfolioFullPreview 포함, 가장 무거움 |
| 4   | `job-tracker/page.tsx`                     | 칸반 카드 상세 모달 (:361~526) | 조건부 렌더링, 상세 정보 + JD 매칭 결과               |

**제외 대상**:

- `ConfirmDialog` (59줄) — 공용 경량 컴포넌트, dynamic 이득 없음
- `experience-stories/page.tsx` 생성 폼 (:354) — 조건부 UI 아닌 항상 렌더되는 폼, lazy 부적합
- `company-targets/page.tsx` 생성 폼 (:321) — 조건부 UI 아닌 항상 렌더되는 폼, lazy 부적합
- 20줄 이하 단순 조건부 UI — overhead가 이득보다 큼

**ssr 정책**: `ssr: false`는 기본값으로 쓰지 않는다. 브라우저 API 직접 의존하는 컴포넌트에만 제한 적용. 핵심 편집 UI는 eager 유지.

**loading fallback 정책**: 모달 lazy 시 첫 클릭이 비어 보이지 않도록 `dynamic(fn, { loading: () => <ModalShell/> })` 형태로 오버레이 배경 + 로딩 스피너를 유지한다. 모달 셸(배경 dim + 중앙 카드 골격)을 fallback으로 제공하여 사용자에게 "열리는 중"임을 즉시 전달.

**회귀 자동화**: 대상 모달별 Jest/RTL 테스트 최소 1개씩 추가 — 범위는 **열기→렌더 확인→닫기** (서버 연동이 필요한 제출/취소는 수동 스모크로 검증). 기존 E2E 17개는 public 전용이므로 private 모달 커버 불가.

**롤백 규칙**: RTL 테스트 또는 수동 스모크 실패 시, 해당 모달의 dynamic 전환을 즉시 revert하고 원인 분석 후 재적용.

**위험도**: 낮음 — 모달은 초기 화면에 없으므로 UX 변화 없음

### T102 — 네비게이션 prefetch 전략 최적화

**범위**: 사이드바 Link 20+개 → 사용 빈도별 prefetch 전략 차등 적용

**유지 (자동 prefetch)** — 핵심 메뉴 (dogfooding 사용 빈도 기준, private workspace navigation telemetry 미구축):

- 홈, 프로젝트, 이력서, 경력, 노트, 자기소개서

**비활성화 (`prefetch={false}`)** — 저빈도 메뉴:

- 블로그, 스킬, 분석, 성장 타임라인, 피드백, 지원 트래커, 추천서, 감사 로그, 기업 분석, 교차 링크, STAR 스토리, 포트폴리오 설정

**위험도**: 최저 — 동작 변화 없음, 네트워크 요청만 줄어듦. loading.tsx 스켈레톤이 이미 있으므로 체감 저하 가능성 낮음.

> 분류 근거: 최근 dogfooding 기간 중 일상적으로 접근하는 메뉴를 핵심으로 선별. PageViews 모듈은 public 포트폴리오 방문 분석 전용이므로 private workspace 메뉴 사용 빈도 데이터는 현재 없음. 정밀 분류는 workspace navigation telemetry 도입 후 후속 과제로 남김.

### T101 — 초기 화면 불필요 섹션 lazy 분리

**범위**: 거대 페이지 내 **초기 화면에 안 필요한 섹션만** lazy 로딩 대상으로 분리

**전략**:

1. 전체 파일 분할이 아닌, **명확한 후순위 영역만 추출 + dynamic**
2. 상태(state)와 핸들러는 부모에서 props로 전달
3. 1차 적용 후 route별 First Load JS 수치 확인 → 부족 시에만 2차 분해
4. 파일 1개씩 작업 → 빌드 확인 → 다음 파일

**1차 대상 (명확하게 지연 로딩 효과가 있는 영역)**:

| 우선순위 | 파일                          | 대상                                         | 구현 방향                                                      | 기대 효과        |
| -------- | ----------------------------- | -------------------------------------------- | -------------------------------------------------------------- | ---------------- |
| **1**    | `resumes/[id]/edit/page.tsx`  | PDF: `_lib/pdf` on-demand import (:13, :846) | 정적 import → 버튼 클릭 시 `await import()`                    | route JS 직접 절감 |
| 2        | `resumes/[id]/edit/page.tsx`  | 프리뷰 **결과 본문** (:1272~1327)            | 헤더/버튼은 부모 유지, `{preview && <Result/>}` 부분만 dynamic | 소폭 감소, 보조 최적화 |
| 3        | `portfolio/settings/page.tsx` | 미리보기 모달 (:930~980)                     | T100에서 분리 완료 시 skip                                     | T100 의존        |

> 라인 번호는 작성 시점 스냅샷. 실제 작업 시 컴포넌트명/조건부 렌더 패턴 기준으로 재확인 필요.
> T100/T102만으로 KPI 달성 시 #2(프리뷰 결과 본문)는 생략 가능.

**제외**: ShareLinksSection (:336~) — mount 시 즉시 fetch 구조로 단순 dynamic 효과 제한적. 후속 항목.

**2차 대상 (수치 부족 시)**:

- resume edit 상단 섹션 세분화
- settings 폼 영역별 분할
- ShareLinksSection "펼치기" UI 전환 후 lazy mount

**위험도**: 중간 — props 인터페이스 정의 필요, 상태 흐름 보존 필수

### T103 — 최종 route별 First Load JS 비교 + 프로덕션 배포 검증

**범위**: T99 기준선 대비 route별 before/after 비교 + 전체 게이트 + 프로덕션 배포

**산출물**:

1. route별 First Load JS 변화표 (핵심 3개 + 기타)
2. 사이드바 prefetch 요청 수 변화 (before/after)
3. E2E 프로덕션 검증 17/17
4. 프로덕션 스모크: `/app/resumes/[id]/edit`, `/app/portfolio/settings`, `/app/cover-letters`, 저빈도 메뉴 1개 클릭
5. T102 prefetch 분류 재검토 기록 (배포 후 1주일 실사용 후 재분류 계획)
6. history.md 최종 기록

---

## 5) 게이트 규칙

### 5.1 고정 게이트 (매 태스크 완료 시)

1. `npm run lint` — 0 errors
2. `npm run build` — 성공
3. `npx jest --runInBand` — 71 suites, 519 tests 이상
4. `npm run vercel-build` — 성공

### 5.2 Sprint 5 추가 게이트

- **기능 회귀 ZERO** — 모든 기존 기능이 동일하게 동작해야 함
- **E2E 17개** 기존 통과 유지
- **route별 First Load JS (유일한 pass/fail 주지표)** — 핵심 3개 route에서 T99 대비 감소 필수 (나머지 2개는 보조, 총량은 무관)
- **모달 회귀 테스트 (필수 확인)** — 열기/닫기 (Jest/RTL) + 제출/취소 (수동 스모크) 전부 정상
- **before/after 수치 기록** — 측정 없는 변경 금지
- **롤백 규칙** — RTL 테스트 또는 수동 스모크 실패 시 해당 dynamic 전환 즉시 revert, 원인 분석 후 재적용
- **prefetch 요청 수** — 보조지표. 수동 측정이므로 pass/fail 기준에서 제외하되 before/after 참고 기록은 유지

### 5.3 기준선

- jest: 71 suites, 519 tests
- E2E: 8 specs, 17 tests
- lint: 0 errors, 9 warnings
- static/chunks: 2.6MB (총량 — 참고용, KPI 아님)
- route별 First Load JS: T99에서 확정

---

## 6) 리스크 및 대응

| 리스크                            | 대응                                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| 컴포넌트 분할 시 상태 전달 버그   | 파일 1개씩 작업 + 즉시 빌드 확인 + 브라우저 스모크                  |
| dynamic import 시 로딩 깜빡임     | `loading` fallback으로 스켈레톤 제공                                |
| prefetch 제거 시 체감 느려짐      | 핵심 메뉴(6개) prefetch 유지 + loading.tsx 스켈레톤 이미 있음       |
| 모달 회귀 (기존 E2E가 커버 못 함) | Jest/RTL 열기→렌더→닫기 자동화 + 수동 스모크(제출/취소) 병행. 실패 시 즉시 revert |
| 총 번들 크기 소폭 증가            | 정상 — 코드 스플리팅의 자연스러운 결과. route별 First Load JS가 KPI |
| private 페이지 E2E 사각지대       | 기존 E2E 17개는 public 전용. T100에서 변경한 private 모달은 RTL(자동) + 수동 스모크로만 검증. 프로덕션 환경 private 검증은 수동 의존 — Sprint 6에서 private E2E 확장 검토 |
| prefetch 분류 데이터 부재         | 현재 workspace navigation telemetry 미구축. dogfooding 주관 판단으로 분류. T103 배포 후 1주일 실사용 기반 분류 재검토 |

---

## 7) 의도적 제외 (archive 이관)

| 항목                              | 제외 사유                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| 서버/클라이언트 경계 재설계       | 아키텍처 변경 — 리팩토링 Sprint에 부적합                         |
| next/Image 일관 적용              | 이미지 적음, 체감 영향 미미                                      |
| 경량 공용 컴포넌트 dynamic 적용   | ConfirmDialog(59줄) 등 이득 없음                                 |
| 항상 렌더되는 생성 폼 lazy 적용   | experience-stories(:354), company-targets(:321) — 조건부 UI 아님 |
| blog edit (615줄) 분할            | T101에서 상위 2개만 대상, 확장 시 추가                           |
| @google/generative-ai 동적 import | 서버 전용 모듈 — 클라이언트 번들에 무관                          |
| ssr: false 일괄 적용              | 브라우저 API 의존 컴포넌트에만 제한 적용                         |

---

## 8) 아키텍처 현황 메모

- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **스타일**: Tailwind CSS 4
- **ORM**: Prisma 7.3 + NeonDB (PostgreSQL)
- **인증**: NextAuth 4.x (Google OAuth)
- **배포**: Vercel
- **CI/CD**: GitHub Actions (lint→build→jest→deploy) + E2E (별도 워크플로우)
- **AI**: Gemini (text-embedding-004, gemini-2.0-flash) + `withGeminiFallback()` 패턴
- **테스트**: Jest (71 suites, 519 tests) + Playwright E2E (17 tests, 8 specs)
- **번들**: static/chunks 2.6MB, UI 레벨 next/dynamic 미사용, native import() 부분 적용 (pdf-download.ts)
