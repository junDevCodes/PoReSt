# PoReSt 작업 현황

## 현재 마일스톤: M5 - Feedback ✅ 완료, 리뷰 대기

---

## M0 - Foundation ✅ 완료

### 프로젝트 구조
- [x] Next.js App Router 생성
- [x] TypeScript strict mode 설정
- [x] ESLint + Prettier 설정
- [x] Route Groups (`(public)`, `(private)`)
- [x] `.env.example` 작성

### 인증/권한
- [x] Auth.js 설치 및 설정
- [x] Prisma Adapter 연결
- [x] 오너 전용 정책 (`isOwner`)
- [x] 로그인/로그아웃 페이지
- [x] 세션 쿠키 보안 설정

### 라우트 보호
- [x] Middleware 작성
- [x] `/app/*` 경로 보호
- [x] Public 경로 예외 처리
- [x] 비인증 리다이렉트

### Database
- [x] Prisma 스키마 (User, Account, Session)
- [x] PostgreSQL 연결 (Neon)
- [x] Pooled connection 설정
- [x] 초기 마이그레이션
- [x] Seed 스크립트
- [x] `lib/prisma.ts` 싱글톤

### API 가드
- [x] `lib/auth-guard.ts` 생성
- [x] `requireAuth` 함수
- [x] `requireOwner` 함수

### 배포
- [x] Vercel 프로젝트 생성
- [x] 환경변수 설정
- [x] Preview/Production 배포
- [x] `prisma migrate deploy` 자동화

### 더미 페이지
- [x] Public 레이아웃 + 홈
- [x] Private 레이아웃 + 대시보드

---

## M1 - Portfolio ✅ 핵심 마감

