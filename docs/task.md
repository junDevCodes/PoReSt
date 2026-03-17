# PoReSt 작업 상세 계획서

기준일: 2026-03-18
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T89 — 이력서 편집/공유 UX 프로덕션 폴리시 ✅

> **완료**: 2026-03-18 | 통합 게이트 통과 (65 suites, 429 tests) | Playwright 시각 검증 배포 후 예정

### 진단 결과 (2026-03-18 코드 리뷰 기반)

현재 이력서 시스템은 **기능은 완비(CRUD, 공유, AI 초안)되었으나 UX가 개발자 도구 수준**이다.
채용담당자가 공유 링크를 열었을 때 "이 사람은 디테일이 좋다"고 느끼는 수준이 목표.

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 공유 페이지 배경 | 다크 고정 (흰 텍스트) | 크림/라이트 배경, 포트폴리오 스타일 통일 |
| bullets 표현 | `JSON.stringify()` 평문 | `<ul><li>` 서식 리스트 |
| metrics 표현 | `JSON.stringify()` 평문 | key: value 정돈된 표 |
| summary 렌더링 | `<pre>` 평문 | 줄바꿈 + 기본 타이포그래피 |
| PDF 출력 | JSON 평문 + 기본 CSS | 프로 이력서 레이아웃 |
| 편집 - bullets/metrics | JSON textarea 직접 입력 | 배열/키값 구조화 폼 |
| 편집 - 공유 링크 | 별도 API 호출 필요 | 편집 페이지 내 인라인 관리 |
| 편집 - 프리뷰 | JSON 평문 표시 | 포맷 적용된 실제 이력서 미리보기 |
| 목록 - 상태 표시 | 텍스트 (DRAFT/SUBMITTED) | 색상 배지 |
| 생성 - 상태 선택 | 3개 모두 선택 가능 | DRAFT 고정 (편집에서만 변경) |
| 카드 인터랙션 | 없음 | hover shadow + translateY |

### 핵심 원칙

- **외부 노출 먼저**: 공유 페이지 + PDF → HR이 직접 보는 화면이 최우선
- **데이터 렌더러 공유**: bullets/metrics 파싱 로직을 한 곳에 작성, 공유 페이지·편집 프리뷰·PDF 3곳에서 재사용
- **기존 API/스키마 변경 없음**: UI 레이어만 개선
- **기존 테스트 보호**: 64 suites, 413 tests 기준선 유지

---

### 핵심 변경 (12개 항목)

#### A. 데이터 렌더 유틸 + 공유 페이지 + PDF (5개)

1. **데이터 포맷 유틸리티 생성** (`_lib/format-resume-data.ts`)
   - `parseBullets(json: unknown): string[]` — unknown → 안전한 문자열 배열
   - `parseMetrics(json: unknown): Array<{key: string, value: string}>` — unknown → 키-값 쌍 배열
   - 방어적 파싱: null, undefined, 잘못된 타입 → 빈 배열 반환
   - 테스트 작성 (파서 안전성 검증)

2. **공유 페이지 레이아웃 리디자인**
   - 다크 고정 배경 → 크림 배경 (`bg-[#fdfcf9]`) + 포트폴리오 스타일 통일
   - 헤더: 이력서 제목 + 대상 회사/직무/레벨 + 수정일
   - 카드 시스템: 경력 항목별 `shadow-sm` 카드 + 좌측 번호 인디케이터
   - 다크모드 미지원 (라이트 전용 — 공식 이력서는 밝은 배경이 표준)

3. **공유 페이지 데이터 포맷 렌더링**
   - bullets: `<ul>` 마커 리스트 (disc, 14px 기준)
   - metrics: 키-값 인라인 배지 (key: value 형태)
   - summary: `whitespace-pre-wrap` + 기본 텍스트 스타일
   - 기술 태그: pill 배지 (포트폴리오 스타일 매칭)
   - 경력 요약(experience.summary) 표시

4. **PDF HTML 프로급 리디자인**
   - bullets: `<ul><li>` 서식 리스트 (JSON 평문 제거)
   - metrics: `<dl><dt><dd>` 또는 table 형태 키-값
   - summary: `white-space: pre-wrap` + 기본 타이포
   - 기술 태그: 쉼표 구분 → pill 형태
   - 경력 요약(experience.summary) 포함
   - 타이포그래피: 헤더 계층(h1/h2/h3) + 색상 강조 + 여백 최적화

5. **공유 페이지 인쇄 대응**
   - `@media print` CSS 추가 (공유 페이지에서 Ctrl+P 시 깨끗한 출력)
   - 불필요 요소(헤더 네비, 배경색) 숨기기

#### B. 편집 페이지 UX (4개)

6. **bullets 구조화 편집기**
   - JSON textarea → 배열 편집 UI 전환
   - 각 항목: 텍스트 input + [삭제] 버튼
   - [항목 추가] 버튼으로 행 추가
   - 내부적으로 `string[]` 유지 → 저장 시 JSON 직렬화
   - 기존 JSON 데이터가 있으면 파싱하여 행 분리

7. **metrics 구조화 편집기**
   - JSON textarea → key-value 쌍 편집 UI
   - 각 행: key input + value input + [삭제] 버튼
   - [항목 추가] 버튼으로 쌍 추가
   - 내부적으로 `Record<string, string>` 유지 → 저장 시 JSON 직렬화
   - 기존 JSON 데이터가 있으면 파싱하여 행 분리

