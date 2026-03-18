# PoReSt 전체 작업 계획서 — Sprint 3

기준일: 2026-03-18
문서 정의: 프로젝트 비전·마일스톤·로드맵·게이트를 관리하는 단일 기준 문서
관련 문서: `task.md`(현재 태스크 상세), `checklist.md`(검증 체크리스트), `history.md`(완료 이력·맥락), `archive.md`(보류 항목·아이디어)

---

## 1) 비전과 전략

### 1.1 비전

PoReSt는 공개 포트폴리오(`/portfolio/[publicSlug]`)와 개인 워크스페이스(`/app`)를 통합한 **개인 개발자 OS**다.

### 1.2 제품 전략

**Dogfooding → 폴리시 → 품질 보증 → 확장**

1. **Sprint 1 (M6~M10)**: 기능 구현 완료 ✅ → `history.md` 참조
2. **Sprint 2 (M11-P)**: 포트폴리오/이력서 프로덕션 폴리시 + 프론트엔드 최적화 ✅
3. **Sprint 3 (M12, 현재)**: 품질 보증 — 테스트 보강 + E2E 자동화 + 접근성 + 성능 기준선
4. **Sprint 4 (확장, 보류)**: 멀티유저, 커스텀 도메인 → `archive.md` 이관

### 1.3 Sprint 3 핵심 원칙

- **테스트 안전망 완성** — 알려진 빈틈(archive TDD 8개) 즉시 해소, 더 이상 수동 검증에 의존하지 않음
- **회귀 방지 자동화** — 수동 Playwright MCP 검증 → 자동 E2E 스크립트 전환
- **웹 표준 준수** — 개발자 포트폴리오가 접근성을 무시하면 신뢰도 하락
- **측정 기반 판단** — Lighthouse 기준선 설정 → 향후 성능 회귀 감지

---

## 2) Sprint 1 완료 요약

> 상세 이력은 `history.md` 참조

| 마일스톤 | 핵심 내용 | 상태 |
|---|---|---|
| M6 | 안정화 완결 (Audit, 에러 표준화) | ✅ |
| M7 | 포트폴리오 채용 가치 (HR 직결, SEO, 경력, 레이아웃) | ✅ |
| M8 | AI 고도화 (Gemini 임베딩/피드백/이력서 초안) | ✅ |
| M9 | 데이터·인사이트 (방문 분석, 엔티티 연결) | ✅ |
| M10 | 커리어 관리 (지원 트래커, 추천서, 성장 타임라인) | ✅ |

**기준선**: 64 suites, 413 tests / lint 0 errors

---

## 3) Sprint 2 완료 요약 — M11-P: Production Polish ✅

> 상세 이력은 `history.md` 참조

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T88 | 포트폴리오 디자인/UX 프로덕션 레벨 | ✅ |
| T89 | 이력서 편집/공유 UX 프로덕션 폴리시 | ✅ |
| T90 | 성능 최적화 + P1 코드 품질 정리 | ✅ |

**최종 기준선**: 65 suites, 429 tests / lint 0 errors, 8 warnings

---

## 4) Sprint 3 마일스톤 — M12: Quality Assurance

### 목표

> 코드 변경 시 자동으로 품질이 검증되고, 포트폴리오가 웹 표준을 준수하는 상태

### 진입 근거

Sprint 2 완료로 다음 조건 충족:
- archive.md TDD 미완료 항목 복귀 조건 충족 ("M11-P 완료 후 안정화 단계")
- 수동 Playwright 검증이 매 태스크마다 반복 — 자동화 필요
- 접근성 미비 (aria 16개소, role/label 거의 없음)
- Lighthouse 기준선 미설정 (T90 B11 잔여)

### Phase 1: 테스트 보강

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T91 | TDD 미완료 보충 — Skills + PageViews 통합 테스트 | ✅ |

### Phase 2: E2E 자동화

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T92 | Playwright E2E 회귀 테스트 + CI 연동 (14 tests, 7 specs) | 🔵 Session A ✅, Session B 대기 |

### Phase 3: 품질 감사

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T93 | WCAG 접근성 기본 점검 + 핵심 수정 | ⬜ 대기 |
| T94 | Lighthouse 성능 기준선 + 문서화 | ⬜ 대기 |

### 실행 순서

```
T91 (TDD 보충)          — 단위 테스트 기반 강화
  ↓
T92 (E2E 자동화)        — 회귀 방지 자동화 (단위 테스트 확보 후)
  ↓
T93 ∥ T94              — 독립 실행 가능 (파일 겹침 없음)
```

---

## 5) 태스크 상세

### T91 — TDD 미완료 보충 (Skills + PageViews 통합 테스트)

**범위**: archive.md 복귀 (Test-M7-01~07, Test-M9-01) + 모듈별 validation 테스트

**배경**: Sprint 1에서 기능 구현 우선으로 Skills(M7), PageViews(M9) 모듈의 통합 테스트가 완전 누락. Sprint 2(M11-P) 완료로 복귀 조건 충족.

**확정 영역** (13개 항목, 2 세션 병렬):
- Session A: Skills 모듈 CRUD 통합 테스트 + Zod validation (7개)
- Session B: PageViews 모듈 recordPageView + getAnalytics 통합 테스트 (6개)

