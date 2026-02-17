# IA & Routing Map — Public Portfolio + Private Owner Dashboard
버전: v1.0  
목적: 공개(포트폴리오)와 비공개(오너 대시보드)를 URL/레이아웃/권한 관점에서 “완전히 분리”하여 개발/운영 안정성을 확보한다.

---

## 1) IA(정보구조) — 메뉴 구조

### 1.1 Public (누구나)
- Home `/`
- Projects `/projects`
- Project Detail `/projects/[slug]`
- (옵션) Login `/login`  ← 공개 헤더/푸터에 작게만 노출

> 정책: Public 포트폴리오 영역에는 블로그/지식노트 콘텐츠를 “본문 섹션으로 포함하지 않음”.  
> 필요 시 링크로만 분기(예: “Owner Dashboard” 또는 숨김 처리).

### 1.2 Private (오너 전용: 로그인 필수)
- Dashboard `/app`
- Projects 관리: `/app/projects`
- Experiences 관리: `/app/experiences`
- Resume 관리 `/app/resumes`
  - Resume 목록: `/app/resumes`
  - Resume 편집: `/app/resumes/[id]`
- Notes(지식노트) `/app/notes`
  - Notes 목록: `/app/notes`
  - Note 상세/편집: `/app/notes/[id]`
  - Edge(관계) 관리: Note 상세 안에서 처리(후보/확정)
- Blog `/app/blog`
  - Post 목록: `/app/blog`
  - Post 작성/편집: `/app/blog/new`, `/app/blog/[id]`
  - Lint 결과: 편집 화면 내 패널로 제공
  - Export/외부 URL 관리: 편집 화면 하단 섹션
- Audit `/app/audit`
- Domain Links `/app/domain-links`
- Feedback(후순위) `/app/feedback`
- Settings `/app/settings`

---

## 2) Routing Map (URL → 접근/데이터/SEO)

### 2.1 Public Routes
| URL | 접근 | 목적 | 데이터 | SEO/캐시 |
|---|---|---|---|---|
| `/` | Public | 대표 포트폴리오(전형적 포맷) | Featured Project/Experience | SSG/ISR, OG |
| `/projects` | Public | 프로젝트 목록 | Project list | SSG/ISR |
| `/projects/[slug]` | Public | 프로젝트 케이스 스터디 | Project detail | SSG/ISR |
| `/login` | Public | 오너 로그인 | - | noindex 권장 |

**Public SEO 필수**
- `sitemap.xml`, `robots.txt`
- OpenGraph(OG) / Twitter 카드
- canonical, metadata

### 2.2 Private Routes
| URL | 접근 | 목적 | 데이터 | 보안 |
|---|---|---|---|---|
| `/app` | Owner only | 대시보드 요약 | counts/recent | middleware 보호 |
| `/app/projects*`, `/app/experiences*` | Owner only | 포트폴리오 원본 관리 | Project/Experience CRUD | middleware + API 권한 |
| `/app/resumes/*` | Owner only | 회사/직무별 이력서 버전 | ResumeVersion CRUD | middleware + API 권한 |
| `/app/notes/*` | Owner only | 지식노트 + 그래프 | Note/Edge CRUD | middleware + API 권한 |
| `/app/domain-links` | Owner only | 교차 도메인 링크 관리 | DomainLink CRUD | middleware + API 권한 |
| `/app/blog/*` | Owner only | 블로그 작성/검수/Export | BlogPost CRUD + lint | middleware + API 권한 |
| `/app/audit` | Owner only | 감사 로그 조회 | AuditLog | middleware + API 권한 |
| `/app/feedback/*` | Owner only | (후순위) 피드백 히스토리 | FeedbackRun | middleware + API 권한 |

---

## 3) Next.js App Router 폴더 구조(권장)
Route Groups로 “공개/비공개 레이아웃”을 분리하되, URL은 유지한다.

### 3.1 예시 구조
app/
  layout.tsx                 # RootLayout (공통: html/body, global styles)
  (public)/
    layout.tsx               # PublicLayout (헤더/푸터, SEO 기본)
    page.tsx                 # /
    projects/
      page.tsx               # /projects
      [slug]/
        page.tsx             # /projects/[slug]
  (private)/
    layout.tsx               # PrivateLayout (사이드바/탑바)
    app/
      page.tsx               # /app
      projects/
        page.tsx             # /app/projects
        [id]/
          page.tsx
      experiences/
        page.tsx             # /app/experiences
        [id]/
          page.tsx
      resumes/
        page.tsx             # /app/resumes
        [id]/
          page.tsx
      notes/
        page.tsx             # /app/notes
        [id]/
          page.tsx
      blog/
        page.tsx             # /app/blog
        new/
          page.tsx
        [id]/
          page.tsx
      feedback/
        page.tsx             # /app/feedback (later)
      settings/
        page.tsx

