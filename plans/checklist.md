# PoReSt 개발 체크리스트

---

## M0 — Foundation ✅

### 프로젝트 구조
- [x] Next.js App Router 생성
- [x] TypeScript strict mode 설정
- [x] ESLint 설정
- [x] Prettier 설정
- [x] `.gitignore` 설정
- [x] Route Groups 생성 (`(public)`, `(private)`)
- [x] `.env.example` 작성
- [x] `package.json` scripts 정리

### 인증/권한 (Auth.js)
- [x] `next-auth` 패키지 설치
- [x] `@auth/prisma-adapter` 설치
- [x] `/api/auth/[...nextauth]/route.ts` 작성
- [x] Google OAuth Provider 설정
- [x] Prisma Adapter 연결
- [x] 오너 전용 정책 (`isOwner` 체크)
- [x] 세션 전략 설정 (JWT)
- [x] 세션 쿠키 보안 (HttpOnly, Secure, SameSite)
- [x] 로그인 페이지 (`/auth/signin`)
- [x] 로그아웃 기능

### 라우트 보호 (Middleware)
- [x] `middleware.ts` 파일 작성
- [x] `/app/*` 경로 보호 로직
- [x] Public 경로 예외 처리 (`/`, `/projects`, `/api/public/*`)
- [x] 비인증 접근 시 리다이렉트
- [x] Middleware matcher 설정
- [x] Edge Runtime 호환성 확인

### Database (Prisma + PostgreSQL)
- [x] Prisma 설치
- [x] `schema.prisma` 파일 생성
- [x] User 모델 (id, email, name, isOwner)
- [x] Account 모델 (Auth.js용)
- [x] Session 모델 (Auth.js용)
- [x] VerificationToken 모델
- [x] 관계 설정 (User ↔ Account, Session)
- [x] 인덱스 설정 (email unique)
- [x] PostgreSQL 연결 (Neon)
- [x] Pooled connection 설정
- [x] `prisma migrate dev` 실행
- [x] `lib/prisma.ts` 싱글톤 생성
- [x] 쿼리 로깅 설정 (개발 환경)

### Seed 스크립트
- [x] `prisma/seed.ts` 파일 생성
- [x] 오너 User 생성 로직
- [x] `package.json`에 seed 스크립트 추가
- [x] Seed 실행 및 확인

### API 인증 가드
- [x] `lib/auth-guard.ts` 파일 생성
- [x] `getServerSession` 유틸 함수
- [x] `requireAuth` 미들웨어 함수
- [x] `requireOwner` 미들웨어 함수
- [x] 401/403 에러 응답 표준화

### 배포 (Vercel)
- [x] Vercel 프로젝트 생성
- [x] GitHub 연동
- [x] 환경변수 설정 (Preview/Production)
  - [x] `DATABASE_URL`
  - [x] `AUTH_SECRET`
  - [x] `AUTH_TRUST_HOST`
  - [x] `NEXT_PUBLIC_SITE_URL`
- [x] PR → Preview 자동 배포
- [x] main → Production 자동 배포
- [x] `vercel-build` 스크립트 (migrate deploy)

### 더미 페이지
- [x] `app/(public)/layout.tsx` 작성
- [x] `app/(public)/page.tsx` 작성
- [x] `app/(private)/layout.tsx` 작성
- [x] `app/(private)/app/page.tsx` 작성

---

## M1 — Portfolio ✅ 핵심 마감

### Prisma 스키마
- [x] PortfolioSettings 모델
  - [x] id, ownerId
  - [x] publicSlug (unique), isPublic
  - [x] displayName, headline, bio, avatarUrl
  - [x] layoutJson
  - [x] links (PortfolioLink: label, url, order)
- [x] Project 모델
  - [x] id, ownerId, slug (unique)
  - [x] title, subtitle, description, contentMd
  - [x] techStack, repoUrl, demoUrl, thumbnailUrl
  - [x] visibility (PUBLIC/UNLISTED/PRIVATE)
  - [x] isFeatured, order
  - [x] createdAt, updatedAt
