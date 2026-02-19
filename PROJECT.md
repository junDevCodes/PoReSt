# PoReSt 프로젝트 정의서 (PROJECT.md)

버전: v1.0  
최종 갱신일: 2026-02-18  
목표: “공개 포트폴리오(전용 URL)” + “개인 작업공간(/app)”을 하나의 앱에서 안전하게 운영한다.

---

## 1) 한 줄 소개 / 핵심 가치
PoReSt는 **개발자 개인 데이터를 한 곳에서 관리**하면서도, 외부 공유는 **전용 공개 URL(`/u/[publicSlug]`)**로 깔끔하게 제공하는 “개인 개발자 OS”다.

핵심 가치:
- 작성/관리: `/app/*`에서 프로젝트, 경력, 이력서, 노트, 블로그를 통합 관리
- 공유: `/u/[publicSlug]/*`로 타인에게 공개 가능한 포트폴리오를 제공
- 안전: Public/Private 경계를 라우팅 + API로 2중 강제
- 확장: 추천(Notes), 품질(Lint), 피드백(Feedback), 관측(Audit/Observability)로 확장 가능

---

## 2) 사용자/권한 모델
### 2.1 Visitor (비로그인)
- 접근 범위: Public 페이지만 접근 가능
- 데이터 접근: Public DTO로 노출 허용 필드만 조회 가능

### 2.2 Authenticated User (로그인 사용자)
- 접근 범위: `/app/*`, `/api/app/*` 접근 가능(인증 필수)
- 데이터 스코프: 모든 Private 데이터는 `ownerId = session.user.id` 스코프가 강제된다.

### 2.3 Operator (운영 권한 사용자)
- 정의: `session.user.isOwner === true`
- 권한 부여 정책(확정):
  - `OWNER_EMAIL` allowlist와 일치하면 운영 권한을 가진다.
  - 또는 DB의 `User.isOwner=true`이면 운영 권한을 가진다.
- 운영성 API 접근:
  - `/api/app/revalidate`
  - `/api/app/db-test`
  - `/api/app/test/owner`

참조 코드:
- `src/auth.ts`
- `src/lib/auth-guard.ts`

---

## 3) Public vs Private 정책(최중요)
### 3.1 Public은 “포트폴리오만”
Public은 “소개/프로젝트/요약 경험” 중심으로 노출한다.
- Public에서 Private 데이터(이력서/노트/블로그/피드백)는 기본적으로 노출하지 않는다.
- Public API는 DTO/select 제한으로 “노출 허용 필드만” 반환한다.

### 3.2 Private은 “로그인 사용자 워크스페이스”
Private은 개인 데이터 관리 공간이다.
- `/app/*`: 미들웨어 레벨에서 비로그인 차단
- `/api/app/*`: 서버에서 세션 검사 후 401/403를 일관되게 반환
- 데이터 격리: ownerId 스코프 강제(타 사용자 데이터 접근 불가)

### 3.3 운영성 API만 `isOwner` 제한
일반 CRUD는 `requireAuth`만 필요하고, 운영성 엔드포인트만 `requireOwner`가 필요하다.

참조 문서:
- `docs/09_API_Spec.md`

---

## 4) 라우팅/IA 한 장 요약
### 4.1 Public Routes (누구나 접근)
- `/` : 서비스 안내(제품 랜딩)
- `/login` : GitHub OAuth 로그인
- `/users` : 공개 사용자 디렉토리(노출 조건 참고)
- `/projects` : 공개 프로젝트 탐색(글로벌)
- `/u/[publicSlug]` : 사용자 공개 포트폴리오 홈(canonical)
- `/u/[publicSlug]/projects` : 사용자 공개 프로젝트 목록
- `/u/[publicSlug]/projects/[slug]` : 사용자 공개 프로젝트 상세(canonical)

레거시 호환:
- `/projects/[slug]` : canonical로 리다이렉트(구현: `src/app/(public)/projects/[slug]/page.tsx`)

### 4.2 Private Routes (로그인 사용자 접근)
- `/app` : 내 워크스페이스 홈
- `/app/portfolio/settings` : 공개 설정/프로필/링크 편집
- `/app/projects`, `/app/experiences`, `/app/resumes`, `/app/notes`, `/app/blog`, `/app/feedback` 등

참조 문서:
- `docs/03_IA_Routing_Map.md`
- `docs/04_User_Flow_Use_Cases.md`

