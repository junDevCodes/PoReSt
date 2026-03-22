# PoReSt 작업 상세 계획서

기준일: 2026-03-22
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## Sprint 4 (T95~T98) ✅ 완료

> history.md 참조. 최종 기준선: 71 suites, 519 tests + E2E 17 tests.

---

> **T99 완료 ✅** — 다음: T100 + T102 병렬 진입 (Phase 2)

---

## 병렬 실행 구조

### 파일 충돌 분석

| 태스크 | 수정 대상 파일 | 충돌 |
|---|---|---|
| T100-A | `cover-letters/CoverLettersPageClient.tsx` + 신규 2개 + 테스트 | 없음 |
| T100-B | `portfolio/settings/page.tsx` + 신규 1개 + 테스트 | T101#3 |
| T100-C | `job-tracker/page.tsx` + 신규 1개 + 테스트 | 없음 |
| T102 | `components/app/AppSidebar.tsx` | 없음 |
| T101#1 | `resumes/[id]/edit/page.tsx` | 없음 |
| T101#2 | `resumes/[id]/edit/page.tsx` | T101#1 (직렬) |
| T101#3 | `portfolio/settings/page.tsx` | T100-B (직렬) |

### Phase 1 — T99 (직렬 필수, 단일 세션)

기준선 측정. 모든 후속 태스크의 before 수치가 여기서 확정되므로 반드시 먼저 완료.

### Phase 2 — T100 + T102 + T101#1 (병렬 3세션)

> T99 완료 후 동시 진입. 각 세션은 서로 다른 파일을 수정하므로 충돌 없음.

| 세션 | 태스크 | 수정 파일 | 작업 내용 |
|---|---|---|---|
| **Session A** | T100-A | `cover-letters/CoverLettersPageClient.tsx` + 신규 모달 2개 + RTL 테스트 | AI 생성 모달 + 합격본 등록 모달 dynamic 분리 |
| **Session B** | T100-B → T102 | `portfolio/settings/page.tsx` + 신규 오버레이 + RTL 테스트 → `AppSidebar.tsx` | 미리보기 오버레이 dynamic 분리 → prefetch 전략 적용 |
| **Session C** | T100-C → T101#1 | `job-tracker/page.tsx` + 신규 모달 + RTL 테스트 → `resumes/[id]/edit/page.tsx` | 칸반 모달 dynamic 분리 → PDF import 동적 전환 |

**세션 내 순서**: 각 세션 안에서는 직렬 (앞 작업 커밋 후 다음 진행)
**세션 간**: 완전 독립 — 동시 실행 가능

### Phase 2 통합 게이트

3세션 전부 완료 후 병합 → 통합 게이트 실행:

```
1. 3세션 브랜치/변경사항 main에 병합
2. npm run lint (0 errors)
3. npm run build (성공)
4. npx jest --runInBand (519 + RTL 신규분)
5. E2E 17개 통과
6. route별 First Load JS 중간 측정 (T99 대비)
```

### Phase 3 — T101#2~#3 (조건부, 직렬)

> 통합 게이트 후 KPI 확인 결과에 따라 진행 여부 결정

- T100/T102만으로 핵심 3개 route 감소 달성 → **T101#2 생략 가능**
- T100-B에서 settings 미리보기 이미 처리 → **T101#3 skip**
- KPI 미달 시에만 T101#2(프리뷰 결과 본문) + 2차 분해 진행

### Phase 4 — T103 (직렬 필수, 단일 세션)

최종 검증 + 프로덕션 배포. 모든 변경이 반영된 상태에서 실행.

### 실행 흐름도

```
Phase 1 (직렬)          Phase 2 (병렬 3세션)                    Phase 3       Phase 4
──────────────      ────────────────────────────────      ──────────    ──────────
T99 (기준선)
      ↓
                    ┌─ Session A: T100-A (cover-letters)
                    ├─ Session B: T100-B (settings) → T102 (sidebar)   → 통합     → T101#2~#3  → T103
                    └─ Session C: T100-C (job-tracker) → T101#1 (PDF)     게이트     (조건부)     (최종)
```

---

