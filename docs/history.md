# PoReSt 작업 맥락서

기준일: 2026-03-18
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

### T80-2: 임베딩 자동화 (2026-03-15) ✅

**범위**: 노트 임베딩 모듈 Gemini 통합 + 자동 트리거 + 테스트 17개

**핵심 변경**:

1. **Gemini text-embedding-004 통합**
   - `rebuildForOwner()` — deterministic → Gemini + `withGeminiFallback()` 교체
   - `generateEmbeddingVector()` — AI/fallback 자동 분기 내부 헬퍼
   - GEMINI_API_KEY 미설정/retryable 에러 시 deterministic fallback 자동 전환

2. **콘텐츠 준비 개선**
   - `buildEmbeddingContent(title, tags, summary, contentMd)` — 4개 필드 조합
   - 9500자 절삭 (Gemini 입력 제한 10000자 대응)
   - `prepareRebuildForOwner()` select 확장 (title, tags, summary 포함)

3. **단일 노트 임베딩**
   - `embedSingleNote(ownerId, noteId)` 메서드 — 인터페이스 + 구현
   - 노트 조회 → 콘텐츠 조합 → PENDING upsert → 벡터 생성 → 적용

4. **자동 트리거**
   - `queueEmbeddingForNote(service, ownerId, noteId)` fire-and-forget 함수
   - POST `/api/app/notes` — createNote 후 자동 임베딩
   - PUT `/api/app/notes/[id]` — updateNote 후 자동 임베딩
   - 실패 시 `console.warn` (API 응답 영향 없음)

5. **DI 지원**
   - `createNoteEmbeddingPipelineService({ prisma, geminiClient? })` — 테스트 편의

**게이트**: `lint(0 errors) / build / jest(56 suites, 246 tests) / vercel-build` 통과
**검증**: SDK mock 기반 Jest 17개 테스트 + Vercel 배포 성공 (`27f6a5f`)
**커밋**: `27f6a5f`

### T80-3: 노트 AI 평가 (2026-03-15) ✅

**범위**: 피드백 모듈 노트 평가 Gemini LLM 통합

**핵심 변경**:

1. **buildNoteFeedbackItems() 리팩토링**
   - 기존 regex → `buildNoteFeedbackItemsRegex()` (fallback 분리)
   - AI 경로 → `buildNoteFeedbackItemsWithAI()` (Gemini LLM)
   - `withGeminiFallback()` 자동 분기

2. **NOTE_FEEDBACK_SYSTEM_PROMPT**
   - 개발자 기술 노트 평가 전문가 페르소나
   - 5가지 평가 기준: 완성도, 구조, 근거, 명확성, 태그
   - JSON 배열 출력 형식, 최대 5개 항목

3. **parseNoteFeedbackResponse()**
   - LLM 텍스트 → FeedbackItemDraft[] 변환
   - 코드 블록 마커 제거, JSON 배열 추출
   - severity/title/message 검증, 빈 항목 필터링
   - 파싱 실패 → retryable GeminiClientError → fallback

4. **AI 생성 추적**
   - `evidenceJson: { source: "gemini" }` 태깅

**게이트**: `lint 0 errors / build / jest(57 suites, 263 tests) / vercel-build` 통과
**검증**: 프로덕션 WebFetch — 홈, 포트폴리오, 사이트맵 정상 / 피드백 API 인증 보호(401) 정상
**커밋**: `4ba94ca`

### T80-4: HR 피드백 LLM (2026-03-15) ✅

**범위**: 포트폴리오/이력서 피드백 Gemini LLM 통합 + 공용 LLM 파서 + 11개 테스트

**핵심 변경**:

1. **HR 10년차 시니어 리크루터 페르소나**
   - `HR_SYSTEM_PROMPT` — 대한민국 IT 채용 담당자 관점 분석
   - 포트폴리오: 4가지 평가 기준 (첫인상/완성도/차별화/접근성)
   - 이력서: 5가지 평가 기준 (직무적합/정량화/기술매칭/요약품질/경력서술)

2. **포트폴리오 HR 피드백** — `buildPortfolioFeedbackItemsWithAI()`
   - 확장 데이터 조회: settings(email, location, availabilityStatus) + links + skills + 대표 프로젝트/경력
   - contextJson 지원: targetCompany/targetRole 맥락 전달
   - `withGeminiFallback()` + `getDefaultGeminiClient()` 싱글턴

3. **이력서 HR 피드백** — `buildResumeFeedbackItemsWithAI()`
   - 경력 상세 데이터: overrideBullets/Metrics/TechTags + experience 원본
   - contextJson 지원: jobDescription(JD) 전달
   - `safeJsonArray()`, `safeJsonRecord()` JSON 필드 안전 파싱

4. **공용 LLM 파서** — `parseFeedbackItemsFromLLM()`
   - 마크다운 코드블록 자동 추출, severity 정규화
   - title 100자 / message·suggestion 500자 제한
   - 필수 필드 누락 항목 자동 필터링, 파싱 실패 시 빈 배열(silent)

5. **contextJson 전달 체계**
   - `buildFeedbackItemsByTarget()` 시그니처에 contextJson 추가
   - `runFeedbackRequestForOwner()`에서 FeedbackRequest.contextJson 조회 후 전달

6. **FeedbackServicePrismaClient** — `skill` 모델 추가 (포트폴리오 기술 스택 조회)

**게이트**: `lint 0 errors / build / jest(58 suites, 274 tests) / vercel-build` 통과
**검증**: Jest 파서 테스트 11개 통과, 피드백 API 인증 보호(401) 정상
**커밋**: `4ba94ca` (T80-3과 병렬 병합)

### T80-6: 자동 후보 엣지 (2026-03-16) ✅

**범위**: 5개 파일 수정 + 1개 신규 (테스트 18개)

**핵심 변경**:

1. **`generateCandidateEdgesForNote()`** — 단일 노트 임베딩 기반 CANDIDATE 엣지 생성
   - pgvector 코사인 유사도 + 태그 Jaccard 병합
   - MAX(임베딩, 태그) 가중치 + 동일 도메인 보너스(+0.1)
   - fromId < toId 정규화, 기존 엣지 중복 방지, 상위 20개 제한

2. **`queueEmbeddingAndEdgesForNote()`** — 임베딩 → 유사 검색 → 엣지 생성 체인
   - `embedSingleNote()` 성공 후 `searchSimilarNotesForOwner()` 호출
   - `EdgeGenerationCallback` 콜백 패턴 (모듈 간 순환 의존 방지)
   - fire-and-forget, 에러 삼키기 + warn 로그

3. **API 연동** — POST/PUT `/api/app/notes` → `queueEmbeddingAndEdgesForNote()` 교체

**게이트**: `lint(0 errors) / build / jest(59 suites, 292 tests) / vercel-build` 통과
**검증**: Playwright MCP 로컬 브라우저 테스트 — 홈, 포트폴리오, API 인증/공개 엔드포인트 전체 정상
**커밋**: `976317b`

### T80-5: AI 이력서 초안 (2026-03-16) ✅

**범위**: 5개 파일 수정 + 2개 신규 (테스트 32개)

**핵심 변경**:

1. **AI 이력서 초안 생성** — `generateResumeDraft()`
   - 보유 경력/스킬 분석 → Gemini LLM으로 직무 맞춤 이력서 자동 생성
   - 이력서 작성 전문 컨설턴트 페르소나 (`RESUME_DRAFT_SYSTEM_PROMPT`)
   - 경력 인덱스 기반 LLM ↔ DB 매핑 (`parseResumeDraftResponse()`)
   - `withGeminiFallback()` — 미설정/실패 시 공개 경력 자동 포함