---

## 5) 인증(Auth.js) 실제 동작(코드 기준)
### 5.1 인증 수단
- GitHub OAuth 단일 provider
- 세션: JWT strategy
- 로그인 페이지: `/login`

참조 코드:
- `src/auth.ts`

### 5.2 `isOwner` 계산 규칙(확정)
다음 중 하나면 `isOwner=true`:
- `User.isOwner === true`
- `OWNER_EMAIL`과 사용자 이메일이 일치(소문자 비교)

### 5.3 로그인 시 DB 정합성 보장
로그인 이벤트(`events.signIn`)에서 아래를 보장한다.
1. `User` upsert(이메일 기반)
2. 해당 사용자의 `PortfolioSettings`가 없다면 자동 생성

관련 코드:
- `src/auth.ts`의 `ensureUserRecord`, `ensurePortfolioSettingsForUser`

### 5.4 `publicSlug` 자동 생성 규칙(현재 구현)
우선순위:
1. 이메일 local part (`foo@bar.com`의 `foo`)
2. `name`
3. `ownerId`
4. 기본값 `user`

정규화:
- 영문 소문자/숫자/하이픈만 유지
- 공백은 하이픈으로 변환
- 최대 100자

충돌 해결:
- `publicSlug`, `publicSlug-2`, `publicSlug-3` … 형태로 최대 100회 재시도

### 5.5 `publicSlug` 변경 정책(확정)
- 변경은 허용하되, **경고 후 즉시 변경**한다.
- 기존 URL은 끊기는 것으로 간주한다(리다이렉트/매핑 테이블 없음).

관련 UI:
- `src/app/(private)/app/portfolio/settings/page.tsx`

---

## 6) 데이터 모델(Prisma 스키마 기반)
스키마 위치:
- `prisma/schema.prisma`

핵심 엔티티(요약):
- Auth: `User`, `Account`, `Session`, `VerificationToken`
- Portfolio: `PortfolioSettings`, `PortfolioLink`, `Project`, `ProjectLink`, `Experience` 등
- Private: `ExperienceStory`(STAR ???), `CompanyTarget`(?? ?? ??)
- Resume: `Resume`, `ResumeItem`, `ResumeShareLink`
- Notes: `Notebook`, `Note`, `NoteEdge`, `NoteEmbedding`
- Blog: `BlogPost`, `BlogExportArtifact`, `BlogIntegration` 등
- Feedback: `FeedbackRequest`, `FeedbackItem`
- Ops: `AuditLog`, `DomainLink`

Public 노출 원칙:
- Public API는 select 제한 + Public DTO로만 반환한다.
- Private 원본 데이터는 Public에서 직접 조회하지 않는다.

참조 문서:
- `docs/07_Data_Model_ERD.md`
- `docs/09_API_Spec.md`

---

## 7) 핵심 유저 플로우(UX 관점)
### 7.1 (P0) 공개 포트폴리오 발행 플로우(최우선)
1. 로그인(`/login`)
2. 설정(`/app/portfolio/settings`)
   - `isPublic` on/off
   - `publicSlug`, 프로필(표시명/헤드라인/소개/아바타/링크) 설정
3. 프로젝트 작성(`/app/projects/new`) 후 `visibility=PUBLIC`로 전환
4. 공개 URL 확인: `/u/[publicSlug]`
5. 공유: URL 복사/공유

핵심 성공 기준:
- 신규 사용자가 5분 내에 `/u/[publicSlug]` 공유 링크를 얻는다.

### 7.2 작업공간 CRUD 파이프라인(요약)
- Projects: 생성/수정/삭제 → Public 반영(visibility=PUBLIC + owner의 isPublic=true)
- Resumes: 버전 생성/편집/프리뷰 → (옵션) 공유 토큰 링크
- Notes: 노트 작성 → 후보 생성 → Confirm/Reject → 그래프 탐색
- Blog: 글 작성 → Lint → Export 생성/이력 → 외부 URL 상태 관리

---

## 8) 에러/응답 계약
### 8.1 표준 상태 코드
- 400: 파라미터 형식 오류
- 401: 비인증
- 403: 권한 없음(운영성 API 또는 ownerId mismatch)
- 404: 리소스 없음
- 409: 유니크 충돌(slug 등)
- 422: 유효성 검증 실패
- 500: 서버 오류

