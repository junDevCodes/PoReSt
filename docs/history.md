# PoReSt 작업 맥락서

기준일: 2026-03-15
문서 정의: 완료된 작업의 이력과 현재 작업이 진행되는 맥락을 기록. 새 세션에서 "지금 왜 이걸 하는가"를 즉시 파악하는 용도.
관련 문서: `plan.md`(전체 계획), `task.md`(현재 태스크 상세), `checklist.md`(검증 체크리스트)

---

## 기록 원칙

1. 완료 기록: "날짜 / 범위 / 핵심 변경 / 게이트 결과 / 잔여 리스크"
2. 작업은 `task.md`의 태스크 ID(Txx)와 연결
3. 완료 판정: 코드 반영 + 게이트 통과 + 사용자 검증

---

## 완료 이력

### M0~M5 + G1~G12 (2026-02-16 ~ 2026-02-20)

- 기준선 정리, 워크스페이스 API, Notes/Feedback, Public Projects, Resume 공유, Export 이력, Audit, Observability, DomainLink, Embedding, Users 디렉토리 구현 완료
- Wave2 Server-first 전환 완료
- 게이트: `lint/build/jest/vercel-build` 통과

### Wave3 + M6-1 (2026-02-22 ~ 2026-02-27)

- 랜딩/온보딩 UX, 로그인/회원가입 모드 분리, 설정 미리보기, 홈 CTA 분기 복구 완료
- T47 문서 동기화, T42 Wave3 종료 판정 완료
- 게이트: 4종 통과 (45 suites → 52 suites)

### M6-2 Reliability (2026-02-27 ~ 2026-03-04)

- T48: Projects/Resumes/Blog/Notes 클라이언트 fetch 예외 처리 표준화
- T49: Auth 로그인 후처리 실패 관측 이벤트 구현
- T45: QUICKSTART.md 설치/환경 진입 가이드 최신화
- T46: Private 5개 관리 페이지 라이트 테마 대비 복구
- 게이트: 52 suites / 176 tests → 181 tests 통과

### M6-3 Feedback-Hotfix (2026-03-05 ~ 2026-03-09)

- T62~T68: 홈 CTA 분기 복구, 노트 삭제 UX, 서브페이지 다크 토큰 정리, parseApiResponse 공용 함수 교체, UI 마이크로 핫픽스
- T63: 아바타 파일 업로드 전환 (`@vercel/blob`)
- T64: `/u/[publicSlug]` → `/portfolio/[publicSlug]` canonical 경로 전환
- 게이트: `lint/build/jest(54 suites, 203 tests)/vercel-build` 통과

### T69~T75: 포트폴리오 디자인 + 다크모드 (2026-03-09)

- T69~T74: 포트폴리오 디자인, 크림 배경 대비, 다크모드 토글, 다크모드 잔여 패턴 보완
- T75: isOwner 권한 즉시성 개선 + 배포 검증
- 게이트: 모두 통과

### T52: Audit / 오류 응답 표준 확장 (2026-03-10) ✅

- Avatar API 에러 응답 표준화, Audit API try/catch, Notes/Projects Audit 이벤트 추가

### T76 시리즈: HR 직결 + PDF + UX 폴리시 (2026-03-10) ✅

- T76: 연락처/이력서 PDF/SNS 아이콘 (Prisma 마이그레이션 포함)
- T76-R: featuredResumeId + 이력서 공유링크 자동 발급
- T76-S: 설정 UI 개선 (미리보기 모달, location datalist)
- T76-S2: PortfolioFullPreview + pdf-download.ts (html2canvas + jsPDF)
- T76-F: 비공개 처리(404/403) + triggerPdfDownload + resolveImages

### T76-G: 포트폴리오 UX 폴리시 + PDF 수정 (2026-03-10 ~ 2026-03-11) ✅

**범위**: 4개 파일 수정 + 패키지 교체 (8커밋)

**핵심 변경**:

1. **포트폴리오 PDF 다운로드 완전 수정**
   - 라이브 DOM 캡처 → HTML+CSS 직렬화 → `downloadHtmlAsPdf()` 방식 전환
   - `html2canvas` → `html2canvas-pro` 교체 (oklab/oklch 네이티브 지원)
   - 출력 품질: JPEG 0.92 → PNG 무손실, scale 2 → 3

2. **미리보기 모달 공백 클릭 닫기**
3. **포트폴리오 보기 버튼 저장 후 반영**
4. **비공개 포트폴리오 ThemeWrapper 조건부 적용**

**게이트**: `lint/build/jest(54 suites, 203 tests)/vercel-build` 통과

### T77: SEO 최적화 (2026-03-11) ✅

**범위**: 5개 파일 수정·신규 (2커밋)