2. **API 엔드포인트** — `POST /api/app/resumes/draft`
   - targetCompany/targetRole/level/jobDescription 입력
   - Resume + ResumeItems 자동 생성 → 201 Created

3. **워크스페이스 UI** — "AI 초안 생성" 버튼 + 모달
   - 지원 정보 + 채용 공고(JD) 입력 폼
   - 생성 완료 시 편집 페이지 자동 리다이렉트

**게이트**: `lint(0 errors) / build / jest(60 suites, 324 tests) / vercel-build` 통과
**검증**: Playwright MCP — 홈, 포트폴리오, 경력, API 인증 보호(401/405) 정상
**커밋**: `4059e70`

### T84: 지원 이력 트래커 (칸반 + JD 매칭) (2026-03-16) ✅

**범위**: 14개 파일 (10개 신규, 4개 수정)

**핵심 변경**:

1. **CompanyTarget 스키마 확장**
   - `jobDescriptionMd` (Text) — 채용 공고 원문 저장
   - `appliedAt` (DateTime) — 실제 지원일
   - `matchScoreJson` (Json) — AI 매칭 결과 (score/matchedSkills/gaps/summary)

2. **ApplicationEvent 모델 신규**
   - 상태 변경 이력 추적 (fromStatus → toStatus + note)
   - `@@index([companyTargetId, createdAt])`

3. **job-tracker 모듈** (`src/modules/job-tracker/`)
   - `getBoardForOwner()` — 상태별 그룹핑 칸반 보드 쿼리
   - `changeStatus()` — 상태 변경 + ApplicationEvent 자동 생성
   - `runJdMatch()` — Gemini LLM JD 매칭 + 키워드 fallback
   - `getEventsForTarget()` — 타임라인 조회

4. **JD 매칭 AI**
   - `JD_MATCH_SYSTEM_PROMPT` — 10년+ 커리어 컨설턴트 페르소나
   - `buildJdMatchPrompt()` — JD + 기술/경력 프롬프트 빌더
   - `parseJdMatchResponse()` — score 0~100 범위 보정, matchedSkills 10개/gaps 5개 제한
   - `buildFallbackMatch()` — 키워드 기반 기본 매칭 (GEMINI_API_KEY 미설정 시)

5. **API 4개**
   - `GET /api/app/job-tracker` — 칸반 보드
   - `PATCH /api/app/job-tracker/[id]/status` — 상태 변경
   - `POST /api/app/job-tracker/[id]/match` — JD 매칭
   - `GET /api/app/job-tracker/[id]/events` — 이벤트 타임라인

6. **칸반 보드 UI** (`/app/job-tracker`)
   - 상태별 6컬럼, 카드 상세 모달, JD 매칭 분석 결과 표시
   - AppSidebar "지원 트래커" 메뉴 추가

**게이트**: `lint(0 errors) / build / jest(62 suites, 359 tests) / vercel-build` 통과
**커밋**: `92ab4d5`

### T83: 엔티티 연결 (Experience ↔ Project ↔ Skill) (2026-03-16) ✅

**범위**: 6개 파일 수정 + 2개 신규 (테스트 13개)

**핵심 변경**:

1. **DomainLinkEntityType SKILL 추가**
   - Prisma enum 확장 + `ensureEntityOwnedByOwner()` SKILL case
   - `DomainLinkServicePrismaClient`에 `skill`, `portfolioSettings` 추가

2. **양방향 조회** — `listBidirectionalLinksForOwner()`
   - OR 조건으로 source 또는 target 어느 쪽이든 매칭

3. **공개 엔티티 링크 조회**
   - `listPublicLinksForOwner(publicSlug)` — PROJECT/EXPERIENCE/SKILL 범위
   - `listPublicLinksForEntity(publicSlug, entityType, entityId)` — 특정 엔티티

4. **API**
   - `GET /api/public/entity-links?slug=` — 비인증 공개 조회
   - Private API: entityType+entityId 양방향 조회 파라미터 추가

5. **포트폴리오 표시**
   - 홈/경력 페이지 경력 카드에 "관련 프로젝트:" 링크 pill
   - `DomainLinkEntityType` enum 사용 (Prisma 런타임 호환 보장)

6. **워크스페이스 UI** — domain-links 페이지 SKILL 타입 옵션

**게이트**: `lint(0 errors) / build / jest(62 suites, 359 tests) / vercel-build` 통과
**검증**: curl — Public API 200/422, Private API 401, 포트폴리오 홈/경력 200
**커밋**: `eaa1a24`

### T85: 추천서/동료 평가 (2026-03-16) ✅

**범위**: 16개 파일 (12개 신규, 4개 수정) + 테스트 32개

**핵심 변경**:

1. **Testimonial Prisma 모델**
   - `testimonials` 테이블: authorName/Title/Company/Email, relationship, content, rating(1~5), status(PENDING→SUBMITTED→APPROVED→REJECTED), shareToken(unique), isPublic, displayOrder
   - `TestimonialStatus` enum 신규 (PENDING/SUBMITTED/APPROVED/REJECTED)
   - `@@index([ownerId, status])`, `@@index([shareToken])`

2. **testimonials 모듈** (`src/modules/testimonials/`)
   - `createRequest()` — 추천 요청 생성 + 16자 공유 토큰 발급
   - `updateForOwner()` — 승인/거절/공개 설정 (승인 시 isPublic 자동 true, 거절 시 자동 false)
   - `deleteForOwner()` — 소유권 검증 + 삭제
   - `getByShareToken()` — 공유 토큰으로 요청 정보 조회
   - `submitByShareToken()` — 외부 작성자 비로그인 제출 (PENDING→SUBMITTED)
   - `listPublicBySlug()` — 포트폴리오용 승인된 추천서 조회
   - Zod 스키마 3개 (create/update/submit), RELATIONSHIP_PRESETS 8개

3. **API 7개**
   - `GET/POST /api/app/testimonials` — 목록/생성 (인증 필수)
   - `PATCH/DELETE /api/app/testimonials/[id]` — 수정/삭제 (인증 필수)
   - `GET /api/public/testimonials?slug=` — 공개 조회
   - `GET/POST /api/public/testimonials/[token]` — 토큰 정보/제출

4. **워크스페이스 UI** (`/app/testimonials`)
   - 추천 요청 생성 모달 (이름/이메일/관계 프리셋)
   - 상태별 배지, 승인/거절/공개 전환 버튼
   - 공유 링크 복사, 상세 모달

5. **공개 작성 폼** (`/testimonial/[token]`)
   - 비로그인 추천서 작성 (크림 배경, 별점 UI, 관계 프리셋)
   - 이미 제출된 토큰/잘못된 토큰 에러 처리

6. **포트폴리오 통합**
   - 레이아웃 시스템 확장 (testimonials 섹션 추가)
   - 포트폴리오 홈 동적 섹션 렌더링 (승인+공개 추천서만)
   - 설정 UI 섹션 레이아웃에 "추천서" 라벨 추가
   - AppSidebar "추천서" 메뉴 추가