### 8.2 `x-request-id`
- 미들웨어에서 `x-request-id`를 생성/전파한다.
- Private API는 디버깅을 위해 `x-request-id`를 반환한다.

참조 코드:
- `middleware.ts`
- `src/lib/observability.ts`
- `docs/09_API_Spec.md`

---

## 9) 환경변수/배포/테스트 게이트
### 9.1 필수 env (핵심)
- `DATABASE_URL` (pooled 권장)
- `DATABASE_URL_UNPOOLED` (direct, migrate용)
- `AUTH_SECRET`
- `AUTH_TRUST_HOST` (배포 환경 요구 시)
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `OWNER_EMAIL` (운영 권한 allowlist)

운영성 API:
- `REVALIDATE_TOKEN` (운영성 revalidate 토큰)

참조 문서:
- `docs/DEPLOYMENT_GUIDE.md`

### 9.2 게이트(완료 기준)
- `npm run lint`
- `npm run build`
- `npx jest --runInBand`
- `npm run vercel-build`

---

## 10) 운영 규칙(간단)
### 10.1 `OWNER_EMAIL`
- 운영 권한은 `OWNER_EMAIL` allowlist로만 관리한다.
- 운영성 API는 오너 권한이 아니면 403을 유지해야 한다.

### 10.2 `/users` 디렉토리 노출 조건(확정)
- `PortfolioSettings.isPublic=true`
- 공개 프로젝트(visibility=PUBLIC) 1개 이상

### 10.3 `publicSlug` 변경 경고(확정)
- 변경 즉시 적용, 리다이렉트 없음
- UI에서 “기존 공유 링크가 깨질 수 있음”을 명시한다.

---

## 11) Known Issues / Tech Debt (문서화만)
### 11.1 문자열/인코딩 깨짐 리스크
일부 파일에서 한글/문구가 깨져 보일 수 있다(현상 발견 시 우선 목록화 후 일괄 복구).
- `src/auth.ts` (에러 메시지/로그)
- `src/lib/auth-guard.ts` (401/403 기본 메시지)
- `middleware.ts` (인증 필요 메시지)
- `src/app/(public)/page.tsx` (메타데이터/버튼 라벨 등)
- `src/app/(private)/app/portfolio/settings/page.tsx` (라벨/메시지)

### 11.2 Windows 환경에서 Prisma EPERM 가능성
Windows에서 `prisma schema-engine` 실행 시 `spawn EPERM`이 발생할 수 있다.
- 증상: `npm run build`, `npm run vercel-build`에서 간헐적으로 EPERM
- 우회: 권한 상승으로 재실행 시 통과하는 케이스가 있다.

### 11.3 Public 홈(`/`) 포트폴리오 선택 규칙
`/`는 “특정 사용자”가 아니라 최신 업데이트된 공개 포트폴리오 설정을 사용한다.
- 구현: `src/modules/projects/implementation.ts`의 `getPublicPortfolio()`는 `portfolioSettings.findFirst(where isPublic=true orderBy updatedAt desc)`를 사용한다.
- 멀티 유저에서 `/`을 “서비스 안내 페이지”로 고정하려면 UX Wave에서 구조를 재정의한다(아래 참고).

---

## 12) Next UX Wave (계획만, 별도 PR로 구현)
### 12.1 UX Wave 1: 공개 포트폴리오 발행 완성
목표: 신규 사용자가 5분 내에 “공유 가능한 `/u/[publicSlug]`”를 얻는다.

범위:
1. `/` 랜딩 강화
   - 서비스 소개 + 로그인 CTA
   - `/users`, `/projects` 탐색 CTA
2. `/app` 첫 진입 시 “발행 체크리스트” 위젯
   - 프로필 설정(`/app/portfolio/settings`)
   - 첫 프로젝트 생성(`/app/projects/new`)
   - 프로젝트 공개 전환(visibility=PUBLIC)
   - `/u/[publicSlug]` 이동/복사 버튼
3. 빈 상태/에러 상태 통일(Projects/Resumes/Notes/Blog)

수용 기준:
- 신규 사용자가 5분 내에 `/u/[publicSlug]` 공유 링크를 얻는다.
- `publicSlug` 변경 시 경고 문구가 명확히 표시된다(리다이렉트 없음 명시).
- `/users` 디렉토리에는 공개 프로젝트가 1개 이상인 사용자만 노출된다.

