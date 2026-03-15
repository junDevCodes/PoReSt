# Development Plan & Sprint Backlog — PoReSt
버전: v1.0
목표: “공개 포트폴리오”는 빠르고 안정적으로 배포하고, “로그인 사용자 워크스페이스(/app)”는 인증 기반으로 안전하게 운영한다.
우선순위: Portfolio > Notes > Blog > Feedback

---

## 0) 개발 운영 원칙(고정)
### 0.1 개발 환경 분리
- Local: 개발/테스트
- Preview: PR마다 자동 배포(미리보기 URL)
- Production: main 브랜치 머지 시 배포

### 0.2 Public/Private 경계
- Public: `/`, `/projects`, `/u/[publicSlug]`, `/u/[publicSlug]/projects`, `/u/[publicSlug]/projects/[slug]` + `/api/public/*`
- Private: `/app/*` + `/api/app/*` (로그인 인증 필수, 운영성 API는 오너 권한 필수)
- “두 겹 방어”: Route(미들웨어) + API(서버 권한 체크)

### 0.3 문서/코드 동기화 규칙
- PR은 “기획 문서(이 파일 포함) 변경 + 구현 변경”을 같이 묶는다.
- 스키마 변경 시: Prisma migration 파일이 PR에 포함되어야 한다.

---

## 1) 브랜치/PR 규칙 (GitHub Flow)
### 1.1 브랜치
- `main`: 항상 배포 가능한 상태
- `feat/<area>-<short>` 예: `feat/portfolio-admin`
- `fix/<area>-<short>` 예: `fix/auth-redirect`

### 1.2 PR 필수 체크리스트(최소)
- [ ] 변경 범위가 문서(PRD/기능명세/스키마)와 일치
- [ ] `/app/*` 인증 우회 불가(라우트+API 모두 확인)
- [ ] Public API가 “공개 필드만” 반환(select 제한)
- [ ] DB migration 포함(스키마 변경이 있으면)
- [ ] smoke 테스트(로컬/프리뷰에서 핵심 플로우 1회)

### 1.3 머지 전략
- 기본: Squash merge (히스토리 단순화)
- 머지 후: main 자동 배포

---

## 2) Definition of Ready / Definition of Done
### 2.1 DoR (작업 시작 조건)
- 요구사항(AC)이 3줄 이내로 명확
- UI가 필요한 경우: 화면 구성/필드/상태가 기능명세에 존재
- 데이터가 필요한 경우: 스키마/엔드포인트가 정의됨
- “공개/비공개” 노출 규칙이 명시됨

### 2.2 DoD (완료 조건)
- 기능 동작 + 예외 흐름(401/403/404/409/422) 확인
- 타입/린트/빌드 통과
- Public 페이지 SEO/OG 깨짐 없음(해당 범위일 때)
- 최소 테스트(유닛 또는 e2e 스모크) 1개 이상 추가/갱신
- 관련 문서(기능명세/요구사항/스키마/API) 갱신

---

## 3) 마일스톤(릴리즈 단위)
> 각 마일스톤은 “배포 가능한 상태”를 목표로 한다.

### M0 — Foundation (프로젝트 뼈대 고정)
**산출물**
- Next.js(App Router) 기본 구조 + (public)/(private) 라우팅 그룹
- Auth(로그인 사용자) + `/app/*` 보호 + `/api/app/*` 보호
- Prisma + Postgres 연결, 마이그레이션/시드 체계
- Preview/Production 배포 파이프라인 연결

**완료 기준**
- Public 홈 더미 페이지 접근 OK
- `/app`는 비로그인 차단(리다이렉트/401)
- DB 마이그레이션 1회 적용이 Preview/Prod에서 재현 가능

---

### M1 — Portfolio Public + Admin (최우선)
**범위**
- Public: `/`, `/projects`, `/u/[publicSlug]/projects/[slug]` (legacy: `/projects/[slug]`)
- Private: `/app/projects*`, `/app/experiences*`, `/app/portfolio/settings`

**핵심 작업**
- PortfolioSettings CRUD(홈 구성/링크)
- Project CRUD + slug 유니크 + Public 노출 정책(visibility=PUBLIC)
- Experience CRUD(원본 데이터)
- Public 페이지 템플릿(Problem/Approach/Architecture/Results/Links)
- (옵션) on-demand revalidate(관리 저장 즉시 Public 반영)

**완료 기준**
- 대표 프로젝트가 홈에 노출되고, 상세 페이지가 템플릿대로 렌더
- Public 데이터가 Private 데이터(이력서/노트/블로그)를 절대 읽지 않음

---

### M2 — Resume (회사/직무별 버전 관리)
**선택지(둘 중 하나로 고정)**
- A) 빠른 MVP: `Resume.contentJson` 단일(빌더 UI 자유도↑)
- B) 재사용 중심: `ResumeItem + Experience` 조합(override + 정렬)

**권장**
- B로 가면 “포트폴리오/이력서 일원화” 철학이 더 선명해진다.

**완료 기준**
- ResumeVersion 생성 → Experience 선택/정렬 → 프리뷰(HTML)까지 완주 가능
- 원본 Experience 변경이 자동으로 Resume에 섞이지 않음(혼선 방지)

---

### M3 — Notes + Graph (지식노트)
**범위**
- Notebook(분야) + Note CRUD
- 후보(candidates) 생성 + Confirm(confirmed edge) + Undo
- Note 상세에서 연관 리스트 + 간단 그래프

**후보 생성 전략(단계적)**
- v1: 태그/키워드 기반 후보
- v1.5: pgvector 임베딩 후보(선택)