**핵심 변경**:

1. **Dynamic Sitemap** — Prisma 쿼리 기반 동적 URL, `force-dynamic` 추가
2. **Dynamic OG Image** — 1200×630px, 크림 배경 + 아바타 + displayName
3. **JSON-LD 구조화 데이터** — Person(포트폴리오), Article(프로젝트)
4. **정적 OG 이미지 참조 제거**

**게이트**: `lint/build/jest(54 suites, 203 tests)/vercel-build` 통과

### T78: 경력 전용 공개 페이지 + 기술 스택 섹션 (2026-03-11 ~ 2026-03-15) ✅

**범위**: Session A (Skill 트랙) + Session B (Experience 트랙) + 프리셋 UI 개선 (8커밋)

**핵심 변경**:

1. **Skill 모듈 신규 구현** (G2)
   - `src/modules/skills/` — interface, implementation, http, index
   - CRUD API: GET/POST `/api/app/skills`, PATCH/DELETE `/api/app/skills/[id]`
   - Zod 검증 + 소유권 격리 + 중복 이름 CONFLICT 처리

2. **Skills 워크스페이스 UI** (G3)
   - `/app/skills` 페이지 + AppSidebar 메뉴 추가
   - **프리셋 50개 기술 선택 UI**: 카테고리 탭 + 검색 + 클릭형 pill + 브랜드 아이콘
   - Simple Icons CDN + devicon CDN fallback (AWS, Azure, Oracle, Nuxt)

3. **포트폴리오 홈 Skills 섹션** (G4) — category별 그룹 + pill 배지

4. **경력 편집 UI 개선** (G6) — bulletsJson/metricsJson 편집 UI

5. **경력 전용 공개 페이지** (G1)
   - `/portfolio/[slug]/experiences` — 타임라인 카드, "재직 중" 배지, bullets/metrics/techTags 렌더링

6. **포트폴리오 홈 경력 카드 개선** (G5) — isCurrent 배지 + techTags + "경력 전체 보기 →" 링크

7. **Sitemap 업데이트** (G7) — 경력 페이지 URL 추가

**게이트**: `lint/build/jest(54 suites, 203 tests)/vercel-build` 통과
**검증**: Playwright MCP로 프로덕션 브라우저 테스트 완료 (홈, 포트폴리오, 경력, 다크모드, 스킬 프리셋)

### T79: 포트폴리오 커스텀 레이아웃 (2026-03-15) ✅

**범위**: 6개 파일 수정

**핵심 변경**:

1. **layoutJson 타입 시스템 구축**
   - `LayoutSectionId`, `LayoutSection`, `LayoutConfig` 타입 정의
   - `DEFAULT_LAYOUT` 기본값 (3개 섹션 전부 visible)
   - `parseLayoutConfig()` — unknown → LayoutConfig 안전 변환 + 누락 섹션 자동 보충
   - Zod 스키마 강화: `z.unknown()` → 구조화된 `z.object()` + 중복 ID refine

2. **데이터 플로우 연동**
   - `findPublicSettingsBySlug`, `buildPublicPortfolioBySettings`, `getPublicPortfolio`에 layoutJson 추가
   - `PublicHomeViewModel`에 `layout: LayoutConfig` 포함

3. **포트폴리오 동적 섹션 렌더링**
   - ProjectsSection, ExperiencesSection, SkillsSection 컴포넌트 추출
   - `sectionRenderers` 맵 + `viewModel.layout.sections` 순서 기반 동적 렌더링
   - 프로필 헤더는 레이아웃 대상 외 (항상 최상단)

4. **설정 UI — 섹션 레이아웃 편집**
   - 섹션별 ▲▼ 순서 변경 + 가시성 체크박스 토글
   - 숨김 섹션 시각적 구분 (opacity)
   - 저장 시 layoutJson 자동 포함

**게이트**: `lint/build/jest(54 suites, 203 tests)/vercel-build` 통과
**검증**: Playwright 로컬 7/7 + 프로덕션 WebFetch 검증 (홈 섹션 순서, 경력/프로젝트 페이지, Sitemap, JSON-LD)

### T82: 포트폴리오 방문 분석 (2026-03-15) ✅

**범위**: 신규 모듈 + API 2개 + 대시보드 페이지 + 자동 트래킹

**핵심 변경**:

1. **PageView Prisma 모델**
   - `page_views` 테이블: ownerId, pageType, pageSlug, referrer, createdAt
   - `@@index([ownerId, createdAt])`, `@@index([ownerId, pageType])`

2. **pageviews 모듈 신규 구현**
   - `src/modules/pageviews/` — interface, implementation, http, index
   - `recordPageView`: publicSlug → ownerId 결정 → PageView 생성
   - `getAnalytics`: 요약/일별/페이지별/유입경로/최근 방문 집계