## T99 — 번들 분석 기준선 확립

### 배경

Sprint 5는 리팩토링 Sprint다. "감이 아닌 숫자"로 판단하려면 변경 전 기준선이 반드시 필요하다.
총 static/chunks 2.6MB이지만 **route별 First Load JS**가 측정되지 않은 상태.

코드 스플리팅은 총량이 약간 늘어도 정상이다. 성공 기준은 **route별 초기 JS 감소**다.
Lighthouse만으로는 인증된 private 화면 최적화를 판별하기 어려우므로,
`npm run build` 출력의 route별 크기 + Network 탭 실측을 병행한다.

### 작업 항목

| #   | 내용                                                                                    | 상태 |
| --- | --------------------------------------------------------------------------------------- | ---- |
| 1   | `@next/bundle-analyzer` devDependency 설치                                              | ✅   |
| 2   | `next.config.ts`에 `ANALYZE=true` 조건부 래핑                                           | ✅   |
| 3   | 번들 분석 빌드 실행 → 리포트 생성 (cross-env 또는 `$env:ANALYZE="true"; npm run build`) | ✅   |
| 4   | 상위 10개 청크 내용물 식별 (어떤 모듈이 큰 청크에 들어가는지)                           | ✅   |
| 5   | **route별 First Load JS 표** 작성 (핵심 측정 대상)                                      | ✅   |
| 6   | 사이드바 진입 후 자동 prefetch 요청 수 기록 **(보조지표, 수동 측정 — 참고용)**          | ✅   |
| 7   | 기준선 수치를 history.md에 기록                                                         | ✅   |

### prefetch / Network 측정 조건 (Sprint 5 전체 공통)

prefetch 비교는 dev 모드가 아닌 **production 빌드 기준**으로 측정한다:

```
1. npm run build && npm run start (로컬 프로덕션) 또는 Vercel Preview
2. 로그인 상태에서 측정
3. Hard Reload (Ctrl+Shift+R) 후 캐시 비움
4. 동일 브라우저 (Chrome), 동일 네트워크 조건
5. Network 탭: Disable cache ON, 기록 시작 후 사이드바 진입
```

### 핵심 측정 대상 route (인증된 private 페이지)

| Route                     | 이유                                 |
| ------------------------- | ------------------------------------ |
| `/app/resumes/[id]/edit`  | 1,330줄 거대 컴포넌트 — T101 대상    |
| `/app/portfolio/settings` | 980줄 거대 컴포넌트 — T100/T101 대상 |
| `/app/cover-letters`      | 500줄 + 인라인 모달 2개 — T100 대상  |
| `/app/job-tracker`        | 529줄 + 칸반 모달 — T100 대상        |
| `/app` (홈)               | 기본 대시보드 — 비교 기준            |

### 제약 사항

- 프로덕션 코드 변경 없음 (devDependency + config만)
- 게이트 4종 통과 유지
- 기존 테스트 기준선 유지 (71 suites, 519 tests)

---

## T100 — next/dynamic 무거운 인라인 UI Lazy 로딩

### 배경

현재 UI 레벨 `next/dynamic` 사용 0건. 무거운 인라인 모달/폼/미리보기가 페이지 초기 JS에 전부 포함된다.
모달은 사용자가 버튼을 클릭하기 전까지 화면에 없으므로 lazy 로딩의 가장 안전한 후보다.

> 참고: `src/lib/pdf-download.ts`에서 native `import()` 기반 분할은 이미 적용됨.
> 이 태스크는 **UI 컴포넌트 레벨의 next/dynamic**을 도입한다.

### 대상 선별 기준

- ✅ **무거운 조건부 인라인 폼/미리보기** (100줄+ JSX 블록, `{isOpen && ...}` 패턴) → dynamic 후보
- ❌ **경량 공용 컴포넌트** (`ConfirmDialog` 59줄 등) → 이득 없음, 제외
- ❌ **항상 렌더되는 폼** (`experience-stories` :354, `company-targets` :321) → 조건부 UI 아님, lazy 부적합
- ❌ **20줄 이하 단순 조건부 UI** → overhead가 이득보다 큼, 제외