**완료 기준**
- 노트 작성 후 후보가 생성되고, confirmed만 탐색에 반영됨
- 노트 100개 정도에도 느려지지 않는 기본 인덱스/쿼리

---

### M4 — Blog (작성 + Lint + Export)
**범위**
- BlogPost CRUD + status(draft/published/archived)
- Lint 규칙 10개 이상 + 결과 저장 + Ignore 사유(옵션)
- Export(HTML/MD zip) + 외부 URL/상태 관리

**완료 기준**
- 글 작성 → Lint → 수정 → Export → externalUrl 등록까지 완주 가능
- 외부 자동 게시(Connector)는 “인터페이스만” 유지(리스크 분리)

---

### M5 — Feedback (후순위)
**범위**
- FeedbackRequest 생성 + 결과(FeedbackItem) 저장 + 비교
- Resume/Portfolio는 컨텍스트(company/role)에 따라 체크 항목이 달라짐
- Note/Blog는 출처/단정/상충 포인트를 중심으로 결과화

**완료 기준**
- Run 1회 이상 저장되고, 이전 Run과 diff 뷰가 가능

---

## 4) 스프린트 백로그(에픽 → 스토리 → 태스크)
> 아래는 “바로 이슈로 옮길 수 있는” 단위로 쪼갠 초안.

### Epic A — Foundation
- A1. Repo 세팅(typescript, lint, format, env)
- A2. Auth GitHub 로그인 + 운영성 API `isOwner` 권한 모델 + 로그인/로그아웃
- A3. Middleware로 `/app/*` 보호 + API 공통 auth guard
- A4. Prisma 연결 + migrate workflow(dev/preview/prod) + seed
- A5. Vercel Preview/Prod 배포 + 환경변수 세팅

### Epic B — Portfolio
- B1. PortfolioSettings CRUD + links 관리
- B2. Project CRUD + slug 유니크 + visibility 정책
- B3. Experience CRUD(원본) + order 정렬
- B4. Public Home 렌더(대표 프로젝트)
- B5. Public Projects list + detail 템플릿
- B6. SEO: metadata/OG/sitemap/robots

### Epic C — Resumes
- C1. ResumeVersion CRUD
- C2. Experience selector + sort UI
- C3. Override 편집(버전 전용)
- C4. HTML Preview 템플릿
- C5. (옵션) Export(PDF/HTML)

### Epic D — Notes
- D1. Notebook CRUD
- D2. Note CRUD + 검색(q)/필터(tag/domain)
- D3. Candidate generator v1(태그/키워드)
- D4. Confirm/Undo edge + related list
- D5. (옵션) Embedding 저장 + pgvector 후보 생성

### Epic E — Blog
- E1. BlogPost CRUD + status
- E2. Lint engine core + 룰 10개
- E3. Lint 결과 저장 + Ignore 사유
- E4. Export 생성(HTML/MD) + 아티팩트 저장
- E5. externalUrl/status 관리

### Epic F — Feedback (Later)
- F1. FeedbackRequest/Item 저장
- F2. 포트폴리오/이력서 체크 템플릿
- F3. 노트/블로그 사실성/출처 체크 템플릿
- F4. Run 비교(diff)

---

## 5) CI/CD & DB 마이그레이션 운영
### 5.1 Preview 배포(브랜치/PR)
- PR마다 Preview Deployment 생성
- PR에서 Public/Private 핵심 플로우 스모크 테스트

### 5.2 Production 배포(main)
- main 머지 → Production 배포
- DB 변경 포함 시, 배포 파이프라인에서 `prisma migrate deploy` 수행(Production에서 `migrate dev` 금지)

---

## 6) 테스트 전략(최소)
- Unit: Lint 룰, edge status 전이(candidate→confirmed), DTO select
- Integration: API 핸들러 + DB (테스트 DB)
- E2E Smoke(최소 3개)
  1) Public: `/` → `/projects` → `/u/[publicSlug]/projects/[slug]` (legacy 리다이렉트 포함)
  2) Private: login → create project → public 반영 확인
  3) Notes: create note → confirm edge → related list

---

## 7) 리스크 레지스터(초기)
- R1. Public/Private 데이터 누출
  - 대응: DTO select 강제 + API 스코프 강제 + noindex + 보안 테스트
- R2. 외부 블로그 자동 게시 정책/제약
  - 대응: v1은 Export + URL 상태관리, Connector는 확장 포인트만
- R3. 서버리스 DB 커넥션 폭증
  - 대응: pooled connection 사용 + 쿼리/인덱스 최적화
- R4. 노트 추천 품질(오탐/과연결)
  - 대응: 자동=후보만, 확정은 사용자 수동 액션 + Reject(옵션)

---


## Post-M5 스프린트 백로그 추가 (2026-02-16)

### Epic G1~G5 (P0)
- E-G1: Workspace API 표준화
- E-G2: Notebook CRUD + 작성 UX 완성
- E-G3: Public Projects 검색/필터/페이지네이션
- E-G4: Feedback 대상 자동 선택
- E-G5: Blog Lint Rule10

### Epic G6~G9 (P1)
- Resume 공유 링크
- Export 이력화
- Audit Log
- 관측성 표준화

### Epic G10~G12 (P2)
- Cross-domain 링크
- pgvector 임베딩 파이프라인
- 공개 사용자 디렉토리

### 운영 규칙
- 각 Epic은 기능 구현 + 문서 동기화를 하나의 완료 단위로 본다.
- 완료 결과는 `plans/history.md`에 누적한다.
