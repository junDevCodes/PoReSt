# Requirements Spec — PoReSt (Public Portfolio + Private Owner Dashboard)
버전: v1.0  
상태: Draft (개발 착수용)  
우선순위: Portfolio > Notes > Blog > Feedback  
권한 정책: Public(포트폴리오만) / Private(오너만)

---

## 0) 문서 목적
- 기능 요구사항(FR)과 비기능 요구사항(NFR)을 “개발 가능한 수준”으로 고정한다.
- 공개 영역과 비공개 영역의 경계를 명확히 정의하여 데이터 노출/권한 실수를 방지한다.
- MVP 범위를 우선순위대로 단계화하여, 개인용 안정화 후 배포까지 이어지게 한다.

---

## 1) 시스템 범위(Scope)
### 1.1 In Scope (MVP)
- Public Portfolio: 홈/프로젝트 목록/프로젝트 상세(전형적인 포트폴리오 형태)
- Owner Dashboard: 프로젝트/경험/이력서/지식노트/블로그 관리
- Notes Graph: 연관 후보 자동 추천 + 사용자 확정(confirmed edge) 기반 연결
- Blog: 작성/검수(표현 룰) + Export + 외부 URL/상태 관리
- (Later) Feedback: 문서별 피드백 실행/저장/비교

### 1.2 Out of Scope (MVP 제외)
- 다중 사용자 SaaS(권한/결제/팀 협업)
- 외부 블로그 플랫폼 “완전 자동 게시/수정” 전면 지원
- 지식 그래프 고급 분석(클러스터/중심성/학습 경로)

---

## 2) 사용자/권한 요구사항
### 2.1 Actor
- Visitor: Public만 접근 가능
- Owner: /app 전 영역 접근 가능(인증 필수)

### 2.2 접근 제어 규칙
- Public URL: `/`, `/projects`, `/projects/[slug]`
- Private URL: `/app/*` 전부 인증 필수
- 보안 원칙: 라우트 보호 + API 보호(2중 방어)
  - 라우트: middleware에서 차단
  - API: 서버에서 세션/권한 체크 후 401/403 반환

---

## 3) 기능 요구사항 (Functional Requirements, FR)

> 표기: [P0]=반드시 / [P1]=있으면 좋음 / [P2]=후순위

### 3.1 Public Portfolio (P0)
- FR-PUB-01: `/` 홈에서 대표(Featured) 프로젝트가 노출되어야 한다.
- FR-PUB-02: `/projects`에서 프로젝트 목록을 제공해야 한다.
- FR-PUB-03: `/projects/[slug]`에서 프로젝트 상세(케이스 스터디)를 제공해야 한다.
- FR-PUB-04: 프로젝트 상세는 최소 템플릿을 만족해야 한다.
  - Problem / Approach / Architecture / Results / Links
- FR-PUB-05: SEO 메타데이터(OG, canonical, sitemap, robots)를 제공해야 한다.
- FR-PUB-06: Public은 기본 index 허용, Private은 noindex 처리해야 한다.

### 3.2 Auth / Owner Dashboard (P0)
- FR-AUTH-01: 비로그인 상태에서 `/app/*` 접근 시 `/login`으로 리다이렉트해야 한다.
- FR-AUTH-02: 로그인 성공 후 `next` 파라미터가 있으면 해당 경로로 복귀해야 한다.
- FR-AUTH-03: 오너 only 정책을 지원해야 한다(화이트리스트 이메일 또는 단일 관리자 계정).
- FR-AUTH-04: 세션 만료 시 보호 구간 접근 시 자동 재로그인 플로우가 동작해야 한다.

### 3.3 Portfolio Admin — Project/Experience (P0)
- FR-PORT-01: Project CRUD(생성/조회/수정/삭제)를 제공해야 한다.
- FR-PORT-02: Experience CRUD를 제공해야 한다.
- FR-PORT-03: Project는 slug(고유)로 Public 상세를 제공할 수 있어야 한다.
- FR-PORT-04: Featured 설정(대표 지정)을 제공해야 한다.
- FR-PORT-05: Public 노출 필드는 “노출 허용 필드만” 반환해야 한다(DTO/Select 제한).