3. **API**
   - `POST /api/public/pageviews` — 비인증 방문 기록
   - `GET /api/app/analytics` — 인증 분석 조회 (days 쿼리)

4. **자동 트래킹**
   - `PageViewTracker` 클라이언트 컴포넌트 (pathname 기반 pageType 판별)
   - 공개 포트폴리오 레이아웃에 삽입 (fire-and-forget)

5. **대시보드**
   - `/app/analytics` — 요약 카드 + 일별 바 차트 + 페이지 분포 + 유입 경로 + 최근 방문
   - AppSidebar에 "방문 분석" 메뉴 추가

**게이트**: `lint/build/jest(54 suites, 203 tests)/vercel-build` 통과
**검증**: 프로덕션 API 심층 검증 — 201(정상), 404(미존재 slug), 422(잘못된 pageType), referrer 기록 정상

### T80-1: Gemini 클라이언트 모듈 (2026-03-15) ✅

**범위**: 신규 모듈 + SDK 설치 + 환경변수 등록

**핵심 변경**:

1. **@google/generative-ai SDK 설치**
   - `package.json` 의존성 추가

2. **Gemini 클라이언트 모듈 신규 구현**
   - `src/modules/gemini/` — interface, implementation, http, index
   - `GeminiClient` 인터페이스: `isConfigured()`, `generateEmbedding()`, `generateText()`
   - 임베딩: `text-embedding-004` (1536차원, NoteEmbedding 호환)
   - 텍스트 생성: `gemini-2.0-flash` (systemPrompt, temperature, maxOutputTokens)

3. **에러 처리 체계**
   - NOT_CONFIGURED(503), INVALID_INPUT(422), EMPTY_RESPONSE(502), API_ERROR(502), RATE_LIMITED(429)
   - `retryable` 플래그로 재시도 가능 여부 구분

4. **Fallback 전략**
   - `withGeminiFallback(client, aiPath, fallbackPath)` 유틸리티
   - GEMINI_API_KEY 미설정 → fallback 즉시 실행
   - AI 경로 retryable 실패 → fallback 자동 전환 + warn 로그

5. **환경변수**
   - `.env.example`에 `GEMINI_API_KEY` 섹션 추가

**게이트**: `lint/build/jest(55 suites, 229 tests)/vercel-build` 통과
**검증**: SDK mock 기반 Jest 26개 테스트 전체 통과

---

## 현재 진행 맥락

### 태스크 진행 순서

```
T52 ✅ → T76~G ✅ → T77 ✅ → T78 ✅ → T79 ✅ ∥ T82 ✅ → T80-1 ✅ → T80-2/3/4 → T83 ∥ T84 → T85 ∥ T86 → [확장 판단] → T87, T81
```

### 다음 태스크

T80-1 완료. 다음은 T80-2(임베딩 자동화), T80-3(노트 AI 평가), T80-4(HR 피드백) 병렬 진입 가능.

### 전략 결정 사항 (2026-03-15 논의)

- **제품 전략**: Dogfooding → M8 완료 시점에 확장 판단
- **T81(블로그 연동)**: 우선순위 최하향 — OAuth 유지보수 비용 > 기능 가치
- **핵심 원칙**: "사용 빈도를 올리는 기능"이 제품 생존 핵심

### 아키텍처 현황 메모

- Vercel Blob: `porest-blob` (Seoul icn1, Public)
- 브랜치: main 직접 push (PR 없음)
- 다크모드: `[data-theme="dark"]` + localStorage `"portfolio-theme"`
- PDF: `pdf-download.ts` (html2canvas-pro + jsPDF)
- 이력서 공유: `ResumeShareLink` (nanoid 12자)
- SEO: sitemap.ts(동적), robots.ts, OG Image(동적), JSON-LD(Person/Article)
- bulletsJson: `string[]`, metricsJson: `{ label: string; value: string }[]`
- Skills 아이콘: Simple Icons CDN(`cdn.simpleicons.org`) + devicon CDN fallback
- **layoutJson**: `{ sections: [{ id, visible }] }` — 포트폴리오 홈 섹션 순서/가시성 커스텀
- **PageView**: `page_views` 테이블, 공개 포트폴리오 자동 트래킹, `/app/analytics` 대시보드
- **Gemini 클라이언트**: `src/modules/gemini/` — `createGeminiClient()`, `withGeminiFallback()`, GEMINI_API_KEY 기반
- **AI 현재**: T80-1 완료 (클라이언트 모듈). 기존 deterministic 벡터 + regex는 T80-2/3에서 Gemini로 교체 예정