- [x] Experience 모델
  - [x] id, ownerId
  - [x] visibility (PUBLIC/UNLISTED/PRIVATE)
  - [x] company, role, startDate, endDate, isCurrent
  - [x] summary, bulletsJson, metricsJson, techTags
  - [x] isFeatured, order, createdAt, updatedAt
- [x] 관계 설정
- [x] 인덱스 설정 (slug unique, ownerId+visibility+order)
- [x] 마이그레이션 실행

### Public API
- [x] `GET /api/public/portfolio`
  - [x] PortfolioSettings 조회
  - [x] 대표 프로젝트 (visibility=PUBLIC + isFeatured=true)
  - [x] 대표 경험 (visibility=PUBLIC + isFeatured=true)
  - [x] DTO select (공개 필드만)
- [x] `GET /api/public/projects`
  - [x] visibility=PUBLIC 필터
  - [ ] 페이지네이션 (선택, M1.1)
  - [x] DTO select
- [x] `GET /api/public/projects/[slug]`
  - [x] slug로 조회
  - [x] visibility 확인
  - [x] 404 처리
  - [x] DTO select

### Private API
- [x] `GET /api/app/portfolio/settings`
  - [x] 인증 가드
  - [x] ownerId scope
- [x] `PUT /api/app/portfolio/settings`
  - [x] 인증 가드
  - [x] 입력 검증 (Zod)
- [x] `GET /api/app/projects`
  - [x] 목록 조회
  - [x] ownerId scope
- [x] `POST /api/app/projects`
  - [x] 프로젝트 생성
  - [x] slug 중복 체크
  - [x] slug 자동 생성
- [x] `GET /api/app/projects/[id]`
  - [x] 상세 조회
- [x] `PUT /api/app/projects/[id]`
  - [x] 수정
  - [x] ownerId 검증
- [x] `DELETE /api/app/projects/[id]`
  - [x] 삭제
  - [x] ownerId 검증
- [x] `GET /api/app/experiences`
- [x] `POST /api/app/experiences`
- [x] `PUT /api/app/experiences/[id]`
- [x] `DELETE /api/app/experiences/[id]`
- [x] 에러 처리 (401/403/404/409/422)

### Public 페이지
- [x] `/` 홈 페이지
  - [x] Hero 섹션 (소개, 프로필)
  - [x] 대표 프로젝트 카드 (3개)
  - [x] 연락처/소셜 섹션
  - [x] 반응형 디자인
- [x] `/projects` 목록 페이지
  - [x] 프로젝트 그리드 레이아웃
  - [ ] 필터링 UI (선택, M1.1)
  - [ ] 페이지네이션 (선택, M1.1)
- [x] `/projects/[slug]` 상세 페이지
  - [x] Problem 섹션
  - [x] Approach 섹션
  - [x] Results 섹션
  - [x] GitHub/Demo 링크
  - [x] 관련 기술 태그
- [ ] 이미지 최적화 (Next.js Image, M1.1)
- [ ] 스크롤 애니메이션 (선택, M1.1)

### SEO
- [x] 각 페이지 metadata export
- [x] title, description 작성
- [x] OG/Canonical 기본 메타데이터 적용
- [ ] OG 이미지 자산 고도화 (M1.1)
- [x] `app/sitemap.ts` 생성
- [x] `app/robots.ts` 생성
- [ ] Open Graph 테스트 (M1.1)

### Admin UI
- [x] `/app/portfolio/settings` 설정 페이지
  - [x] 프로필 편집 폼
  - [x] 소셜 링크 편집
- [x] `/app/projects` 목록
  - [x] 테이블/카드 뷰
  - [x] 정렬, 필터 (M1.1)