### 3.4 ResumeVersion (P0~P1)
- FR-RES-01: 회사/직무별 ResumeVersion을 생성할 수 있어야 한다.
- FR-RES-02: Experience를 선택/정렬할 수 있어야 한다.
- FR-RES-03: ResumeVersion에서 문장/요약을 “버전 전용”으로 편집할 수 있어야 한다(원본 Experience 보존).
- FR-RES-04: ResumeVersion 프리뷰(HTML)를 제공해야 한다.
- FR-RES-05: (옵션) 공유 링크(토큰/만료)를 지원할 수 있다.

### 3.5 Notes + Knowledge Graph (P0)
- FR-NOTE-01: Note CRUD를 제공해야 한다(분야 domain, tags 포함).
- FR-NOTE-02: Note 상세에서 연관 후보(candidates)를 보여줘야 한다.
- FR-NOTE-03: 후보 중 일부를 사용자가 확정(confirmed)할 수 있어야 한다.
- FR-NOTE-04: 확정된 관계(confirmed edge)만 “연관 개념 리스트/그래프”에 반영되어야 한다.
- FR-NOTE-05: 후보 추천은 Top-N 제한과 필터(domain/tags)를 제공해야 한다.
- FR-NOTE-06: 관계를 해제(Undo)할 수 있어야 한다.

### 3.6 Blog + Lint + Export (P0)
- FR-BLOG-01: BlogPost CRUD를 제공해야 한다.
- FR-BLOG-02: 상태값(draft/published/archived)을 지원해야 한다.
- FR-BLOG-03: 룰 기반 표현 검출(lint)을 제공해야 한다(최소 10개 룰).
- FR-BLOG-04: lint 결과는 항목별 “심각도/메시지/추천 수정”을 포함해야 한다.
- FR-BLOG-05: Export(HTML/Markdown) 생성 기능을 제공해야 한다.
- FR-BLOG-06: 외부 게시 후 URL 등록 및 상태 관리(posted 등)를 제공해야 한다.
- FR-BLOG-07: Connector(외부 연동)는 인터페이스만 설계하고, MVP는 Export 중심으로 간다.

### 3.7 Feedback (P2)
- FR-FB-01: 대상(Project/Resume/Note/Blog)을 선택해 피드백 실행 가능해야 한다.
- FR-FB-02: 결과를 저장하고, 과거 실행과 비교(diff) 가능해야 한다.
- FR-FB-03: Resume/Portfolio는 회사/직무 컨텍스트에 따라 피드백 방향이 달라야 한다.
- FR-FB-04: Note/Blog는 출처/단정/상충 가능성 점검을 포함해야 한다.

---

## 4) 비기능 요구사항 (Non-Functional Requirements, NFR)

### 4.1 보안(Security) (P0)
- NFR-SEC-01: 세션/쿠키는 HttpOnly, Secure, SameSite 정책을 적용해야 한다.
- NFR-SEC-02: CSRF 방어 정책을 적용해야 한다(쿠키 기반 세션 사용 시 특히 중요).
- NFR-SEC-03: 토큰/세션 값은 URL에 노출되면 안 된다.
- NFR-SEC-04: Private 데이터는 캐시/로그/에러 응답에 포함되지 않도록 한다.
- NFR-SEC-05: 입력값 검증(길이/허용 문자/파일 타입)을 수행해야 한다.

### 4.2 성능(Performance) (P0)
- NFR-PERF-01: Public 페이지는 정적 캐시/ISR을 활용해 빠르게 응답해야 한다.
- NFR-PERF-02: 이미지 최적화(리사이즈/지연 로딩)를 적용한다.
- NFR-PERF-03: 검색은 초기엔 Postgres FTS로 충분히 동작해야 한다(필요 시 확장).

