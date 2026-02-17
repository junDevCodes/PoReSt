# Technical Design & Architecture — PoReSt
버전: v1.0
목표: Public(포트폴리오) + Private(오너 대시보드: 포트폴리오 관리/이력서/노트/블로그/피드백) 단일 플랫폼을 “운영 가능한” 구조로 설계한다.
우선순위: Portfolio > Notes > Blog > Feedback

---

## 0) 한 줄 아키텍처
**Next.js(App Router) 단일 앱**에서
- Public 포트폴리오는 **ISR/캐시**로 빠르게 제공하고,
- Private 기능은 **인증 기반 Route + API 보호**로 오너만 접근,
- 데이터는 **Postgres + Prisma**로 통합 관리,
- Notes는 **pgvector(선택)** 로 유사도 후보 생성,
- Blog는 **Lint 엔진 + Export** 로 외부 게시를 “연동 리스크 없이” 관리한다.

---

## 1) 핵심 설계 원칙
1) **Public/Private 경계가 코드/라우팅/데이터 레벨에서 동시에 보장**되어야 한다.
2) 개인용 MVP는 **서버리스 배포 시 커넥션 풀링/캐시 전략**을 먼저 확정한다.
3) 자동화(추천/피드백)는 “자동 확정 금지”:  
   - 후보(candidate)만 자동  
   - 확정(confirmed)은 오너 액션으로만
4) 외부 블로그 연동은 1차에서 “자동 게시”가 아니라 **Export + URL 상태 관리**가 기본.

---

## 2) 기술 스택 제안 (v1 고정안)
### 2.1 Frontend / BFF
- Next.js (App Router)
- UI: Tailwind + shadcn/ui(선택)
- Data Fetch: Server Components + Route Handlers(BFF) + (옵션) React Query/SWR

### 2.2 Auth
- Auth.js(NextAuth) + Prisma Adapter
- 정책: 오너 1인(allowlist email 또는 `User.isOwner=true`)

### 2.3 Database
- PostgreSQL + Prisma ORM
- 추천 선택지(서버리스 배포 기준)
  - (A) **Prisma Postgres**: built-in connection pooling (운영 단순)  
  - (B) **Neon**: pooled connection string 제공 (서버리스 안정)  
  - (C) Supabase: pgvector/AI 도구 풍부 (단, 정책/요금/운영 방식 선택 필요)

### 2.4 Search / Similarity
- v1 검색: Postgres FTS(Notes/Blog)
- v1 노트 유사도: pgvector(선택) + NoteEmbedding/NoteEdge

### 2.5 Storage
- 이미지/Export 산출물: Object Storage(S3/R2/Supabase Storage 중 택1)
- v1은 “필요할 때만” 도입: 초기엔 URL 기반(썸네일 등)으로 시작 가능

### 2.6 Deploy
- Vercel(Next.js 최적)
- Public은 ISR로 캐시
- API/Private는 Node runtime(Prisma 안정성 우선)

---