- [x] `/app/projects/new` 생성 폼 (M1.1)
  - [x] Markdown 입력 필드 (M1.1)
  - [ ] 이미지 업로드 (선택, M1.1)
  - [x] 태그 입력 (M1.1)
  - [x] visibility 토글 (M1.1)
- [x] `/app/projects/[id]/edit` 편집 폼 (M1.1)
- [x] `/app/experiences` CRUD UI
- [x] 대표 프로젝트 토글 (isFeatured)
- [x] 폼 검증 (Zod + React Hook Form, M1.1)

### 성능
- [x] ISR 적용 (`revalidate` 설정)
- [x] on-demand revalidate (선택, M1.1)
- [ ] 이미지 lazy loading (M1.1)
- [ ] Lighthouse 90+ (M1.1)

### Seed 확장
- [ ] 대표 프로젝트 3개 샘플 (M1.1)
- [ ] Experience 5개 샘플 (M1.1)
- [ ] PortfolioSettings 샘플 (M1.1)

### M1.1 Deferred (후속)
- [ ] OG 이미지 자산 고도화 및 Open Graph 테스트
- [ ] 이미지 최적화/지연 로딩 및 Lighthouse 90+ 달성
- [ ] Markdown 리치 에디터/이미지 업로드 고도화

---

## M2 — Resume ✅ 핵심 완료

### 스키마
- [x] Resume 모델 (status, title, targetCompany, targetRole, level, summaryMd)
- [x] ResumeItem 모델 (experienceId, sortOrder, overrideBulletsJson, overrideMetricsJson, overrideTechTags, notes)
- [x] Experience 필드 확장 (metricsJson, techTags)

### API
- [x] `/api/app/resumes` CRUD
- [x] `/api/app/resumes/[id]/items` CRUD
- [x] `/api/app/resumes/[id]/preview`

### UI
- [x] `/app/resumes` 목록
- [x] `/app/resumes/new` 생성
- [x] `/app/resumes/[id]/edit` 편집
- [x] Experience 선택 입력
- [x] Drag & Drop 정렬
- [x] Override 편집 UI
- [x] 원본 vs 수정본 비교
- [x] HTML Preview (기본 프리뷰)
- [x] PDF 다운로드 (브라우저 인쇄 기반)
- [x] 원본 Experience 변경 배지 표시
- [x] 동기화 알림 UI (선택)

### 테스트
- [x] 단위 테스트 추가 (`src/modules/resumes/tests/validation.test.ts`)
- [x] 통합 테스트 추가 (`src/modules/resumes/tests/implementation.integration.test.ts`)
- [x] 통합 테스트 실통과 (DATABASE_URL_TEST 인증정보 정상화 완료)

### 문서/배포 체크
- [x] M2 Preview 체크리스트 작성 (`results/deploy_checklist_m2.md`)
- [x] M2 Production 체크리스트 작성 (`results/deploy_checklist_m2_production.md`)
- [x] M2 완료 상태를 `plans/task.md`와 동기화

---

## 실행 우선순위 (2026-02-11 확정)

- [x] M1 핵심 + M2 핵심 완료
- [x] M3 완료
- [ ] M4 완료
- [ ] M5 완료
- [ ] M1.1 Deferred 항목 수행 (M5 완료 후)
- [ ] 세부 UI/UX 개선 작업 수행 (M5 완료 후)

---

## M3 — Notes

### 스키마
- [x] Notebook 모델
- [x] Note 모델 (title, contentMd, tags, domain)
- [x] NoteEdge 모델 (fromId, toId, status)
- [x] NoteEmbedding 모델 (선택)
- [x] Edge status enum (CANDIDATE/CONFIRMED/REJECTED)

### API
- [x] `/api/app/notes` CRUD
- [x] `/api/app/notes/[id]`
- [x] `/api/app/notes/search`
- [x] `/api/app/notes/edges`
- [x] `/api/app/notes/edges/confirm`
- [x] `/api/app/notes/edges/reject`