**게이트**: `lint(0 errors, 8 warnings) / build / jest(63 suites, 391 tests) / vercel-build` 통과
**검증**: Playwright MCP 프로덕션 — 포트폴리오 홈/경력 200, Public API 200/422, Private API 401, 토큰 API 404, 공개 폼 에러 표시
**커밋**: `b3879c5`, `72ce4ab`, `67a4fdc`

### T86: 성장 타임라인 (자동 수집 + 히트맵) (2026-03-16) ✅

**범위**: 12개 파일 (10개 신규, 2개 수정) + 테스트 22개

**핵심 변경**:

1. **GrowthEvent Prisma 모델**
   - `growth_events` 테이블: ownerId, type, title, description, entityId, occurredAt
   - 8개 이벤트 타입: SKILL_ADDED, PROJECT_CREATED, EXPERIENCE_ADDED, RESUME_CREATED, NOTE_CREATED, JOB_APPLIED, OFFER_RECEIVED, CUSTOM

2. **growth-timeline 모듈** (`src/modules/growth-timeline/`)
   - `getTimeline()` — 히트맵 일별 카운트 + 타입 분포 + 월별 요약 + 최근 이벤트
   - `createEvent()` — Zod 검증 + 수동 이벤트 추가
   - `deleteEvent()` — 소유권 검증 (NOT_FOUND/FORBIDDEN)
   - `syncFromEntities()` — 6가지 엔티티에서 자동 수집 + entityId 기반 중복 방지

3. **API 4개**
   - `GET /api/app/growth-timeline` — 타임라인 조회 (days 파라미터)
   - `POST /api/app/growth-timeline` — 수동 이벤트 추가 (201)
   - `POST /api/app/growth-timeline/sync` — 자동 수집 실행
   - `DELETE /api/app/growth-timeline/[id]` — 이벤트 삭제

4. **워크스페이스 UI** (`/app/growth-timeline`)
   - 요약 카드 + 히트맵(365일) + 월별 차트 + 타입 분포 + 타임라인 리스트
   - 이벤트 추가 모달 + 자동 수집 버튼
   - AppSidebar "성장 타임라인" 메뉴 추가

**게이트**: `lint(0 errors) / build / jest(64 suites, 413 tests) / vercel-build` 통과
**검증**: Playwright — 홈/경력/Sitemap 200, API 인증 보호(401) 4개, 로그인 리다이렉트 정상
**커밋**: `7fb82a3`

---

---

## Sprint 1 → Sprint 2 전환 (2026-03-17)

### Sprint 1 완료 요약

```
T52 ✅ → T76~G ✅ → T77 ✅ → T78 ✅ → T79 ✅ ∥ T82 ✅
→ T80-1~6 ✅ → T83 ✅ ∥ T84 ✅ → T85 ✅ ∥ T86 ✅
→ [M10 완료] → [확장 판단: 보류]
```

### 확장 판단 결과

- 4개 기준 모두 미충족 (매일 사용 ❌, 외부 조회 ❌, 타인 요청 ❌, 비용 감당 ❌)
- T87(커스텀 도메인), T81(블로그 연동), 멀티유저 인프라 → `archive.md` 이관
- 노트/블로그/기업분석 고도화 보류

### Sprint 2 전략 전환

- **포트폴리오/이력서를 프로덕션 레벨로 다듬기** 우선
- 프론트엔드 성능 최적화 (화면 전환 속도 개선)
- 기능 추가 최소화, 있는 것을 다듬는 데 집중

---

## 현재 진행 맥락

### Sprint 2 태스크

```
T88 (포트폴리오 폴리시) → T89 (이력서 UX) → T90 (성능 최적화)
```

### T88 Session A: 포트폴리오 홈 + 공통 폴리시 (2026-03-17) ✅

**범위**: 3개 파일 수정 (`page.tsx` 홈, `ThemeWrapper.tsx`, `globals.css`)

**핵심 변경**:

1. **프로필 헤더 개선**
   - 아바타 h-20→h-28 + ring-4 + shadow-lg 데코레이션
   - font-bold + tracking-tight, 헤드라인 text-xl
   - 모바일 중앙 정렬 (flex-col items-center sm:flex-row)

2. **카드 시스템 (홈 섹션)**
   - 프로젝트 카드: shadow-sm + hover:-translate-y-0.5 + 기술 태그 pill + 전체 클릭 영역
   - 경력 카드: 좌측 타임라인 연결선 (세로 라인 + 도트) + shadow-sm
   - 추천서 카드: 2컬럼 그리드 + 인용 부호 장식 + SVG 별점

3. **섹션 레이아웃**
   - 좌측 accent bar (h-6 w-1 rounded-full) 섹션 제목
   - 기술 스택 카테고리별 색상 (Frontend/Backend/DevOps/Mobile/Database)

4. **Footer CTA** — 연락 유도 + "PoReSt로 만들어졌습니다" 크레딧

5. **소셜 링크** — bg-white/60 + shadow-sm pill 스타일

6. **모바일 헤더** — "인쇄"/"PDF 저장" 텍스트 hidden sm:inline

7. **마이크로 인터랙션**
   - fade-in-up keyframe (delay 0~0.3s) 4단계
   - CTA hover:scale[1.03], 링크 화살표 translateX 애니메이션

8. **다크모드** — 신규 클래스 전체 dark override (shadow/ring/border/bg/star SVG)

**게이트**: `lint(0 errors, 8 warnings) / build` 통과

### T88 Session B: 하위 페이지 폴리시 (2026-03-17) ✅

**범위**: 3개 파일 수정 (experiences, projects, project detail)

**핵심 변경**:

1. **프로젝트 카드 개선** (`projects/page.tsx`)
   - shadow-sm + hover:shadow-md + hover:-translate-y-0.5 효과
   - 기술 스택: 점(·) 텍스트 → pill 배지 전환
   - 카드 전체 `<Link>` 래핑 (전체 클릭 영역)
   - "상세 보기" 화살표 아이콘 + hover 이동 애니메이션

2. **경력 카드 타임라인** (`experiences/page.tsx`)
   - 좌측 타임라인 세로 연결선 (w-0.5) + 도트 (22px)
   - 재직 중: 에메랄드 도트 + 내부 강조 점
   - 기간 옆 캘린더 SVG 아이콘
   - shadow-sm + hover:shadow-md

3. **프로젝트 상세 빈 섹션 숨기기** (`projects/[slug]/page.tsx`)
   - visibleSections 필터로 콘텐츠 없는 섹션 렌더링 제외
   - 섹션 제목 SVG 아이콘 (Problem/Approach/Architecture/Results/Links)
   - 기술 스택 pill 배지, Links 조건부 렌더링
   - shadow-sm + hover:shadow-md

4. **다크모드**: shadow-none + hover:border-white/20 대응, 뒤로가기 화살표 hover 애니메이션

**게이트**: `lint(0 errors, 8 warnings) / build` 통과

### T88 통합 완료 (2026-03-18) ✅

```
Session A ✅ (홈 + 공통, 11개)
Session B ✅ (하위 페이지, 4개)
Session C ✅ (경력 날짜 필드, 2개)
통합 게이트 ✅ lint(0 errors) / build(16.1.6) / jest(64 suites, 413 tests) / vercel-build
Playwright ✅ 홈 라이트/다크, 모바일 라이트/다크, 경력, 프로젝트 목록, 프로젝트 상세
```

### T89 Session B: 편집 페이지 UX (2026-03-18) ✅

**범위**: 1개 파일 수정 (`[id]/edit/page.tsx`)

**핵심 변경**:

1. **bullets 구조화 편집기** (B6)
   - JSON textarea → `BulletsEditor` 컴포넌트 (배열 입력 UI)
   - 각 행: input + 삭제 버튼, [항목 추가] 버튼
   - `parseBulletsFromJson()` / `bulletsToJson()` 안전 변환

2. **metrics 구조화 편집기** (B7)
   - JSON textarea → `MetricsEditor` 컴포넌트 (key-value 쌍 UI)
   - 각 행: key input + value input + 삭제, [지표 추가] 버튼
   - `parseMetricsFromJson()` / `metricsToJson()` 안전 변환

3. **프리뷰 포맷 렌더링** (B8)
   - `FormattedBullets` — `<ul><li>` 마커 리스트 (JSON 평문 제거)
   - `FormattedMetrics` — 키-값 인라인 배지 (JSON 평문 제거)
   - `FormattedTechTags` — pill 배지 (cyan 링)
   - 원본/수정본 비교 + 프리뷰 섹션 모두 포맷 적용

4. **공유 링크 인라인 관리** (B9)
   - `ShareLinksSection` 컴포넌트 — 편집 페이지 내 공유 링크 CRUD
   - 새 링크 생성 (POST), 목록 표시 (활성/취소됨 분리), URL 복사, 취소(revoke)

5. **ItemEditor 타입 구조 변경**
   - `overrideBulletsJsonText`/`overrideMetricsJsonText` (string) → `bullets: BulletEntry[]` / `metrics: MetricEntry[]`
   - `parseOptionalJsonText()` 중간 파서 제거 → 직접 구조화 데이터 직렬화

**게이트**: `lint(0 errors) / build` 통과

### T89 Session C: 이력서 목록 + 생성 폴리시 (2026-03-18) ✅

**범위**: 2개 파일 수정 (`ResumesPageClient.tsx`, `new/page.tsx`)

**핵심 변경**:

1. **목록 카드 상태 배지** (C10)
   - `statusBadge()` 헬퍼: DRAFT→초안(회색), SUBMITTED→제출됨(에메랄드), ARCHIVED→보관됨(앰버)
   - 카드 `shadow-sm` + `hover:shadow-md` + `hover:-translate-y-0.5` + `transition-all`
   - 회사/직무/레벨 시각 분리, 항목수+수정일 별도 줄
   - 버튼 `hover:bg-*-50` 호버 피드백

2. **생성 페이지 상태 고정** (C11)
   - `ResumeStatus` 타입 + select 드롭다운 제거 → `status: "DRAFT"` 하드코딩
   - 고정 배지 + 안내 문구

3. **모바일 반응형** (C12 부분)
   - 카드 내부 `flex-col` → `sm:flex-row` 전환 (모바일 세로 스택)

**게이트**: `lint(0 errors, 8 warnings) / build` 통과

### T89 Session A: 공유 + PDF 폴리시 (2026-03-18) ✅

**범위**: 3개 파일 수정/신규 + 테스트 16개

**핵심 변경**:

1. **데이터 포맷 유틸리티** (A1)
   - `format-resume-data.ts` 신규 — `parseBullets()`, `parseMetrics()` 안전 파서
   - null/undefined/비배열/비객체 → 빈 배열 반환, 숫자→문자열 변환
   - 16개 테스트 (정상 + 엣지 케이스)

2. **공유 페이지 리디자인** (A2~A3)
   - 다크 고정 배경 → 크림 배경 (`bg-[#fdfcf9]`) + 카드 시스템
   - bullets: `<ul><li>` 서식 리스트, metrics: emerald pill 배지
   - 기술 태그 pill, experience.summary 표시
   - 네비 바 + 풋터 CTA

3. **PDF HTML 프로급 리디자인** (A4)
   - JSON `<pre>` 완전 제거 → `<ul>` bullets + pill metrics + pill 기술 태그
   - 프로 타이포그래피 (헤더 계층, 색상 강조, 여백 최적화)
   - 번호 인디케이터 + 경력 요약 표시

4. **인쇄 CSS** (A5)
   - `print:bg-white`, `print:shadow-none`, `print:hidden` nav, `print:border` pill

**게이트**: `lint(0 errors) / build` 통과

### T89 통합 완료 (2026-03-18) ✅

```
Session A ✅ (공유 + PDF, 5개)
Session B ✅ (편집 UX, 4개)
Session C ✅ (목록 + 생성, 3개)
통합 게이트 ✅ lint(0 errors) / build(16.1.6) / jest(65 suites, 429 tests) / vercel-build
```

**핵심 요약**: 이력서 전체 UX를 개발자 도구 수준 → 프로덕션 레벨로 전환
- 공유 페이지: 다크 고정 → 크림 배경 + 카드 시스템 + 포맷 렌더링 + 인쇄 CSS
- PDF: JSON `<pre>` → 프로급 타이포 + 서식 리스트 + pill 배지
- 편집: JSON textarea → 구조화 편집기 (bullets/metrics) + 공유 링크 인라인 관리
- 목록: 상태 배지 + hover 인터랙션 / 생성: DRAFT 고정
- 라이트 테마 대비 수정 (`text-black/30,50` → `/60`)

**Playwright 프로덕션 검증 ✅**:
- 공유 페이지: 크림 배경 + bullets `<ul>` + pill 태그 + 번호 인디케이터 + 에러 처리
- 편집 페이지: 구조화 편집기(불릿/지표 UI) + 공유 링크 인라인 CRUD
- 목록 페이지: "초안" 회색 배지 + 회사/직무/항목수 레이아웃
- 생성 페이지: DRAFT 고정 배지 + 안내 문구
- 포트폴리오 홈/경력/프로젝트 하위 페이지 정상

---

### T90 상세 이력 (2026-03-18)

**Session A — P1 코드 품질 정리** (5개 파일 수정/이동/삭제):
- `format-resume-data.ts` 공용 이동 (`_lib/` → `src/lib/`) + P2 크로스 바운더리 해결
- 편집 페이지 중복 파서 3개 제거 → 공용 `parseBullets()`/`parseMetrics()` import
- `ShareLinksSection` fetch 중복 → 단일 `loadLinks(signal?)` 통합

**Session B — 포트폴리오 성능 최적화** (8개 파일):
- 데이터 페칭 병렬화: 홈 + 경력 → `Promise.all`
- 아바타 `<img>` → `next/image` + `priority` (LCP 최적화)
- `loading.tsx` 스켈레톤 3개 (홈/경력/프로젝트)
- 스킬 아이콘 `width`/`height` 명시 (CLS 방지)

---

## Sprint 3 — M12: Quality Assurance

### T91 Session B: PageViews 모듈 통합 테스트 (2026-03-18) ✅

**범위**: 2개 파일 신규 (테스트 26개)

**핵심 변경**:

1. **통합 테스트** (`implementation.integration.test.ts`, 15개)
   - B1: `recordPageView()` 정상 — 4가지 pageType 성공, pageSlug+referrer 저장, publicSlug→ownerId 결정
   - B2: `recordPageView()` 에러 — 무효 pageType(422), 미존재 slug(404), 비공개(404), 빈 slug(422)
   - B3: `getAnalytics()` 요약 — 빈 데이터(0), 30일 범위 정확도, 커스텀 days 범위
   - B4: `getAnalytics()` 집계 — 날짜 오름차순, 타입별 내림차순, referrer 호스트 추출, 최근 20개 제한