### 4.3 신뢰성/데이터 무결성(Reliability) (P0)
- NFR-REL-01: slug/고유키 충돌을 방지해야 한다(유니크 제약).
- NFR-REL-02: 관계(Edge) 데이터는 from/to/type 조합 유니크 정책을 고려해야 한다(중복 관계 방지).
- NFR-REL-03: 삭제 정책은 기본 soft delete를 권장한다(복구/실수 방지).

### 4.4 유지보수성(Maintainability) (P0)
- NFR-MNT-01: Public/Private 레이아웃과 API를 분리해 변경 영향도를 줄인다.
- NFR-MNT-02: DB 스키마 변경은 마이그레이션으로만 수행한다.
- NFR-MNT-03: 린트 룰/피드백 룰은 “룰북”으로 문서화하고 테스트 가능해야 한다.

### 4.5 관측가능성(Observability) (P1)
- NFR-OBS-01: 오류(500), 인증 실패(401/403), Export 실패는 로깅되어야 한다.
- NFR-OBS-02: Public은 최소한의 페이지뷰/클릭 이벤트를 수집할 수 있다(선택).

---

## 5) 검색/추천 요구사항 (최소 구현 전략)
### 5.1 검색(Search)
- Public:
  - 프로젝트 목록 검색(제목/태그)
- Private:
  - Notes/Blog 검색(제목/태그/본문)
- 구현 우선순위:
  - 1차: Postgres Full Text Search(tsvector/tsquery) + GIN 인덱스(필요 시)
  - 2차: 외부 검색 엔진(Typesense/Meilisearch) 검토

### 5.2 추천(Notes 연관 후보)
- 1차: 태그/키워드 기반 후보 생성(빠르고 단순)
- 2차: 임베딩 기반 유사도 Top-N 추천(pgvector) + 필터(domain)
- 원칙: 자동은 후보(candidates)만, 사용자가 confirmed로 확정해야 그래프 관계로 취급

---

## 6) 수용 기준(Acceptance Criteria) — MVP 완료 조건
- AC-01: Public 3페이지(`/`, `/projects`, `/projects/[slug]`)가 로그인 없이 정상 동작한다.
- AC-02: `/app/*`는 비로그인 접근이 차단된다(리다이렉트/401).
- AC-03: 오너가 Project/Experience CRUD 후 Public에 즉시 반영된다.
- AC-04: Notes에서 후보 추천이 제공되고, confirmed edge가 탐색(연관 리스트)로 이어진다.
- AC-05: Blog lint가 최소 10개 룰로 작동하며, Export 생성과 외부 URL 등록이 가능하다.

---

## 7) 의존성/결정 포인트(스키마/설계에 영향)
- 태그 모델: string[] (간단) vs Tag 테이블(정규화)
- 공유 링크: MVP 포함 여부(토큰/만료/권한 범위 정책 필요)
- 노트 후보 정책: rejected 상태를 둘지(재추천 방지)
- Resume 원본 동기화: Experience 변경을 버전에 반영하는 방식(수동 sync 권장)

---


## Post-M5 요구사항 추가 (2026-02-16)

### 기능 요구사항 (FR)
- FR-G1: 로그인 사용자의 워크스페이스 상태를 `/api/app/me`로 조회할 수 있어야 한다.
- FR-G2: Notebook 생성/수정/삭제와 Note 작성 흐름을 UI/API에서 일관되게 제공해야 한다.
- FR-G3: 공개 프로젝트 목록은 `q`, `tag`, `limit`, `cursor`, `publicSlug` 필터를 지원해야 한다.
- FR-G4: Feedback 생성 시 대상 타입에 맞는 후보 목록을 자동 로딩해야 한다.
- FR-G5: Blog Lint는 최소 10개 규칙을 제공해야 한다.
- FR-G6~G12: 공유 링크, 이력화, 감사로그, 관측성, 교차 링크, 임베딩, 공개 디렉토리 기능을 단계적으로 제공한다.

### 비기능 요구사항 (NFR)
- 섹션 단위 배포 게이트(`lint/build/jest/vercel-build`) 필수 통과
- ownerId 스코프 기반 데이터 격리 유지
- 파괴적 변경보다 확장 엔드포인트/필드 우선