### Candidate Generator
- [x] 태그 기반 후보 생성
- [x] Jaccard 유사도 계산
- [x] Threshold 0.7 적용
- [x] Top-N 제한 (10~20개)
- [x] Domain 필터링
- [x] 인덱스 기반 성능 최적화

### UI
- [x] `/app/notes` Notebook/Note 목록
- [x] Note 상세 (연관 개념 리스트)
- [x] 연관 후보 UI (CANDIDATE)
- [x] Confirm/Reject 버튼
- [x] 그래프 시각화 (선택)

---

## M4 — Blog

### 스키마
- [ ] BlogPost 모델 (title, contentMd, status, lintResultJson)
- [ ] BlogExternalPost 모델 (선택)
- [ ] status enum (DRAFT/PUBLISHED/ARCHIVED)

### API
- [ ] `/api/app/blog/posts` CRUD
- [ ] `/api/app/blog/posts/[id]/lint`
- [ ] `/api/app/blog/posts/[id]/export`

### Lint 엔진
- [ ] Rule Interface 정의
- [ ] Rule 1: Long sentence (45자 이상)
- [ ] Rule 2: 반복 표현
- [ ] Rule 3: 모호 표현 밀도
- [ ] Rule 4: 근거 없는 단정
- [ ] Rule 5: 문단 과다 길이
- [ ] Rule 6: 단위/숫자 불일치
- [ ] Rule 7: 코드블록만 있고 설명 부족
- [ ] Rule 8: 금칙어 리스트
- [ ] Rule 9: 제목-본문 불일치
- [ ] Rule 10: 맞춤법 (선택)

### Export
- [ ] HTML Export
- [ ] Markdown Export
- [ ] ZIP 아카이브

### UI
- [ ] `/app/blog` 목록
- [ ] `/app/blog/new` 작성
- [ ] `/app/blog/[id]/edit` 편집
- [ ] Lint 결과 표시
- [ ] Export 다운로드

---

## M5 — Feedback

### 스키마
- [ ] FeedbackRequest 모델 (targetType, targetId, context)
- [ ] FeedbackItem 모델 (category, severity, message)
- [ ] targetType enum (PORTFOLIO/RESUME/NOTE/BLOG)

### API
- [ ] `/api/app/feedback` 목록/생성
- [ ] `/api/app/feedback/[id]` 상세
- [ ] `/api/app/feedback/[id]/run` 실행
- [ ] `/api/app/feedback/compare` 비교

### 엔진
- [ ] Resume 체크 템플릿
- [ ] Portfolio 체크 템플릿
- [ ] Note 체크 템플릿
- [ ] Blog 체크 템플릿
- [ ] 실행 로직

### UI
- [ ] `/app/feedback` 목록
- [ ] `/app/feedback/new` 실행
- [ ] `/app/feedback/[id]` 결과
- [ ] 비교 UI (diff)

---

## 🔐 보안 (공통)

- [x] `/app/*` 비인증 차단
- [x] `/api/app/*` 세션 체크
- [x] `/api/app/*` ownerId scope 강제
- [x] Public API DTO 강제
- [x] 세션 쿠키 보안
- [x] slug 길이 제한 (100자)
- [x] slug 허용 문자 검증
- [x] JSON 크기 제한 (1MB)
- [x] XSS 방어

---

## 📊 성능 (Public)

- [ ] Lighthouse Performance 90+
- [x] ISR 적용
- [ ] 이미지 최적화
- [ ] Core Web Vitals (LCP, FID, CLS)

---

## 📈 DoD (작업 완료 기준)

- [ ] 기능 동작 확인
- [x] 예외 처리 (401/403/404/409/422)
- [x] 타입 에러 0건
- [x] 린트 에러 0건
- [x] 빌드 성공
- [x] 테스트 1개 이상
- [ ] PR 리뷰 승인
- [ ] CI 통과