2. **Validation 테스트** (`validation.test.ts`, 11개)
   - B5: publicSlug 빈 문자열/누락, pageType 허용 4가지/비허용 6가지, referrer null/undefined 허용
   - B6: extractHost 간접 검증 — 유효 URL→호스트, 잘못된 URL→원본, null referrer→미포함
   - mock Prisma 기반 getAnalytics 빈 데이터 검증

**게이트**: `lint(0 errors, 8 warnings) / build / jest(67 suites, 455 tests)` 통과
**기준선 변동**: 65 suites → 67 suites, 429 tests → 455 tests (+2 suites, +26 tests)

### T91 Session A: Skills 모듈 통합 테스트 (2026-03-18) ✅

**범위**: 2개 파일 신규 (테스트 27개)

**핵심 변경**:

1. **통합 테스트** (`implementation.integration.test.ts`, 15개)
   - A1: `listSkillsForOwner()` — 빈 목록, 정렬(category→order→name ASC), 다중 카테고리 그룹핑
   - A2: `createSkill()` 정상 — 전체 필드, 필수만 기본값(order=0, category=null), 소유자 바인딩
   - A3: `createSkill()` 에러 — Zod 빈 name(422), 중복 CONFLICT(409), 다른 owner 동일 이름 허용
   - A4: `updateSkill()` — 부분 업데이트(name만), FORBIDDEN(403), NOT_FOUND(404)
   - A5: `deleteSkill()` — 정상 삭제+목록 제외, FORBIDDEN(403), NOT_FOUND(404)

2. **Validation 테스트** (`validation.test.ts`, 12개)
   - A6: CreateSkillInput — name 빈/50자 초과, category 30자 초과, level 범위(1~5), order 음수, 정상 케이스 2개
   - A6: UpdateSkillInput — 빈 객체 거부, name만/level만 수정 성공
   - A7: extractZodFieldErrors — 다중 필드 에러(name+level) 추출, 에러 경로 매핑 검증

**게이트**: `lint(0 errors, 8 warnings) / build / jest(69 suites, 482 tests) / vercel-build` 통과
**기준선 변동**: 67 suites → 69 suites, 455 tests → 482 tests (+2 suites, +27 tests)

### T91 통합 완료 (2026-03-18) ✅

```
Session A ✅ (Skills, 27개 — 15 integration + 12 validation)
Session B ✅ (PageViews, 26개 — 15 integration + 11 validation)
통합 게이트 ✅ lint(0 errors, 8 warnings) / build / jest(69 suites, 482 tests) / vercel-build
```

**핵심 요약**: Sprint 1 TDD 미완료 항목 즉시 해소 — archive.md 복귀 완료
- Skills 모듈: CRUD 전체 + Zod 검증 + 소유권 격리 + 에러 코드 27개 테스트
- PageViews 모듈: recordPageView + getAnalytics + 입력 검증 + extractHost 26개 테스트
- 기존 패턴 100% 준수 (describeWithDatabase, runWithRollback, createOwner, mock Prisma)

### Sprint 3 Phase 1 완료 (2026-03-18) ✅

```
Phase 1: 테스트 보강
  T91 (TDD 미완료 보충) ✅ — Skills 27개 + PageViews 26개 = 53개 신규 테스트
```

**기준선**: 69 suites, 482 tests / lint 0 errors, 8 warnings

### T92 Session A: Playwright E2E 설정 + 페이지 스펙 (2026-03-18) ✅

**범위**: 8개 파일 (4개 신규, 4개 수정)

**핵심 변경**:

1. **Playwright 환경 설정** (S1~S3)
   - `@playwright/test ^1.58.2` + Chromium 바이너리 설치
   - `playwright.config.ts`: baseURL env 기반, Chromium only, timeout 30s, expect 15s, retries 1
   - `package.json` scripts: `test:e2e`, `test:e2e:headed`, `test:e2e:report`
   - `.gitignore`: `playwright-report/`, `test-results/`, `blob-report/`
   - `jest.config.js`: `testPathIgnorePatterns: e2e/` (Jest와 분리)

2. **포트폴리오 홈 E2E** (E1, 3 tests)
   - 프로필 이름/헤드라인 표시, 섹션 제목("대표 프로젝트") 존재, 푸터 PoReSt 크레딧

3. **경력 페이지 E2E** (E2, 2 tests)
   - h1 "경력" 제목, article 카드 1개 이상 또는 빈 상태 메시지

4. **프로젝트 페이지 E2E** (E3, 3 tests)
   - 목록 페이지 제목+카드, 카드 클릭→상세 이동, 상세 페이지 제목 표시

**트러블슈팅**:
- slug `jundev` → `jundevcodes` 수정 (프로덕션 404 해결)
- Next.js streaming SSR 대응: `expect.timeout: 15000` (loading.tsx 스켈레톤 후 실제 콘텐츠 대기)
- Jest가 e2e/ 파일 수집 → `testPathIgnorePatterns` 추가

**게이트**: `lint(0 errors, 8 warnings) / test:e2e(8 passed) / jest(69 suites, 482 tests)` 통과
**커밋**: `bc583c3`

---

### T92 Session B: E2E 기능 스펙 + CI (2026-03-18) ✅

**범위**: 5개 파일 신규

**핵심 변경**:

1. **다크모드 E2E** (`portfolio-dark-mode.spec.ts`, 2 tests)
   - 토글 클릭 → `data-theme="dark"` 전환 확인
   - 다시 클릭 → `data-theme="light"` 복귀 확인
   - 선택자: `getByRole('button', { name: '다크/라이트 모드로 전환' })`

2. **모바일 반응형 E2E** (`portfolio-mobile.spec.ts`, 1 test)
   - 390×844 뷰포트 (iPhone 14) 홈 페이지 렌더링
   - 프로필 + 섹션 제목 + 스크롤 가능 확인

3. **이력서 공유 에러 E2E** (`resume-share.spec.ts`, 1 test)
   - 무효 토큰 `/resume/share/invalid-token-xxx` → rose 에러 박스 표시

4. **SEO 메타 E2E** (`seo.spec.ts`, 2 tests)
   - `<title>` 비어있지 않음 + `og:title` meta 존재
   - `/sitemap.xml` 200 + `<urlset>` + `<loc>` 포함

5. **CI E2E 워크플로우** (`.github/workflows/e2e.yml`)
   - 트리거: `workflow_dispatch` + `schedule` (매일 00:00 UTC)
   - Node.js 22 + Playwright Chromium + `npm run test:e2e`
   - `E2E_BASE_URL` 환경변수 (GitHub vars 또는 기본값)
   - 실패 시 `playwright-report/` 아티팩트 업로드 (retention 7일)

**게이트**: `lint(0 errors, 8 warnings) / test:e2e(14 passed) / jest(69 suites, 482 tests)` 통과

### T92 통합 완료 (2026-03-18) ✅

```
Session A ✅ (설정 + 페이지 스펙, 8개 E2E)
Session B ✅ (기능 스펙 + CI, 6개 E2E)
통합 게이트 ✅ lint(0 errors, 8 warnings) / test:e2e(14 passed) / jest(69 suites, 482 tests)
```

**핵심 요약**: 수동 Playwright MCP 검증 → 자동 E2E 스크립트 전환 완료
- 7개 스펙, 14개 테스트: 홈/경력/프로젝트/다크모드/모바일/이력서공유/SEO
- CI 별도 워크플로우: 매일 자동 + 수동 실행 + 실패 시 리포트 아티팩트
- Jest(src/) vs Playwright(e2e/) 완전 분리