**예상 테스트 증가**: +25~35개 → 기준선 약 455~465 tests

### T92 — Playwright E2E 회귀 테스트 자동화

**범위**: Playwright 설치 + 프로덕션 smoke test E2E 7개 스펙 + CI 연동

**확정 영역** (12개 항목, 단일 세션):
- Setup (3): @playwright/test 설치 + playwright.config.ts + package.json scripts + .gitignore
- E2E Specs (7파일, 14 tests):
  - portfolio-home: 프로필 + 섹션 제목 + 푸터 (3)
  - portfolio-experiences: 경력 제목 + 타임라인 카드 (2)
  - portfolio-projects: 목록 + 카드 클릭 상세 이동 + Case Study (3)
  - portfolio-dark-mode: 토글 → data-theme 전환/복귀 (2)
  - portfolio-mobile: 390×844 뷰포트 홈 렌더링 (1)
  - resume-share: 무효 토큰 에러 표시 (1)
  - seo: meta/OG 태그 + sitemap.xml 200 (2)
- CI (2): `.github/workflows/e2e.yml` (별도 워크플로우) + 리포트 아티팩트

**설계 판단**: 프로덕션 URL 대상 smoke test, 별도 CI 워크플로우(schedule+manual), Chromium only, 텍스트 기반 선택자

**병렬 구조** (2 세션, Session A 설정 커밋 후 Session B 시작):
- Session A: 설정(S1~S3) + 페이지 스펙(E1~E3) — 6개 파일
- Session B: 기능 스펙(E4~E7) + CI(C1~C2) — 5개 파일 (충돌 없음)

### T93 — WCAG 접근성 기본 점검 + 핵심 수정

**범위**: 포트폴리오 공개 페이지 접근성 감사 + Critical/High 수정

**예상 영역**:
- 폼 필드 `<label>` 연결 + aria-label 보강
- 색상 대비 4.5:1 검증 (크림 배경 + 다크모드)
- 키보드 네비게이션 주요 경로 확인 (탭 순서, 포커스 표시)
- 이미지 alt 텍스트 검증
- 스크린 리더 호환성 기본 점검

### T94 — Lighthouse 성능 기준선 + 문서화

**범위**: 프로덕션 Lighthouse 측정 + 기준선 기록 (T90 B11 잔여 포함)

**예상 영역**:
- 프로덕션 Lighthouse 측정 (모바일 + 데스크톱)
- LCP / FCP / CLS / TBT / SI 수치 기록
- 포트폴리오 홈 + 경력 + 프로젝트 3개 페이지 측정
- history.md에 성능 기준선 문서화
- (선택) Lighthouse CI 설정 검토

---

## 6) 게이트 규칙

### 6.1 고정 게이트 (매 태스크 완료 시)

1. `npm run lint` — 0 errors
2. `npm run build` — 성공
3. `npx jest --runInBand` — 기준선 이상
4. `npm run vercel-build` — 성공

### 6.2 Sprint 3 추가 게이트

- 신규 테스트 전체 통과 (T91: +25개 이상)
- E2E 시나리오 전체 통과 (T92: 10개 이상)
- 접근성 Critical/High 이슈 0개 (T93)
- Lighthouse 성능 점수 기록 (T94)

### 6.3 기준선

- jest: 69 suites, 482 tests
- lint: 0 errors, 8 warnings
- 브랜치: main 직접 push

---

## 7) 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| 테스트 작성 범위 확산 (6개 모듈 전부) | T91은 Skills + PageViews만. 나머지 4개는 부분 테스트 존재하므로 보류 |
| E2E 환경 설정 복잡도 | 프로덕션 URL 대상 smoke test로 시작, CI 환경은 점진적 |
| 접근성 수정 → 디자인 파괴 | 기존 Playwright 시각 검증으로 UI 회귀 감지 |
| "완벽" 함정 | Phase별 완료 기준 명확화, Critical/High만 수정 |

---

## 8) 아키텍처 현황 메모

> Sprint 1~2에서 구축된 기술 스택. Sprint 3에서 참조용.

- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **스타일**: Tailwind CSS 4
- **ORM**: Prisma 7.3 + NeonDB (PostgreSQL)
- **인증**: NextAuth 4.x (Google OAuth)
- **배포**: Vercel
- **CI/CD**: GitHub Actions (lint→build→jest→deploy)
- **모니터링**: `src/lib/monitoring.ts` (자체 Sentry DSN 구현)
- **다크모드**: `[data-theme="dark"]` + localStorage `"portfolio-theme"`
- **PDF**: `pdf-download.ts` (html2canvas-pro + jsPDF)
- **SEO**: sitemap.ts(동적), robots.ts, OG Image(동적), JSON-LD
- **layoutJson**: `{ sections: [{ id, visible }] }` — 섹션 순서/가시성
- **이력서 공유**: `ResumeShareLink` (nanoid 12자)
- **Skills 아이콘**: Simple Icons CDN + devicon CDN fallback
- **Gemini**: `src/modules/gemini/` — `withGeminiFallback()` 패턴
- **테스트**: Jest (69 suites, 482 tests) + 수동 Playwright MCP