### 확정 대상

> 라인 번호는 작성 시점(2026-03-22) 스냅샷. 실제 작업 시 컴포넌트명 및 조건부 렌더 패턴(`{isOpen && ...}`)으로 재확인.

| #   | 파일                                       | 대상 (라인, 참고)              | 추출 컴포넌트명            | 상태 |
| --- | ------------------------------------------ | ------------------------------ | -------------------------- | ---- |
| 1   | `cover-letters/CoverLettersPageClient.tsx` | AI 생성 모달 (:301~398)        | `GenerateCoverLetterModal` |      |
| 2   | `cover-letters/CoverLettersPageClient.tsx` | 합격본 등록 모달 (:401~498)    | `RegisterCoverLetterModal` |      |
| 3   | `portfolio/settings/page.tsx`              | 미리보기 오버레이 (:930~980)   | `PortfolioPreviewOverlay`  |      |
| 4   | `job-tracker/page.tsx`                     | 칸반 카드 상세 모달 (:361~526) | `JobCardDetailModal`       |      |

### ssr 정책

`ssr: false`는 기본값으로 쓰지 않는다.

- **ssr: false 적용**: 브라우저 API(window, document, localStorage) 직접 의존하는 컴포넌트만
- **ssr 기본 유지 (eager)**: 핵심 편집 UI, 상태 관리 컴포넌트

### loading fallback 정책

모달 lazy 시 첫 클릭이 비어 보이지 않도록 반드시 fallback 제공:

```tsx
const HeavyModal = dynamic(() => import("./HeavyModal"), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <div className="h-6 w-32 animate-pulse rounded bg-black/10" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-black/10" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-black/10" />
        </div>
      </div>
    </div>
  ),
});
```

→ 오버레이 배경 dim + 모달 셸 골격 + 스켈레톤으로 "열리는 중"임을 즉시 전달

### 작업 절차 (파일 단위 커밋 — 3단계)

T100은 파일별로 독립 커밋하여 문제 발생 시 해당 파일만 revert 가능하게 한다.

#### T100-A: cover-letters (모달 2개)

```
1. CoverLettersPageClient.tsx 읽기 → AI 생성 모달 + 합격본 등록 모달 식별
2. GenerateCoverLetterModal 추출 + dynamic 적용
3. RegisterCoverLetterModal 추출 + dynamic 적용
4. npm run build 확인
5. RTL 테스트 작성 (2개 모달)
6. 회귀 스모크: 모달 열기/닫기/제출/취소
7. route별 First Load JS 변화 확인
8. 커밋: "refactor(cover-letters): 모달 2개 dynamic 분리"
```

#### T100-B: portfolio/settings (오버레이 1개)

```
1. settings/page.tsx 읽기 → 미리보기 오버레이 식별
2. PortfolioPreviewOverlay 추출 + dynamic 적용
3. npm run build 확인
4. RTL 테스트 작성
5. 회귀 스모크: 미리보기 열기/닫기
6. route별 First Load JS 변화 확인
7. 커밋: "refactor(settings): 미리보기 오버레이 dynamic 분리"
```

#### T100-C: job-tracker (모달 1개)

```
1. job-tracker/page.tsx 읽기 → 칸반 상세 모달 식별
2. JobCardDetailModal 추출 + dynamic 적용
3. npm run build 확인
4. RTL 테스트 작성
5. 회귀 스모크: 카드 클릭 → 상세 → 상태 변경 → 닫기
6. route별 First Load JS 변화 확인
7. 커밋: "refactor(job-tracker): 칸반 상세 모달 dynamic 분리"
```

> 각 단계 완료 후 게이트 4종 확인. 실패 시 해당 단계만 revert.

### 회귀 방어

기존 E2E 17개는 public 전용이므로 private 모달 회귀를 커버하지 못한다.
**자동화 + 수동 스모크 병행 전략**으로 방어한다.

#### 자동화 (Jest/RTL — 각 모달별 최소 1개)

dynamic 전환 후 각 추출 컴포넌트에 대해 RTL 테스트 추가:

| 대상 컴포넌트             | 테스트 범위                                       |
| ------------------------- | ------------------------------------------------- |
| `GenerateCoverLetterModal` | 열기 → 필드 렌더 → 닫기                          |
| `RegisterCoverLetterModal` | 열기 → 제목/본문 필드 렌더 → 닫기                |
| `PortfolioPreviewOverlay`  | 열기 → PortfolioFullPreview 렌더 → 닫기          |
| `JobCardDetailModal`       | 열기 → 상세 정보 렌더 → 닫기                     |

> RTL 테스트 실패 시 해당 모달의 dynamic 전환을 즉시 revert, 원인 분석 후 재적용.

#### 수동 스모크 (RTL 보완 — 제출/취소 등 서버 연동 흐름)

> **측정 환경**: production 빌드 기준 (`npm run build && npm run start`). T99의 prefetch/Network 측정 조건과 동일 적용.

| 대상              | 스모크 항목                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| AI 생성 모달      | 열기 → loading fallback 표시 → 4필드 입력 → 생성 클릭 → 결과 확인 → 닫기 |
| 합격본 등록 모달  | 열기 → loading fallback 표시 → 제목+본문 입력 → 등록 → 목록 반영 → 닫기  |
| 미리보기 오버레이 | 열기 → loading fallback 표시 → PortfolioFullPreview 렌더링 → 닫기        |
| 칸반 상세 모달    | 카드 클릭 → loading fallback 표시 → 상세 표시 → 상태 변경 → 닫기         |

### 제약 사항

- 기존 기능 동작 100% 보존
- 게이트 4종 + E2E 17개 통과 유지
- **Jest/RTL 모달 회귀 테스트 전부 통과** (신규 게이트)
- ConfirmDialog 등 경량 공용 컴포넌트는 건드리지 않음
- experience-stories/company-targets 항상 렌더되는 폼은 건드리지 않음
- 외부 라이브러리 추가 없음

---

## T102 — 네비게이션 prefetch 전략 최적화

### 배경

현재 AppSidebar의 Link 20+개 전부 `prefetch` 미지정 → Next.js 기본 동작으로 자동 프리페치.
사용자가 사이드바를 보기만 해도 20개 페이지의 JS/데이터를 미리 요청한다.
T96에서 모든 페이지에 loading.tsx 스켈레톤을 추가했으므로, prefetch 비활성화해도 체감 저하 가능성 낮음.

### 분류

> 분류 근거: 최근 dogfooding 사용 빈도 기반. PageViews 모듈은 public 포트폴리오 방문 분석 전용이므로 private workspace 메뉴 사용 빈도 데이터는 현재 없음. 정밀 분류는 workspace navigation telemetry 도입 후 후속 과제.

| 그룹       | 메뉴                                                                                                                          | prefetch           | 근거                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------- |
| **핵심**   | 홈, 프로젝트, 이력서, 경력, 노트, 자기소개서                                                                                  | 유지 (기본)        | dogfooding 기간 일상 접근 메뉴        |
| **저빈도** | 블로그, 스킬, 분석, 성장 타임라인, 피드백, 지원 트래커, 추천서, 감사 로그, 기업 분석, 교차 링크, STAR 스토리, 포트폴리오 설정 | `prefetch={false}` | 비일상 메뉴, loading.tsx 스켈레톤 있음 |

### 작업 항목

| #   | 내용                                                                                      | 상태 |
| --- | ----------------------------------------------------------------------------------------- | ---- |
| 1   | AppSidebar.tsx 내 NAV_GROUPS 구조 확인                                                    |      |
| 2   | 저빈도 메뉴 Link에 `prefetch={false}` 추가                                                |      |
| 3   | NAV_GROUPS 코드에 분류 근거 주석 추가 (향후 재분류 시 판단 기준 보존)                     |      |
| 4   | 빌드 확인                                                                                 |      |
| 5   | 핵심 메뉴 네비게이션 체감 확인 (변화 없음)                                                |      |
| 6   | 저빈도 메뉴 클릭 → loading.tsx 스켈레톤 표시 → 정상 로드 확인                             |      |
| 7   | Network 탭: 사이드바 진입 후 prefetch 요청 수 before/after 비교 **(보조지표, 참고 기록)** |      |