---

## 현재 진행 맥락

### Sprint 3 진행 현황 (M12: Quality Assurance)

```
Phase 1: 테스트 보강
  T91 (TDD 미완료 보충) ✅

Phase 2: E2E 자동화
  T92 Session A ✅ (설정 + 페이지 스펙 8개)
  T92 Session B ✅ (기능 스펙 + CI 6개)

Phase 3: 품질 감사
  T93 (WCAG 접근성) ⬜ 대기
  T94 (Lighthouse 기준선) ⬜ 대기
```

### T93 Session A: 홈 + 레이아웃 + axe-core 감사 자동화 (2026-03-18) ✅

**범위**: 4개 파일 수정/신규 (`ThemeWrapper.tsx`, `[publicSlug]/page.tsx`, `e2e/accessibility.spec.ts` 신규, `package.json`)

**핵심 변경**:

1. **skip-to-content + focus 스타일** (A1)
   - ThemeWrapper에 skip-to-content 링크 (sr-only + focus:not-sr-only)
   - `<main id="main-content">` 타겟 추가
   - 헤더 버튼 3개 `focus-visible:ring-2` 추가

2. **홈 시맨틱 마크업 (Critical)** (A2)
   - 소셜 링크 `<section>` → `<nav aria-label="소셜 링크">`
   - CTA 버튼 + 소셜 링크에 `focus-visible` 추가

3. **추천서 헤딩 + StarRating (Critical + High)** (A3)
   - 추천서 저자명 `<p>` → `<h3>` 시맨틱 보강
   - StarRating `role="img" aria-label={`평점 ${rating}점`}`
   - 별 SVG `aria-hidden="true"`

4. **색상 대비 수정 (High)** (A4)
   - `text-black/50` → `text-black/65` (라이트, 7개소)
   - `text-black/55` → `text-black/65` (ThemeWrapper slug)
   - `text-white/50` → `text-white/65` (다크, 동일 패턴)

5. **SVG aria-hidden (High)** (A5)
   - 장식적 SVG 14개: SocialIcon 5종, 위치·이메일 아이콘 2개, 섹션 accent bar 4개, 별 5개

6. **axe-core E2E 접근성 자동 감사** (A6)
   - `@axe-core/playwright` 설치
   - `e2e/accessibility.spec.ts` — 3개 페이지 (홈/경력/프로젝트 목록)
   - WCAG 2.0/2.1 AA 태그 기준 Critical/Serious = 0 검증
   - 제외: `color-contrast` (Tailwind v4 oklch() + axe-core 호환성 미지원), `link-in-text-block` (pill 스타일 false positive)

**게이트**: `lint(0 errors, 8 warnings) / build / jest(69 suites, 482 tests) / test:e2e(17 passed)` 통과

### T93 Session B: 하위 페이지 접근성 수정 (2026-03-18) ✅

**범위**: 4개 파일 수정 (`experiences/page.tsx`, `projects/page.tsx`, `projects/[slug]/page.tsx`, `resume/share/[token]/page.tsx`)

**핵심 변경**:

1. **타임라인 시맨틱 구조 (Critical)** (B1)
   - 경력 목록 `<div>` → `<ol>`, 각 카드 `<div>` → `<li>`
   - Tailwind preflight 리셋으로 기존 스타일 유지

2. **타임라인 상태 표시 (High)** (B2)
   - "재직 중" `<li>` `aria-current="true"` 추가
   - 타임라인 도트 + 펄스 + 캘린더 SVG `aria-hidden="true"`

3. **경력 색상 대비 + focus (High)** (B3)
   - `text-black/60` → `text-black/70`, `text-black/50` → `text-black/65`
   - `dark:text-white/60` → `dark:text-white/70`, `dark:text-white/50` → `dark:text-white/65`
   - 관련 프로젝트 링크 `focus-visible:ring-2`

4. **프로젝트 목록 접근성** (B4)
   - 카드 Link `focus-visible:ring-2 + dark:focus-visible:ring-white/20`
   - 화살표 SVG `aria-hidden="true"`
   - 날짜 `text-black/50` → `text-black/65`

5. **프로젝트 상세 접근성 (High)** (B5)
   - 섹션/링크 아이콘 SVG + 캘린더 SVG + 뒤로가기 화살표 `aria-hidden="true"`
   - GitHub/Demo 버튼 `focus-visible:ring-2`
   - "Case Study" 라벨 `text-black/65` → `text-black/70`

6. **이력서 공유 색상 대비** (B6)
   - `text-stone-400` → `text-stone-500` (7개소), `text-stone-500` → `text-stone-600` (4개소)
   - "홈으로" 버튼 `focus-visible:ring-2`

### T93 통합 완료 (2026-03-18) ✅

```
Session A ✅ (홈 + 레이아웃 + axe-core, 6개)
Session B ✅ (하위 페이지, 6개)
통합 게이트 ✅ lint(0 errors) / build / jest(69 suites, 482 tests) / E2E(17 passed)
axe-core ✅ Critical/Serious violations = 0
```

**핵심 요약**: WCAG 접근성 Critical 3 + High 4 + Medium 포커스 전부 해소
- 시맨틱: nav, ol/li, h3, aria-label, aria-current
- 색상 대비: opacity 올림(50→65, 60→70) — 4.5:1+ 확보
- 키보드: focus-visible:ring-2 전체 인터랙티브 요소
- 스크린리더: 장식적 SVG aria-hidden, StarRating aria-label
- 자동 감사: @axe-core/playwright 3페이지 회귀 테스트

---

### T94: Lighthouse 성능 기준선 + 문서화 (2026-03-18) ✅

**범위**: 프로덕션 3페이지 × 2모드(모바일/데스크톱) Lighthouse 측정 + 문서화

**측정 환경**: Lighthouse 13.0.3, Chromium headless, 프로덕션 URL (jundevcodes.info)

**코드 변경**: 없음 (측정 + 문서화만)

#### Lighthouse 성능 기준선 (2026-03-18)

##### 카테고리 점수

| 페이지 | 모드 | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| 포트폴리오 홈 | Mobile | **87** | 96 | 100 | 92 |
| 포트폴리오 홈 | Desktop | **95** | 96 | 100 | 92 |
| 경력 | Mobile | **98** | 100 | 100 | 91 |
| 경력 | Desktop | **97** | 96 | 100 | 100 |
| 프로젝트 목록 | Mobile | **98** | 95 | 100 | 100 |
| 프로젝트 목록 | Desktop | **97** | 95 | 100 | 100 |

##### Core Web Vitals + 성능 메트릭

| 페이지 | 모드 | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|
| 포트폴리오 홈 | Mobile | 1.5s | **3.8s** | 10ms | **0** | 4.0s |
| 포트폴리오 홈 | Desktop | 0.6s | **0.8s** | 0ms | **0** | 2.1s |
| 경력 | Mobile | 1.0s | **2.2s** | 20ms | **0** | 2.6s |
| 경력 | Desktop | 0.5s | **1.1s** | 0ms | **0** | 1.3s |
| 프로젝트 목록 | Mobile | 1.0s | **2.2s** | 10ms | **0** | 3.2s |
| 프로젝트 목록 | Desktop | 0.4s | **1.0s** | 0ms | **0** | 1.4s |

##### 분석