### 선행 작업
- [x] 문서 정합성 확정 (docs/plan/*, 06/07/08/09, 00_README)

### Prisma 스키마
- [x] PortfolioSettings 모델
  - [x] publicSlug, displayName, headline, bio, avatarUrl
  - [x] isPublic, layoutJson
  - [x] links (PortfolioLink: label, url, order)
- [x] Project 모델
  - [x] slug (unique), title, subtitle, description, contentMd
  - [x] techStack, repoUrl, demoUrl, thumbnailUrl
  - [x] visibility (PUBLIC/UNLISTED/PRIVATE)
  - [x] isFeatured, order
- [x] Experience 모델
  - [x] visibility (PUBLIC/UNLISTED/PRIVATE)
  - [x] company, role, startDate, endDate, isCurrent
  - [x] summary, bulletsJson, metricsJson, techTags
  - [x] isFeatured, order
- [x] 관계 및 인덱스 설정
- [x] 마이그레이션 실행

### 테스트
- [x] slug unique 충돌 시 409
- [x] visibility=PUBLIC만 Public API 노출
- [x] isFeatured=true는 visibility=PUBLIC 조건
- [x] slug 미존재 시 404
- [x] ownerId scope 미일치 시 403

### Public API
- [x] `GET /api/public/portfolio`
  - [x] PortfolioSettings 조회
  - [x] 대표 프로젝트 (visibility=PUBLIC + isFeatured=true)
  - [x] 대표 경험 (visibility=PUBLIC + isFeatured=true)
  - [x] DTO select (공개 필드만)
- [x] `GET /api/public/projects`
  - [x] visibility=PUBLIC 필터
  - [ ] 페이지네이션 (선택)
- [x] `GET /api/public/projects/[slug]`
  - [x] slug로 조회
  - [x] 404 처리

### Private API
- [x] `GET /api/app/portfolio/settings`
- [x] `PUT /api/app/portfolio/settings`
- [x] `GET /api/app/projects`
- [x] `POST /api/app/projects`
  - [x] slug 중복 체크
  - [x] slug 자동 생성
- [x] `GET /api/app/projects/[id]`
- [x] `PUT /api/app/projects/[id]`
- [x] `DELETE /api/app/projects/[id]`
- [x] `GET /api/app/experiences`
- [x] `POST /api/app/experiences`
- [x] `PUT /api/app/experiences/[id]`
- [x] `DELETE /api/app/experiences/[id]`
- [x] ownerId scope 강제
- [x] 에러 처리 (401/403/404/409/422)

### Public 페이지
- [x] `/` 홈 페이지
  - [x] Hero 섹션 (소개, 프로필)
  - [x] 대표 프로젝트 카드 3개
  - [x] 연락처/소셜 섹션
- [x] `/projects` 목록 페이지
  - [x] 프로젝트 그리드 레이아웃
  - [ ] 필터링 UI (선택, M1.1)
- [x] `/projects/[slug]` 상세 페이지
  - [x] Problem 섹션
  - [x] Approach 섹션
  - [x] Results 섹션
  - [x] GitHub/Demo 링크
- [x] 반응형 디자인
- [ ] 이미지 최적화 (Next.js Image, M1.1)

### SEO
- [x] 각 페이지 metadata export
- [x] OG/Canonical 기본 메타데이터 적용
- [ ] OG 이미지 자산 고도화 (M1.1)
- [x] sitemap.xml 생성
- [x] robots.txt 설정

### Admin UI
- [x] `/app/portfolio/settings`
  - [x] 프로필 편집 폼
  - [x] 소셜 링크 편집
- [x] `/app/projects` 목록
  - [x] 테이블/카드 뷰
  - [x] 정렬, 필터 (M1.1)
- [x] `/app/projects/new` (M1.1)
  - [x] Markdown 입력 필드 (M1.1)
  - [ ] 이미지 업로드 (선택, M1.1)
  - [x] 태그 입력 (M1.1)
  - [x] visibility 토글 (M1.1)
- [x] `/app/projects/[id]/edit` (M1.1)
- [x] `/app/experiences` CRUD UI
- [x] 대표 프로젝트 토글 (isFeatured)
- [x] 폼 검증 (Zod + React Hook Form, M1.1)

### 성능
- [x] ISR 적용 (`revalidate`)
- [x] on-demand revalidate (M1.1)
- [ ] Lighthouse 90+ (M1.1)

### Seed 확장
- [ ] 대표 프로젝트 3개 샘플 (M1.1)
- [ ] Experience 5개 샘플 (M1.1)
- [ ] PortfolioSettings 샘플 (M1.1)

### M1.1 Deferred (후속)
- [ ] OG 이미지 자산 고도화 및 Open Graph 검증
- [ ] Public 이미지 최적화와 Lighthouse 90+ 달성
- [ ] Markdown 리치 에디터/이미지 업로드 고도화

---

## M2 - Resume ✅ 핵심 완료

### Prisma 스키마
- [x] Resume 모델
  - [x] status, title, targetCompany, targetRole, level, summaryMd
  - [x] createdAt, updatedAt
- [x] ResumeItem 모델
  - [x] experienceId, sortOrder
  - [x] overrideBulletsJson, overrideMetricsJson, overrideTechTags, notes
- [x] Experience 확장
  - [x] metricsJson (정량 지표)
  - [x] techTags 배열
- [x] 마이그레이션 체인 반영 (기존 통합 스키마 기준)

### API
- [x] `GET /api/app/resumes`
- [x] `POST /api/app/resumes`
- [x] `GET /api/app/resumes/[id]`
- [x] `PUT /api/app/resumes/[id]`
- [x] `DELETE /api/app/resumes/[id]`
- [x] `GET /api/app/resumes/[id]/items`
- [x] `POST /api/app/resumes/[id]/items`
- [x] `PUT /api/app/resumes/[id]/items/[itemId]`
- [x] `DELETE /api/app/resumes/[id]/items/[itemId]`
- [x] `GET /api/app/resumes/[id]/preview`

### UI
- [x] `/app/resumes` 목록
  - [x] 이력서 버전 카드
  - [x] 생성/편집/삭제 버튼
- [x] `/app/resumes/new`
  - [x] 회사명, 직무 입력
  - [x] 제목 입력
- [x] `/app/resumes/[id]/edit`
  - [x] Experience 선택 입력
  - [x] Drag & Drop 순서 정렬
  - [x] Override 텍스트 편집
  - [x] 원본 vs 수정본 비교
- [x] HTML Preview (기본 JSON 프리뷰)
  - [x] 인쇄 가능 스타일
  - [x] PDF 다운로드 (브라우저 인쇄 기반)

### 동기화
- [x] 원본 Experience 변경 시 배지 표시
- [x] 동기화 알림 UI (선택)

### 테스트
- [x] `src/modules/resumes/tests/validation.test.ts`
- [x] `src/modules/resumes/tests/implementation.integration.test.ts` 추가
- [x] 통합 테스트 실통과 (DATABASE_URL_TEST 인증정보 정상화 완료)

### 운영/문서 마감
- [x] M2 배포 체크리스트 작성 (`results/deploy_checklist_m2.md`)
- [x] M2 Production 체크리스트 작성 (`results/deploy_checklist_m2_production.md`)
- [x] 로컬 게이트 확인 (`lint`, `build`, `jest --runInBand`)

---

## 다음 실행 순서 (고정)

- [x] M2 핵심 완료 및 문서 마감
- [x] M3 구현/검증/배포
- [x] M4 구현/검증/배포
- [x] M5 구현/로컬 검증
- [x] M5 Preview 배포 및 스모크 검증
- [x] M5 Production 배포 및 스모크 검증
- [ ] M1.1 Deferred + UI/UX 고도화 (리뷰 반영 후 수행)

---

## M3 - Notes ✅ 핵심 마감

### Prisma 스키마
- [x] Notebook 모델
  - [x] name, description
  - [x] ownerId
- [x] Note 모델
  - [x] title, contentMd (Markdown)
  - [x] tags (배열), domain
  - [x] notebookId
- [x] NoteEdge 모델
  - [x] fromId, toId
  - [x] relationType
  - [x] status (CANDIDATE/CONFIRMED/REJECTED)
  - [x] similarity (float)
- [x] NoteEmbedding 모델 (선택)
  - [x] noteId, embedding (vector)
- [x] 마이그레이션 실행

### API
- [x] `GET /api/app/notes`
- [x] `POST /api/app/notes`
- [x] `GET /api/app/notes/[id]`
- [x] `PUT /api/app/notes/[id]`
- [x] `DELETE /api/app/notes/[id]`
- [x] `GET /api/app/notes/search`
  - [x] q (검색어), tag, domain 필터
- [x] `GET /api/app/notes/edges`
  - [x] CANDIDATE 상태만 조회
- [x] `POST /api/app/notes/edges/confirm`
  - [x] status → CONFIRMED
- [x] `POST /api/app/notes/edges/reject`
  - [x] status → REJECTED

### Candidate Generator
- [x] 태그 매칭 알고리즘
  - [x] 공통 태그 개수 계산
  - [x] Jaccard 유사도 계산
- [x] Threshold 0.7 적용
- [x] Top-N 제한 (10~20개)
- [x] 중복 후보 제거
- [x] 자기 자신 제외
- [x] Domain 필터링
  - [x] 같은 domain 우선순위
  - [x] 가중치 로직
- [x] 성능 최적화 (인덱스 활용)

### pgvector 파이프라인 (선택, M3.1 Deferred)
- [ ] Embedding 모델 선정
- [ ] `lib/notes/embedding.ts`
- [ ] Note 저장 시 임베딩 생성
- [ ] 코사인 유사도 계산
- [ ] HNSW 인덱스 생성

### 테스트
- [x] `src/modules/notes/tests/validation.test.ts`
- [x] `src/modules/notes/tests/implementation.integration.test.ts` 추가
- [x] 통합 테스트 실통과 확인 (DATABASE_URL_TEST 로컬 환경에서 수행)

### UI
- [x] `/app/notes`
  - [x] Notebook 목록
  - [x] Note 목록 (선택된 Notebook)
- [x] `/app/notes/[id]`
  - [x] 노트 상세 뷰
  - [x] 연관 개념 리스트 (CONFIRMED)
  - [x] 연관 후보 표시 (CANDIDATE)
  - [x] Confirm/Reject 버튼
- [x] 그래프 시각화 (선택)
  - [x] SVG 기반 노드/엣지 시각화

---

## M4 - Blog ✅ 핵심 마감

### Prisma 스키마
- [x] BlogPost 모델
  - [x] title, contentMd
  - [x] status (DRAFT/PUBLISHED/ARCHIVED)
  - [x] lintReportJson
  - [x] createdAt/updatedAt/deletedAt
- [x] BlogExternalPost 모델 (선택)
  - [x] externalUrl, integration 연계
  - [ ] syncStatus 전용 필드 (M4.1 Deferred)
- [x] 마이그레이션 실행 (기존 통합 체인 적용)

### API
- [x] `GET /api/app/blog/posts`
- [x] `POST /api/app/blog/posts`
- [x] `GET /api/app/blog/posts/[id]`
- [x] `PUT /api/app/blog/posts/[id]`
- [x] `DELETE /api/app/blog/posts/[id]`
- [x] `POST /api/app/blog/posts/[id]/lint`
  - [x] Lint 실행
  - [x] lintResultJson 저장
- [x] `GET /api/app/blog/posts/[id]/export`
  - [x] HTML/MD Export
  - [x] ZIP 아카이브
- [ ] `CRUD /api/app/blog/external` (선택)

### 테스트
- [x] `src/modules/blog/tests/validation.test.ts`
- [x] `src/modules/blog/tests/implementation.integration.test.ts`
- [x] `src/modules/blog/tests/lint.test.ts`
- [x] `src/modules/blog/tests/export.test.ts`

### Lint 엔진
- [x] Rule Interface 정의
- [x] Rule 구현
  - [x] Rule 1: Long sentence (45자 이상)
  - [x] Rule 2: 반복 표현 (n-gram)
  - [x] Rule 3: 모호 표현 ("같다", "느낌")
  - [x] Rule 4: 근거 없는 단정
  - [x] Rule 5: 문단 과다 길이
  - [x] Rule 6: 단위/숫자 불일치
  - [x] Rule 7: 코드블록만 있고 설명 부족
  - [x] Rule 8: 금칙어 리스트
  - [x] Rule 9: 제목-본문 불일치
  - [ ] Rule 10: 맞춤법 (선택)
- [x] Lint Pipeline 구현
- [ ] Ignore 사유 저장 (선택)

### Export 기능
- [x] HTML Export
  - [x] 템플릿 적용
  - [x] 스타일 포함
- [x] Markdown Export
- [x] ZIP 아카이브
  - [x] HTML + MD
  - [ ] 이미지 번들링 (M4.1 Deferred)
- [x] Export URL 반환

### UI
- [x] `/app/blog`
  - [x] 글 목록 (status/visibility 표시)
  - [x] 생성/편집/삭제 버튼
- [x] `/app/blog/new`
  - [x] Markdown 입력 UI
  - [ ] 실시간 프리뷰 (M4.1 Deferred)
- [x] `/app/blog/[id]/edit`
  - [x] 편집 폼
  - [x] Lint 결과 표시
    - [x] severity/message/line 표시
  - [x] Lint 재실행 버튼
- [x] Export 다운로드 버튼
- [ ] 외부 URL 등록 UI (선택)

### M4.1 Deferred
- [ ] Rule 10(맞춤법) 추가
- [ ] 외부 블로그 연동 API/UI
- [ ] ZIP 내 이미지 번들링
- [ ] 실시간 Markdown 프리뷰 고도화

---

## M5 - Feedback ✅ 핵심 완료

### Prisma 스키마
- [x] FeedbackRequest 모델
  - [x] targetType (PORTFOLIO/RESUME/NOTE/BLOG)
  - [x] targetId
  - [x] context (JSON)
  - [x] createdAt
- [x] FeedbackItem 모델
  - [x] requestId
  - [x] title
  - [x] severity (INFO/WARNING/CRITICAL)
  - [x] message
  - [x] suggestion (선택)
- [x] 마이그레이션 실행

### API
- [x] `GET /api/app/feedback`
- [x] `POST /api/app/feedback`
- [x] `GET /api/app/feedback/[id]`
  - [x] FeedbackItem 포함
- [x] `POST /api/app/feedback/[id]/run`
  - [x] 피드백 실행
  - [x] FeedbackItem 생성
- [x] `GET /api/app/feedback/compare`
  - [x] Run 비교 (diff)

### 엔진 템플릿
- [x] `src/modules/feedback/implementation.ts` 템플릿 로직
- [x] Resume 체크 템플릿
  - [x] 회사/직무 컨텍스트 반영
  - [x] 정량화 지표 체크
  - [x] 누락 항목 체크
- [x] Portfolio 체크 템플릿
  - [x] 프로젝트 구조 검증
  - [x] 결과물 명확성 체크
- [x] Note 체크 템플릿
  - [x] 출처 확인
  - [x] 단정 표현 검출
- [x] Blog 체크 템플릿
  - [x] 상충 가능성 체크
  - [x] 근거 확인

### 실행 로직
- [x] `createFeedbackService` 실행 로직
- [x] `runFeedbackRequestForOwner(targetType, targetId, context)`
- [x] targetType별 분기 로직
- [x] FeedbackItem 생성
  - [x] title, severity, message
- [x] 결과 저장

### UI
- [x] `/app/feedback`
  - [x] 피드백 요청 목록
  - [ ] targetType별 필터
- [x] `/app/feedback/new`
  - [x] 대상 선택 (타입/ID)
  - [x] 컨텍스트 입력 (선택)
  - [x] 실행 버튼
- [x] `/app/feedback/[id]`
  - [x] 피드백 결과 상세
  - [x] FeedbackItem 목록
  - [x] severity별 색상 구분
- [x] 비교 UI
  - [x] 이전 Run 선택
  - [x] 현재 vs 이전 diff
  - [x] 개선/악화 표시

---

## 공통 작업

### 보안
- [x] `/app/*` 비인증 차단
- [x] 세션 쿠키 보안
- [x] `/api/app/*` ownerId scope 강제
- [x] Public API DTO 강제
- [x] slug 길이/문자 검증
- [x] JSON 크기 제한
- [x] XSS 방어

### 성능
- [ ] Lighthouse 90+
- [x] ISR 적용
- [ ] 이미지 최적화
- [ ] Core Web Vitals