### 분류 재검토 계획

프로덕션 배포 후 1주일 실사용 기반으로 분류 재검토한다.
NAV_GROUPS 코드에 `// prefetch 분류: 핵심(dogfooding 일상 접근) vs 저빈도(비일상). 2026-03-22 기준. telemetry 도입 후 재분류 예정` 주석을 남겨 향후 판단 근거를 보존한다.

### 제약 사항

- 동작 변화 없음 (로딩 타이밍만 변경)
- 체감 저하 가능성 낮음 — 핵심 메뉴 prefetch 유지 + loading.tsx 스켈레톤 이미 있음
- 게이트 4종 + E2E 17개 통과 유지

---

## T101 — 초기 화면 불필요 섹션 lazy 분리

### 배경

`resumes/[id]/edit/page.tsx` (1,330줄)과 `portfolio/settings/page.tsx` (980줄)은
단일 `'use client'` 파일에 전체 로직이 들어있다.
**전체를 분할하지 않는다.** 초기 화면에 안 필요한 섹션만 추출 + dynamic 적용한다.

### 핵심 원칙

- **"거대 파일 분할" 자체가 목표가 아니다** — 초기 화면 불필요 영역만 lazy
- **1차 적용 후 수치 확인** → 부족할 때만 2차 분해
- 상태(state)와 핸들러는 부모에서 props로 전달
- 로직 변경 X — 기존 JSX 블록을 그대로 컴포넌트로 잘라내기

### 1차 대상 — 명확하게 지연 로딩 효과가 있는 영역

> 라인 번호는 작성 시점(2026-03-22) 스냅샷. 실제 작업 시 함수명/import 경로로 재확인.
> T100/T102만으로 KPI 달성 시 #2(프리뷰 결과 본문)는 생략 가능.