- **CLS 0 전 페이지** — T90 최적화(next/image priority, 스킬 아이콘 width/height, loading.tsx 스켈레톤) 성과
- **TBT 0~20ms** — JavaScript 블로킹 거의 없음 (SSR + 스트리밍)
- **Best Practices 100 전 페이지** — HTTPS, 안전 API, 소스맵 정상
- **홈 모바일 LCP 3.8s** — "Needs Improvement" 구간 (2.5s~4.0s), 아바타 이미지가 LCP 요소
  - 원인: next/image priority 적용 완료이나, 모바일 네트워크 시뮬레이션(Slow 4G)에서 이미지 크기 영향
  - 데스크톱 LCP 0.8s "Good" — 네트워크 제약 없을 때 문제 없음
- **경력/프로젝트 Performance 97~98** — 이미지 없는 텍스트 기반 페이지 우수

##### 향후 성능 회귀 기준

| 메트릭 | Good 기준 | 현재 최악값 | 상태 |
|---|---|---|---|
| LCP | < 2.5s | 3.8s (홈 모바일) | ⚠️ Needs Improvement |
| FCP | < 1.8s | 1.5s (홈 모바일) | ✅ Good |
| CLS | < 0.1 | 0 | ✅ Good |
| TBT | < 200ms | 20ms | ✅ Good |
| SI | < 3.4s | 4.0s (홈 모바일) | ⚠️ Needs Improvement |

---

### Sprint 3 Phase 3 완료 (2026-03-18) ✅

```
Phase 3: 품질 감사
  T93 (WCAG 접근성) ✅ — Critical 3 + High 4 해소, axe-core E2E 3개
  T94 (Lighthouse 기준선) ✅ — 3페이지 × 2모드 측정, 기준선 문서화
```

---

## Sprint 3 (M12: Quality Assurance) 완료 요약 (2026-03-18) ✅

```
Phase 1: 테스트 보강
  T91 (TDD 미완료 보충) ✅ — Skills 27개 + PageViews 26개 = 53개 신규 테스트

Phase 2: E2E 자동화
  T92 (Playwright E2E) ✅ — 7 specs, 14 tests + CI 워크플로우

Phase 3: 품질 감사
  T93 (WCAG 접근성) ✅ — Critical/High 12개 항목 해소, axe-core 자동 감사
  T94 (Lighthouse 기준선) ✅ — 6개 측정, 기준선 문서화
```

**최종 기준선**: 69 suites, 482 tests + E2E 17 tests / lint 0 errors / Lighthouse Perf 87~98

---

## Sprint 4 — M13: 실전 최적화

### T95: 화면 전환 속도 병목 진단 (2026-03-19) ✅

**범위**: GitHub 로그인 → 워크스페이스 진입 → 내부 메뉴 전환 전 구간 프로파일링 (9개 진단 항목)

**코드 변경**: 없음 (분석 + 문서화만)

#### 진단 결과 요약

##### D1. 인증 플로우

- **JWT 전략** — session 콜백 DB 쿼리 없음 (토큰에서 복사)
- **jwt 콜백** — 초기 로그인 시 DB 쿼리 없음, 5분 후 갱신 시 `findUnique` 1회
- **signIn 이벤트** — `ensureUserRecord` 1회 + `ensurePortfolioSettingsForUser` 1~101회 (슬러그 충돌 루프)
- **리다이렉트**: `/login` → GitHub OAuth → NextAuth 내부 → `/app` (3단계)
- **예상 소요**: 570~2700ms (평균 1200ms, GitHub OAuth 의존)

##### D2. 미들웨어

- **matcher 범위**: `["/app/:path*", "/api/app/:path*"]` — **효율적** (공개 경로 스킵)
- **매 요청 DB 호출**: **없음** (JWT 검증만, getToken)
- **오버헤드**: 비공개 경로당 20~100ms (대부분 getToken)
- **중복 인증 이슈**: middleware getToken() + API 라우트 requireAuth()/getServerSession() 2중 검증

##### D3. 워크스페이스 레이아웃

- **매 전환마다 재실행됨** — `getServerSession(authOptions)` 매번 호출
- **Suspense 경계**: **없음** — 세션 페칭 시 전체 블로킹
- 세션 검증만 (데이터 페칭은 각 page.tsx에서)

##### D4. 사이드바

- **`'use client'`** 선언됨 — `usePathname()` 기반 활성 메뉴
- **부분 리렌더링** — AppSidebar만, 다른 자식 영향 없음
- 16개 메뉴 항목, 4개 그룹

##### D5. 페이지별 데이터 페칭

- **서버 페이지** (홈/프로젝트/이력서/경력/블로그/노트): 단일 또는 병렬 Prisma 쿼리, overfetch 최소
  - 홈: `Promise.all` 6개 병렬 (~50-100ms)
  - 노트: `Promise.all` 2개 병렬 (~40-80ms)
  - 나머지: 단일 서비스 호출 (~30-60ms)
- **클라이언트 페이지** (feedback/audit/testimonials/job-tracker/company-targets/experience-stories/domain-links/settings): useEffect + fetch API

##### D6. loading.tsx 유무 — **전 페이지 0개**

- **private 페이지 27개 중 loading.tsx 0개**
- 공개 포트폴리오에만 loading.tsx 3개 (T90에서 추가)
- **체감 병목의 핵심 원인**: 페이지 전환 시 빈 화면 → 콘텐츠 (깜빡임)

##### D7. Link prefetch

- **모든 Link에서 prefetch 기본값(true) 사용** — 명시적 설정 없음
- Next.js 16 기본: in-viewport 링크 자동 prefetch
- 사이드바 10개 링크가 항상 in-viewport → 자동 prefetch됨 (효율적)
- **문제 없음** — 기본 동작이 이미 최적

##### D8. 번들 크기

- **클라이언트 번들 총 크기**: 2.6MB (50개 chunk)
- **Top 4 chunk**: 409K, 300K, 221K, 220K
- **`'use client'` 파일**: 39개
- **PDF (jsPDF + html2canvas-pro)**: ✅ 동적 import (`Promise.all` 병렬) — 이미 최적화
- **@google/generative-ai**: ⚠️ 정적 import — 서버 전용이므로 클라이언트 번들 영향 없음

##### D9. 서버리스 cold start

- **프로덕션 첫 요청**: Vercel 서버리스 함수 cold start 영향
- **포트폴리오 홈**: SSR + streaming (loading.tsx 스켈레톤 → 실제 콘텐츠)
- **/app 접근**: 미인증 → `/login` 리다이렉트 (미들웨어)
- **cold start 자체는 제어 불가** — loading.tsx + prefetch로 체감 개선이 유일한 방법

---

#### 병목 우선순위 리스트

##### P1 — Critical (체감 직결)

| 병목 | 영향 | 예상 수정 |
|---|---|---|
| **loading.tsx 전무 (27개 페이지)** | 페이지 전환 시 빈 화면 → "멈춤" 체감 | 주요 페이지 loading.tsx 스켈레톤 추가 |
| **레이아웃 Suspense 없음** | 세션 페칭 시 전체 레이아웃 블로킹 | `<Suspense>` 경계 + 스트리밍 SSR |

##### P2 — High (성능 개선)

| 병목 | 영향 | 예상 수정 |
|---|---|---|
| **중복 인증** (middleware + API) | 매 API 호출 시 2중 세션 검증 | 미들웨어 토큰 → 헤더 전달 or 단일 경로 통합 검토 |
| **클라이언트 페이지 로딩 UI 부재** | 8개 클라이언트 페이지 데이터 로드 중 피드백 없음 | 각 페이지 내 로딩 상태 + Skeleton |