### 3.2 Route Groups 사용 이유
- `(public)` / `(private)`는 URL에 포함되지 않으면서 “레이아웃/구조”를 논리적으로 분리할 수 있다.
- Public 포트폴리오는 가볍게(SSG/ISR) 유지하고, Private 대시보드는 인증/상태/UI가 복잡해져도 격리된다.

---

## 4) 레이아웃 전략(UX/개발 유지보수)
### 4.1 RootLayout (app/layout.tsx)
- 공통 폰트/테마/메타데이터 베이스
- 전역 스타일 + Providers(테마/쿼리/토스트 등)

### 4.2 PublicLayout (app/(public)/layout.tsx)
- 상단: 이름/간단 네비(Home, Projects)
- 하단: Contact(이메일/깃헙), copyright
- 포트폴리오에 블로그/노트 콘텐츠는 “섹션으로 넣지 않는다”
- Metadata: 기본 OG(대표 이미지), 페이지별 override

### 4.3 PrivateLayout (app/(private)/layout.tsx)
- 좌측: 사이드바(Portfolio/Resumes/Notes/Blog/Feedback/Settings)
- 상단: 빠른 검색(추후), 프로필/로그아웃
- 내부 페이지는 대부분 “리스트 → 상세/편집” 패턴으로 통일

---

## 5) 접근 제어(권한) 설계 — “두 겹”으로 막기
### 5.1 Route 보호 (Middleware)
- matcher로 `/app/:path*` 전부 보호
- 비인증이면 `/login`으로 리다이렉트

### 5.2 API 보호 (Server-side Authorization)
- Public에서 호출 가능한 API와 Private API 분리
- Private API는 반드시 세션/토큰 체크 후 401/403 반환
- 데이터 노출 실수 방지: Public API는 “노출 허용 필드만” DTO로 반환

---

## 6) 리다이렉트/에러 처리 규칙
- `/app` 진입 시: 최근 작업 화면 또는 `/app/projects`로 이동(선호)
- 세션 만료: `/login?next=/app/...` 형태로 복귀 지원
- 권한 없음: 403 페이지 또는 `/login`
- Public 404: 프로젝트 slug 미존재 시 404 + 검색/목록 링크 제공

---

## 7) 페이지별 최소 UI 구성(개발 착수 체크리스트)
### 7.1 Public
- `/`: Hero(소개/한 줄), Featured Projects(3개), Contact
- `/projects`: 카드 목록 + 태그 필터(선택)
- `/projects/[slug]`: Problem→Approach→Architecture→Results→Links 템플릿

### 7.2 Private (초기)
- `/app/projects`: 목록/검색/정렬 + 생성 버튼
- `/app/experiences`: 목록/정렬 + 생성 버튼
- `/app/resumes`: 버전 목록 + 생성(회사/직무)
- `/app/notes`: 목록 + 작성 + 연관 후보(상세에서)
- `/app/blog`: 목록 + 작성 + lint 패널(편집 화면)
- `/app/feedback`: later

---

## 8) 비고(운영 정책)
- Public 페이지는 기본 index 허용, Private은 noindex
- 로그/분석은 Public에만 최소 적용(개인 데이터 추적 최소화)
- Export/외부 URL 등록은 Private Blog에서만 수행

---


## Post-M5 신규 라우팅 (2026-02-16)

### App/API (Private)
- `GET /api/app/me`
- `GET|POST /api/app/notebooks`
- `GET|PUT|DELETE /api/app/notebooks/[id]`
- `GET /api/app/feedback/targets?type=PORTFOLIO|RESUME|NOTE|BLOG`
- `POST|GET|DELETE /api/app/resumes/[id]/share-links`
- `GET /api/app/blog/posts/[id]/exports`
- `GET /api/app/blog/posts/[id]/exports/[exportId]`
- `GET /api/app/audit`
- `GET|POST /api/app/domain-links`
- `DELETE /api/app/domain-links/[id]`
- `POST /api/app/notes/embeddings/rebuild`
- `GET /api/app/notes/[id]/similar?limit&minScore`

### Public API
- `GET /api/public/projects?q&tag&limit&cursor&publicSlug`
- `GET /api/public/resume/share/[token]`
- `GET /api/public/users`

### Public Page
- `/resume/share/[token]`
- `/u/[publicSlug]`
- `/u/[publicSlug]/projects`
- `/u/[publicSlug]/projects/[slug]`
- `/users` (P2)