| 우선순위 | 파일                          | 대상                                                   | 구현 방향                                                                                                                                      | 기대 효과              | 상태 |
| -------- | ----------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- |
| **1**    | `resumes/[id]/edit/page.tsx`  | PDF: `_lib/pdf` on-demand import (:13→동적, :846 호출) | 현재 정적 `import { openResumePdfPrintWindow }` → 버튼 클릭 시 `const { openResumePdfPrintWindow } = await import(...)`                        | route JS 직접 절감 (주의: pdf-download.ts 내부의 jsPDF/html2canvas-pro는 이미 native import()로 분리됨. 래퍼 함수 자체의 route chunk 기여도를 T99에서 먼저 확인 필요. 기여도 낮을 시 #2를 1순위로 승격) |      |
| 2        | `resumes/[id]/edit/page.tsx`  | 프리뷰 **결과 본문** (:1272~1327)                      | 헤더/버튼/빈 상태 문구(:1244~1270)는 부모에 남기고, `{preview && <ResumePreviewResult/>}` 부분만 dynamic 분리. preview 상태가 있을 때만 mount. | 소폭 감소, 보조 최적화 |      |
| 3        | `portfolio/settings/page.tsx` | 미리보기 모달 (:930~980)                               | T100에서 이미 분리 시 skip, 아니면 여기서 처리                                                                                                 | T100 의존              |      |

**제외 (이번 Sprint에서 대상 아님)**:

- `ShareLinksSection` (:336~) — mount 시 useEffect로 즉시 fetch하는 구조. 단순 dynamic만 하면 초기 hydration 직후 import+fetch가 이어져서 지연 로딩 효과 제한적. 명시적 "펼치기" 액션 추가 시에만 의미 있으므로 후속 항목으로 이동.

### 2차 대상 (수치 부족 시에만)

- resume edit: 기본 정보/항목 CRUD 영역 세분화
- settings: 폼 영역별 (기본정보/연락처/구직/레이아웃) 분할
- ShareLinksSection: "공유 링크 펼치기" UI 전환 후 lazy mount (아키텍처 변경 필요)

### 작업 절차

```
1. (1순위) PDF import 동적 전환 — resume edit 읽기 → openResumePdfPrintWindow import 확인 → await import() 전환 → 빌드 확인
2. route별 First Load JS 확인 → 효과 측정
3. (2순위, KPI 달성 시 생략 가능) 프리뷰 결과 본문 경계 확인 → props 인터페이스 설계 → ResumePreviewResult 추출 + dynamic → 빌드 확인
4. route별 First Load JS 재확인
5. settings 동일 절차 (T100 미처리 영역만)
6. 1차 수치 확인 → 목표 미달 시에만 2차 분해 진행
7. 회귀 스모크: 이력서 편집 전 기능 (항목 추가/수정/삭제/순서변경/저장/프리뷰/PDF)
```

### 회귀 방어

| 대상          | 스모크 항목                                                      |
| ------------- | ---------------------------------------------------------------- |
| 이력서 편집   | 항목 추가 → 수정 → 순서 변경 → 저장 → 프리뷰 갱신 → PDF 다운로드 |
| 공유 링크     | 링크 생성 → 복사 → 비활성화                                      |
| 설정 미리보기 | 설정 변경 → 미리보기 열기 → 닫기 → 저장                          |

### 제약 사항

- 기존 기능 동작 100% 보존
- 상태 흐름 변경 없음 (props 전달만)
- 게이트 4종 + E2E 17개 통과 유지
- 파일 1개 완료 후 다음 진행

---

## T103 — 최종 route별 First Load JS 비교 + 프로덕션 배포 검증

### 배경

Sprint 5 전체 리팩토링 완료 후 T99 기준선 대비 route별 before/after를 비교하고 프로덕션 배포한다.

### 작업 항목

| #   | 내용                                                                                                        | 상태 |
| --- | ----------------------------------------------------------------------------------------------------------- | ---- |
| 1   | 번들 분석 빌드 최종 실행 → 리포트 (cross-env 또는 `$env:ANALYZE="true"; npm run build`)                     |      |
| 2   | T99 기준선 대비 **route별 First Load JS 변화표** (핵심 5개)                                                 |      |
| 3   | 사이드바 prefetch 요청 수 before/after                                                                      |      |
| 4   | lazy 대상 모달 초기 번들 미포함 확인 (bundle analyzer route chunk 제외 + Network waterfall 미포함 2중 확인) |      |
| 5   | 게이트 4종 최종 통과 (lint/build/jest/vercel-build)                                                         |      |
| 6   | E2E 17개 최종 통과                                                                                          |      |
| 7   | 프로덕션 배포 + HTTP 200 확인                                                                               |      |
| 8   | 프로덕션 스모크: resumes/edit, settings, cover-letters, 저빈도 메뉴 1개 클릭                                |      |
| 9   | T102 prefetch 분류 재검토 기록 (배포 후 1주일 실사용 후 재분류 계획 history.md 기록)                         |      |
| 10  | history.md Sprint 5 완료 기록                                                                               |      |
| 11  | plan.md Phase 체크                                                                                          |      |

### 성공 판정 기준

| KPI                          | 기준                                                                                                                                    | 구분                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| route별 First Load JS       | 핵심 3개(resumes/edit, settings, cover-letters)에서 T99 대비 감소. 나머지 2개(job-tracker, 홈)는 보조 지표이며 비정상 증가 시 원인 확인 | **pass/fail 주지표 (유일)** |
| 모달 초기 번들 포함          | lazy 대상 전부 제거 확인 (bundle analyzer route chunk + Network waterfall 2중)                                                          | 필수 확인                   |
| 기능 회귀                    | Jest 519+ / E2E 17 / RTL 모달 테스트 (열기/닫기) / 수동 스모크 (제출/취소) 전부 통과                                                    | 필수 확인                   |
| 프로덕션 스모크              | edit, settings, cover-letters, 저빈도 메뉴 1개 정상                                                                                     | 필수 확인                   |
| prefetch 요청 수             | T99 대비 감소 (수동 측정, 참고 기록)                                                                                                    | 보조지표                    |

### 제약 사항

- 총 번들 크기 소폭 증가는 허용 (route별 감소가 KPI)
- 전 기능 회귀 없음 확인
