# PoReSt 작업 검증 체크리스트

기준일: 2026-03-15
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T79 — 포트폴리오 커스텀 레이아웃 ✅

---

### 타입/검증 계층

- [x] `src/modules/portfolio-settings/interface.ts` — LayoutSectionId, LayoutSection, LayoutConfig 타입 정의
- [x] `LAYOUT_SECTION_IDS` 상수 (`["projects", "experiences", "skills"]`)
- [x] `DEFAULT_LAYOUT` 기본값 (3개 섹션 전부 visible)
- [x] `parseLayoutConfig(raw)` — unknown → LayoutConfig 변환, 누락 섹션 자동 보충
- [x] `src/modules/portfolio-settings/implementation.ts` — Zod 스키마 강화:
  - `z.object({ sections: z.array(z.object({ id: z.enum(...), visible: z.boolean() })) })`
  - 중복 섹션 ID refine 검증
  - optional + nullable 유지

### 데이터 플로우 계층

- [x] `src/modules/projects/implementation.ts`:
  - `findPublicSettingsBySlug` select에 `layoutJson: true` 추가
  - `buildPublicPortfolioBySettings` 파라미터에 `layoutJson: unknown` 추가
  - 반환값에 `layoutJson` 포함
  - `getPublicPortfolio` fallback 경로에도 layoutJson 추가
- [x] `src/view-models/public-portfolio.ts`:
  - `PublicHomeViewModel`에 `layout: LayoutConfig` 필드 추가
  - `toPublicHomeViewModel`에서 `parseLayoutConfig(root.layoutJson)` 호출

### 렌더링 계층

- [x] `src/app/(public)/portfolio/[publicSlug]/page.tsx`:
  - ProjectsSection, ExperiencesSection, SkillsSection 컴포넌트 추출
  - `sectionRenderers` 맵 구성 (LayoutSectionId → React.ReactNode)
  - `viewModel.layout.sections.filter(s => s.visible).map(...)` 동적 렌더링
  - 프로필 헤더/버튼/소셜 링크는 항상 최상단 (레이아웃 대상 아님)

### 설정 UI 계층

- [x] `src/app/(private)/app/portfolio/settings/page.tsx`:
  - `PortfolioSettingsDto`에 `layoutJson: unknown` 추가
  - `PortfolioSettingsFormState`에 `layoutSections: LayoutSection[]` 추가
  - `toFormState`에서 `parseLayoutConfig(dto.layoutJson)` 사용
  - `handleSubmit` payload에 `layoutJson: { sections: form.layoutSections }` 포함
  - 섹션 레이아웃 편집 UI:
    - 각 섹션 행: 순서 번호 + 섹션 이름 + 가시성 토글
    - ▲▼ 버튼으로 순서 변경 (첫/마지막 비활성)
    - 숨김 섹션 시각적 구분 (opacity 낮춤)

### 동작 검증 (Playwright 7/7 통과)

- [x] 포트폴리오 홈 기본 렌더링 (200, h1 프로필 표시)
- [x] 섹션 순서 정합 (`대표 프로젝트 → 경력 → 기술 스택` = DEFAULT_LAYOUT)
- [x] 설정 페이지 레이아웃 편집 UI (▲▼ 버튼 + 가시성 체크박스)
- [x] 다크모드 렌더링 정상
- [x] 경력 전용 페이지 `/portfolio/[slug]/experiences` 200
- [x] 프로젝트 목록 페이지 `/portfolio/[slug]/projects` 200
- [x] Sitemap에 experiences URL 포함

---

## T82 — 포트폴리오 방문 분석 ✅

---

### 스키마 & 모듈

- [x] `prisma/schema.prisma` — PageView 모델 추가
- [x] `src/modules/pageviews/` — interface, implementation, http, index
- [x] Zod 검증: publicSlug(필수), pageType(enum), pageSlug(max 200), referrer(max 2000)

### API

- [x] `POST /api/public/pageviews` — 비인증 방문 기록 API
- [x] `GET /api/app/analytics` — 인증 분석 조회 API

### 자동 트래킹

- [x] `PageViewTracker.tsx` — 클라이언트 컴포넌트 (fire-and-forget)
- [x] 공개 포트폴리오 layout에 삽입

### 대시보드 UI

- [x] `/app/analytics` 서버+클라이언트 컴포넌트
- [x] AppSidebar에 "방문 분석" 메뉴 추가

---

### 통합 게이트 (T79 + T82 합류)

- [x] `npm run lint` 통과 (0 errors, 6 warnings — hooks 내부만)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (54 suites, 203 tests)
- [x] `npm run vercel-build` 통과 (T82 Zod enum 호환성 수정 포함)

---

### 매 태스크 종료 시 공통

- [x] 게이트 4종 통과
- [x] Playwright 브라우저 테스트 7/7 통과 (T79)
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