## 3) 전체 구성도(논리)
[Browser]
  ├─ Public: /, /projects, /projects/[slug]
  └─ Owner: /app/* (Auth required)
        │
        ▼
[Next.js App Router]
  ├─ Server Components (Public pages)
  ├─ Route Handlers (/api/public/*, /api/app/*)
  ├─ Auth.js (session)
  ├─ Lint Engine (blog)
  ├─ (Later) Feedback Worker
  │
  ▼
[Postgres]
  ├─ Portfolio: Projects, Experiences, Skills...
  ├─ Resumes: Resume, (옵션) ResumeItem
  ├─ Notes: Note, NoteEdge, NoteEmbedding(pgvector)
  └─ Blog: BlogPost, (옵션) BlogExternalPost, BlogIntegration

---

## 4) 라우팅/권한 설계
### 4.1 Public Routes
- `/` : 대표 포트폴리오
- `/projects` : 공개 프로젝트 목록
- `/projects/[slug]` : 공개 프로젝트 상세

### 4.2 Private Routes (오너 전용)
- `/app` : 대시보드
- `/app/portfolio/*` : 프로젝트/경험/스킬 관리
- `/app/resumes/*` : 이력서 버전 관리
- `/app/notes/*` : 노트/그래프
- `/app/blog/*` : 글/검수/Export/외부 상태
- `/app/feedback/*` : (후순위) 피드백 실행/비교

### 4.3 보호 계층(2중)
1) **Routing Layer**: middleware로 `/app/*` 차단
2) **API Layer**: `/api/app/*`에서 세션/오너 체크 후 ownerId scope 강제

---

## 5) Public 성능(캐시/ISR)
### 5.1 Public 렌더 전략
- Home/Projects/ProjectDetail: ISR 적용
- 재검증(정책)
  - 기본: time-based revalidate(예: 5~30분)
  - 옵션: on-demand revalidate (관리 화면 Save 시 즉시 갱신)

### 5.2 데이터 로딩
- Public 페이지는 “공개 DTO”만 사용
- 프로젝트 목록/상세는 visibility=PUBLIC 조건을 DB에서 강제

---

## 6) Private 데이터 흐름 (주요 유스케이스별)

## 6.1 Portfolio Admin (Project/Experience)
- 입력: Markdown(contentMd), 배열(tags/techStack), JSON(links/highlights)
- 저장: Prisma
- Public 반영: visibility=PUBLIC 조건 + ISR revalidate

## 6.2 Resume
v1 선택지 2개 중 하나로 고정(초기에 흔들리지 않게)
- **옵션 A(빠른 MVP)**: `Resume.contentJson` 단일 저장  
  - 장점: 구현 단순, UI 자유도 높음  
  - 단점: Experience 재사용/동기화가 약함
- **옵션 B(재사용 중심)**: ResumeItem 테이블 + override  
  - 장점: Experience 원본 재사용/정렬/override/Sync가 깔끔  
  - 단점: 테이블/엔드포인트 증가

권장: v1부터 옵션 B로 가면 “포트폴리오/이력서 일원화” 철학이 더 잘 맞는다.

## 6.3 Notes + Graph
- Note 저장 시:
  - tags/domain 기반으로 candidate edge 생성(1차)
  - (선택) 임베딩 생성 후 유사도 Top-N으로 candidate edge 갱신(2차)
- UI에서 Confirm:
  - status = CONFIRMED로 승격
- 그래프 탐색/표시는 CONFIRMED만 사용

임베딩/후보 생성은 “동기 처리(간단)” 또는 “비동기 처리(확장)” 중 택
- v1은 동기 처리로 시작 가능(노트량이 적을 때)
- 노트가 늘면: queue/cron으로 비동기 전환

## 6.4 Blog: Lint + Export + 외부 상태
- 저장(draft) → Lint 실행(자동/수동) → 결과 저장
- Export 생성(HTML/MD zip) → 외부 게시 후 URL 등록
- 자동 게시(Connector)는 v1에선 인터페이스만 설계하고 실제는 보류

---

## 7) 데이터/쿼리 설계 핵심 포인트
### 7.1 커넥션 풀링(서버리스 필수)
- Vercel 같은 환경에서 함수 인스턴스가 늘면 DB 커넥션 폭증 가능
- 해결 전략:
  - Prisma Postgres(내장 pooling) 또는 Neon pooled connection 사용
  - Prisma pool 설정/timeout 튜닝(필요 시)

### 7.2 인덱스
- Project.slug unique
- NoteEdge(fromId,toId,relationType) unique
- 리스트 화면: (ownerId, updatedAt desc) 인덱스
- 검색: FTS(GIN) 도입 시 Note/Blog에 search vector 추가

### 7.3 pgvector 인덱스(선택)
- 데이터가 쌓인 뒤 HNSW 또는 IVFFlat 인덱스 적용
- distance function(코사인/내적/L2)에 맞춰 인덱스를 별도로 둔다.

---

## 8) Lint 엔진 설계(블로그)
### 8.1 구조
- Rule Interface:
  - id, severity, detect(content) -> findings[]
- Engine:
  - content 파싱(문단/문장) → rule pipeline → findings merge → 저장

### 8.2 v1 룰 예시(정책/기준치)
- Long sentence(예: 45자/60자 기준 2단계)
- 반복 표현 과다(단어/문장 n-gram)
- 모호 표현 밀도(“같다/느낌/아마/대충” 등)
- 근거 없는 단정(링크/인용 없는 강한 주장)
- 문단 과다 길이(가독성)
- 단위/숫자 표기 불일치
- 코드블록만 있고 설명 부족
- 금칙어 리스트(광고성/과장성)
- 제목-본문 불일치(키워드/주제 드리프트 휴리스틱)
- 맞춤법/띄어쓰기(라이브러리 연동은 v1.5)

---

## 9) 보안 설계 체크리스트(운영 기준)
- Public API: 공개 필드만 select (DTO 강제)
- Private API: ownerId scope 강제 + 401/403 일관
- 세션 쿠키: HttpOnly/Secure/SameSite 권장값 적용
- 입력 검증: slug/URL 길이/허용 문자/JSON 크기 제한
- 민감정보:
  - BlogIntegration.credentialsJson은 “암호화 저장” 전제로만 활성화
  - v1에선 실제 토큰 저장 기능은 비활성(필드만 확보)

---

## 10) 관측가능성/운영
- 로그: API 에러(5xx), 인증 실패(401/403), Export/Lint 실패
- 메트릭(선택): Public pageview, contact click
- 감사로그(옵션): create/update/delete 이벤트 기록(민감정보 제외)

---

## 11) 테스트 전략(v1 최소)
- Unit: Lint rules, NoteEdge 정책(candidate→confirmed), DTO select
- Integration: Route Handler + Prisma(테스트 DB)
- E2E(선택): Public 탐색 + Private 로그인 + CRUD smoke

---

## 12) 배포/환경변수(예시)
- DATABASE_URL (pooled 권장)
- AUTH_SECRET
- AUTH_TRUST_HOST=true (배포 환경 요구 시)
- NEXT_PUBLIC_SITE_URL
- STORAGE_* (S3/R2/Supabase 중 선택)
- (선택) VECTOR_DIMS, EMBEDDING_MODEL_ID

---

## 13) 결정 로그(초기 고정)
- Public 캐시: ISR(time-based) + (옵션) on-demand revalidate
- API 구조: /api/public vs /api/app 분리
- DB: Postgres + Prisma, 서버리스 커넥션 풀링 옵션 반드시 사용
- Notes: 자동은 후보만, 확정은 사용자만
- Blog 연동: v1은 Export + URL 상태 관리가 기본

---

## 14) v1 → v2 확장 로드맵(아키텍처 관점)
- 피드백 엔진 도입(FeedbackRun + diff)
- 노트 후보 생성 비동기화(queue/cron)
- 태그 정규화(Tag table) + 고급 검색(랭킹/동의어)
- 그래프 시각화 강화(클러스터/학습 경로 추천)
- 외부 블로그 Connector 실제 구현(플랫폼별 권한/정책 준수)

---

## References (copy)
- Next.js Authentication Guide: https://nextjs.org/docs/app/guides/authentication
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Vercel ISR Docs: https://vercel.com/docs/incremental-static-regeneration
- Auth.js Prisma Adapter: https://authjs.dev/reference/prisma-adapter
- Prisma Postgres Connection Pooling: https://www.prisma.io/docs/postgres/database/connection-pooling
- Neon + Prisma Guide: https://neon.com/docs/guides/prisma
- Supabase pgvector Docs: https://supabase.com/docs/guides/database/extensions/pgvector
- pgvector Indexing (HNSW/IVFFlat): https://github.com/pgvector/pgvector


## Post-M5 아키텍처 확장 포인트 (2026-02-16)

### Application Layer
- `me` 조회 API를 통해 세션 사용자 워크스페이스 상태를 표준화한다.
- Notes는 Notebook 단위 집계(`noteCount`)를 서비스 계층에서 계산한다.
- Public Projects는 커서 기반 조회를 통해 목록 API 비용을 제어한다.
- Feedback 생성은 대상 선택 API를 통해 입력 오류를 줄인다.

### Quality Engine
- Blog Lint Rule10(`HEADING_LEVEL_JUMP`) 추가로 문서 구조 품질 점검을 강화한다.

### Observability (P1)
- Request ID 전파 (`x-request-id`, middleware 생성/전달)
- 구조화 로그(JSON, `request.received`/`auth.authorized`/`auth.unauthorized`)
- Sentry 에러 추적(Envelope API, `SENTRY_DSN` 기반)
- Sentry 실패 시 운영 알림 Webhook 폴백(`OPS_ALERT_WEBHOOK_URL`)

### Data/Linking (P2)
- Cross-domain 링크 그래프(`DomainLink`)
- 임베딩 생성/재빌드 파이프라인(`pgvector`, `POST /api/app/notes/embeddings/rebuild`)