8. **프리뷰 섹션 포맷 렌더링**
   - 기존 `JSON.stringify()` 표시 → 포맷 유틸 적용
   - bullets: 마커 리스트
   - metrics: 키-값 인라인
   - summary: 줄바꿈 보존
   - 기술 태그: pill 배지

9. **공유 링크 인라인 관리**
   - 편집 페이지에 "공유 링크" 섹션 추가
   - [새 공유 링크 생성] 버튼 (API: POST `/api/app/resumes/[id]/share-links`)
   - 기존 링크 목록 (토큰, 생성일, 만료일, 상태)
   - 클립보드 복사 버튼 (full URL: `/resume/share/[token]`)
   - [취소] 버튼 (API: DELETE `/api/app/resumes/[id]/share-links`)

#### C. 목록 + 생성 페이지 (3개)

10. **목록 카드 상태 배지 + hover**
    - 상태별 색상 배지: DRAFT(회색) / SUBMITTED(에메랄드) / ARCHIVED(앰버)
    - 카드 `shadow-sm` + `hover:shadow-md` + `hover:-translate-y-0.5` + `transition`
    - 회사/직무 정보 계층 개선 (현재 한 줄 → 2줄 분리)

11. **생성 페이지 상태 고정**
    - 상태 드롭다운 제거 → DRAFT 고정 (서버에 status: "DRAFT" 전송)
    - 안내 문구: "생성 후 편집 페이지에서 상태를 변경할 수 있습니다."

12. **모바일 반응형 보강**
    - 목록: 375px에서 버튼 줄바꿈 (`flex-wrap` + gap 조정)
    - 편집: 항목 편집기 세로 스택 (md 이하에서 grid → 단일 컬럼)
    - 공유: 본문 `px-4` (기존 `px-6` → 좁은 화면 여백 확보)

---

### 병렬 실행 구조

파일 충돌 기준으로 3개 세션 동시 실행 가능.

```
Session A (공유 + PDF) ✅            Session B (편집 UX) ✅          Session C (목록 + 생성) ✅
──────────────────────              ──────────────────────          ──────────────────────
A1. format-resume-data 유틸 ✅      B6. bullets 구조화 편집기 ✅     C10. 상태 배지 + hover ✅
A2. 공유 페이지 리디자인 ✅         B7. metrics 구조화 편집기 ✅     C11. 생성 페이지 상태 고정 ✅
A3. 공유 데이터 포맷 렌더 ✅        B8. 프리뷰 포맷 렌더링 ✅       C12. 모바일 반응형 ✅ (목록 완료, 편집/공유 → B/A)
A4. PDF HTML 리디자인 ✅            B9. 공유 링크 인라인 관리 ✅
A5. 공유 인쇄 CSS ✅
          ↘                통합 게이트 ✅ (lint/build/jest/vercel-build)           ↙
```

### 세션별 수정 파일 (충돌 없음)

| 세션 | 수정 파일 | 항목 수 |
|---|---|---|
| **Session A** | `_lib/format-resume-data.ts`(신규), `share/[token]/page.tsx`, `_lib/pdf.ts` | 5개 |
| **Session B** | `[id]/edit/page.tsx` | 4개 |
| **Session C** | `ResumesPageClient.tsx`, `new/page.tsx` | 3개 |

### 의존성

- **A ∥ B ∥ C**: 3개 세션 완전 독립 실행 가능
- **B → A (선택적)**: Session B의 프리뷰 포맷 렌더링에서 `format-resume-data.ts` import 가능
  - B가 A보다 먼저 완료되면 인라인으로 동일 로직 구현 → A 완료 후 import 교체
  - 또는 A 먼저 완료 후 B에서 바로 import
- **통합**: 3개 세션 모두 완료 후 게이트 4종 재실행

### 변경 파일 목록

**Session A (공유 + PDF):**
- `src/app/(private)/app/resumes/_lib/format-resume-data.ts` — 신규: 데이터 포맷 유틸
- `src/app/(private)/app/resumes/_lib/__tests__/format-resume-data.test.ts` — 신규: 테스트
- `src/app/(public)/resume/share/[token]/page.tsx` — 공유 페이지 리디자인
- `src/app/(private)/app/resumes/_lib/pdf.ts` — PDF HTML 리디자인

**Session B (편집 UX):**
- `src/app/(private)/app/resumes/[id]/edit/page.tsx` — 구조화 편집기 + 공유 링크 관리

**Session C (목록 + 생성):**
- `src/app/(private)/app/resumes/ResumesPageClient.tsx` — 상태 배지 + hover
- `src/app/(private)/app/resumes/new/page.tsx` — 상태 고정 + 정리

### 제약 사항

- 외부 라이브러리 추가 금지 (Tailwind + 기존 스택만 사용)
- 기존 데이터 모델/API/Prisma 스키마 변경 없음
- 기존 테스트 깨뜨리지 않음 (64 suites, 413 tests 기준선)
- 기존 `_lib/compare.ts`, `_lib/reorder.ts`, `_lib/sync.ts` 유지 (import 경로 불변)