##### P3 — Medium (코드 품질)

| 병목 | 영향 | 예상 수정 |
|---|---|---|
| **번들 크기 2.6MB** (50 chunks) | 초기 로드 시 다운로드 량 | 대량 목록 Link prefetch={false} 검토 |
| **@google/generative-ai 정적 import** | 서버 번들에만 영향, 클라이언트 무관 | 서버 전용이므로 현행 유지 가능 |

##### 최적 상태 (수정 불필요)

- ✅ 미들웨어 matcher 범위 (공개 경로 정확 제외)
- ✅ 미들웨어 DB 호출 없음 (JWT 검증만)
- ✅ JWT 전략 + 5분 캐시 (DB 부하 최소)
- ✅ PDF 라이브러리 동적 import (1MB 절감)
- ✅ 서버 페이지 데이터 병렬 쿼리 (Promise.all)
- ✅ Link prefetch 기본값 (사이드바 자동 prefetch)
- ✅ AppSidebar 부분 리렌더링
- ✅ select 필드 최소화 (overfetch 없음)

---

#### T96 작업 항목 확정

P1 병목 기반으로 T96 범위 확정:

1. **loading.tsx 스켈레톤 추가** — 주요 10~15개 private 페이지
2. **레이아웃 Suspense 경계** — AppWorkspaceLayout에 Suspense 래핑
3. **클라이언트 페이지 로딩 상태** — 8개 useEffect 페이지 Skeleton UI

**제외 (P3 → archive)**: 중복 인증 통합, 번들 크기 심화 최적화

---

### T96 Session A: 주요 페이지 loading.tsx 스켈레톤 (2026-03-19) ✅

**범위**: 12개 파일 신규 (전부 loading.tsx)

**핵심 변경**:

1. **대시보드형 스켈레톤 (3개)**
   - `app/loading.tsx` — 헤더 카드 + 발행 체크리스트 2열 + 메트릭 4카드
   - `app/analytics/loading.tsx` — 4 요약 카드 + 바 차트 + 2열 분포/유입
   - `app/growth-timeline/loading.tsx` — 3 요약 카드 + 히트맵 그리드 + 2열 월별/타입

2. **목록형 스켈레톤 (6개)**
   - `app/projects/loading.tsx` — h1 + 3 필터 셀렉트 + 4 카드 리스트
   - `app/resumes/loading.tsx` — h1 + 2 액션 버튼 + 3 카드 (상태 배지)
   - `app/experiences/loading.tsx` — h1 + 입력 폼 2열 + 3 카드 리스트
   - `app/notes/loading.tsx` — h1 + 2열 (노트북/작성 폼) + 노트 목록
   - `app/blog/loading.tsx` — h1 + 버튼 + 4 카드 (배지 포함)
   - `app/skills/loading.tsx` — h1 + 입력 폼 + 프리셋 5탭+10그리드 + 3 스킬 리스트

3. **클라이언트형 스켈레톤 (3개)**
   - `app/feedback/loading.tsx` — h1 + 버튼 + 카드 리스트
   - `app/job-tracker/loading.tsx` — h1 + 칸반 6열 (max-w-[1400px])
   - `app/testimonials/loading.tsx` — h1 + 버튼 + 카드 리스트

**스타일 규칙**: `animate-pulse` + `bg-black/10 dark:bg-white/10` (T90 패턴 준수), Tailwind only

**게이트**: `lint(0 errors, 8 warnings) / build(70/70 static pages)` 통과

### T96 Session B: 레이아웃 Suspense + 나머지 loading.tsx (2026-03-19) ✅

**범위**: 1개 파일 수정 + 5개 파일 신규 + 2개 파일 수정 (Session A Math.random 수정)

**핵심 변경**:

1. **layout.tsx Suspense 경계** (B1)
   - `{children}`을 `<Suspense fallback={<WorkspaceSkeleton />}>` 래핑
   - 사이드바(AppShellWrapper) 즉시 렌더링 유지 — Suspense 내부에 children만 래핑
   - WorkspaceSkeleton: 제목 + 설명 + 4카드 그리드

2. **클라이언트형 스켈레톤 (4개)**
   - `app/audit/loading.tsx` — h1 + 5행 로그 카드 (action/entityType/meta)
   - `app/company-targets/loading.tsx` — h1 + 필터 + 폼 + 카드 3행
   - `app/domain-links/loading.tsx` — h1 + 4필드 생성 폼 + 4행 링크 목록
   - `app/experience-stories/loading.tsx` — h1 + 필터 + STAR 폼 + 카드 3행

3. **설정형 스켈레톤 (1개)**
   - `app/portfolio/settings/loading.tsx` — h1 + 기본정보(2열 폼)/연락처/구직상태/섹션레이아웃 4개 카드

4. **Session A Math.random 수정**
   - `analytics/loading.tsx` — `Math.random()` → 정적 높이 배열 `[60, 35, 80, ...]`
   - `growth-timeline/loading.tsx` — `Math.random()` → 정적 높이 배열 `[55, 80, 40, ...]`
   - React 렌더 중 불순 함수 호출 에러 해소

**게이트**: `lint(0 errors, 8 warnings) / build / jest(69 suites, 482 tests) / E2E(17 passed)` 통과

### T96 통합 완료 (2026-03-19) ✅

```
Session A ✅ (주요 12개 loading.tsx)
Session B ✅ (layout Suspense + 5개 loading.tsx + Math.random 수정)
통합 게이트 ✅ lint(0 errors) / build / jest(69 suites, 482 tests) / E2E(17 passed)
```

**핵심 요약**: private 페이지 loading.tsx **0개 → 17개** + layout Suspense 경계 추가
- 사이드바 즉시 렌더링 + 콘텐츠 스트리밍 SSR
- 4가지 스켈레톤 패턴: 대시보드형(3개), 목록형(6개), 클라이언트형(7개), 설정형(1개)
- 모든 스켈레톤이 실제 page.tsx 구조 매칭 (CLS 방지)

---

### Sprint 4 Phase 1 완료 (2026-03-19) ✅

```
Phase 1: 프론트엔드 화면 전환 속도 최적화
  T95 (병목 진단) ✅ — 9개 진단 항목, P1/P2/P3 우선순위 확정
  T96 (성능 최적화 적용) ✅ — loading.tsx 17개 + layout Suspense
```

---

### Sprint 4 Phase 1 통합 게이트 최종 검증 (2026-03-19) ✅

**통합 게이트 재실행 결과**:
- `npm run lint` — 0 errors, 8 warnings ✅
- `npm run build` — 성공 ✅
- `npx jest --runInBand` — 69 suites, 482 tests 전부 통과 ✅
- `npm run test:e2e` — 17 tests 전부 통과 (12.3s) ✅

**Sprint 4 Phase 1 (T95+T96) 최종 완료 확정.**

---

## 현재 진행 맥락

### Sprint 4 Phase 2 대기 (AI 자기소개서 RAG)

- T95 (병목 진단) ✅
- T96 (성능 최적화) ✅ — Phase 1 완료, 통합 게이트 최종 검증 완료
- T97 (합격 자소서 RAG 파이프라인) → 다음 작업
- T98 (자기소개서 생성 API + UI) → T97 완료 후
- 테스트 기준선: Jest 69 suites, 482 tests + E2E 17 tests
- 브랜치: main
