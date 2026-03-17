# PoReSt 작업 맥락서

기준일: 2026-03-17
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

### T88 통합 완료 (2026-03-17) ✅

```
Session A ✅ (홈 + 공통, 11개)
Session B ✅ (하위 페이지, 4개)
Session C ✅ (경력 날짜 필드, 2개)
통합 게이트 ✅ lint(0 errors) / build(16.1.6) / jest(64 suites, 413 tests) / vercel-build
Playwright 시각 검증 ⬜ (5개 남음)
```

### 기준선

- jest: 64 suites, 413 tests
- lint: 0 errors, 8 warnings
- 브랜치: main 직접 push
