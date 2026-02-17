# Data Model / ERD — PoReSt (Public Portfolio + Private Owner Dashboard)
버전: v1.0  
상태: Draft (개발 착수용)  
핵심 원칙: Public(포트폴리오만) / Private(오너만) 완전 분리 + “원본(Experience/Note) → 조합/뷰(Resume/Graph)” 구조

---

## 0) 설계 목표
1) Public 포트폴리오를 깔끔하게 제공하면서, Private 데이터(이력서/노트/블로그/초안)가 절대 노출되지 않게 한다.
2) 포트폴리오/이력서/노트/블로그를 한 DB에서 관리하되, “원본 재사용”을 중심으로 확장 가능하게 한다.
3) Notes는 누적될수록 탐색 비용이 줄어야 하므로, 관계(Edge)와 유사도(Embedding/Vector)를 별도 레이어로 둔다.
4) 초기에는 단순하고, 성장하면 성능(FTS/Vector/Index)을 자연스럽게 얹을 수 있어야 한다.

---

## 1) 엔티티 목록 (v1)
- Auth: `User`
- Portfolio: `PortfolioSettings`, `PortfolioLink`, `Project`, `ProjectLink`, `Experience`
- Resume: `Resume`, `ResumeItem`
- Notes: `Note`, `NoteEmbedding`, `NoteEdge`
- Blog: `BlogPost`, `BlogExportArtifact`, `BlogLintRun`(옵션)
- Files: `FileAsset`(옵션)
- Ops: `AuditLog`(옵션)
- Later: `FeedbackRun`

> v1 가정:
> - 오너 1명(하지만 모든 Private 데이터는 ownerId를 들고 있어 “배포 후 확장”도 가능하게)
> - 태그는 우선 `string[]`로 시작(단순/빠름) → 필요 시 Tag 테이블로 마이그레이션

---

## 2) ERD (텍스트 다이어그램)
User 1 ── 1 PortfolioSettings ── N PortfolioLink
User 1 ── N Project ── N ProjectLink
User 1 ── N Experience
User 1 ── N Resume ── N ResumeItem ── 1 Experience
User 1 ── N Note ── 0..1 NoteEmbedding
Note 1 ── N NoteEdge (fromNoteId)
Note 1 ── N NoteEdge (toNoteId)
User 1 ── N BlogPost ── 0..N BlogLintRun (옵션)
User 1 ── N BlogPost ── 0..N BlogExportArtifact

---

## 3) 테이블 상세 (권장 컬럼)

## 3.1 User
- id (PK)
- email (unique)
- name (nullable)
- isOwner (bool, default false)  // 오너 전용 접근 제어
- createdAt, updatedAt

> 인증 구현이 NextAuth.js라면 NextAuth 기본 테이블(Accounts/Sessions/VerificationToken)은 프레임워크 구성에 따라 추가

---

## 3.2 PortfolioSettings (포트폴리오 홈 설정)
- id (PK)
- ownerId (FK -> User, unique)
- isPublic (bool, default true)
- publicSlug (unique)
- displayName (nullable)
- headline (nullable)
- bio (nullable, text)
- avatarUrl (nullable)
- layoutJson (jsonb, nullable)
- createdAt, updatedAt

**관계**
- links (PortfolioLink 1:N)

---

## 3.3 PortfolioLink (포트폴리오 링크)
- id (PK)
- settingsId (FK -> PortfolioSettings)
- label (required)
- url (required)
- order (int, default 0)

**인덱스**
- index(settingsId, order)

---

## 3.4 Project (공개 가능)
- id (PK)
- ownerId (FK -> User)
- slug (unique)  // /projects/[slug]
- title (required)
- description (nullable, 0~200)
- contentMd (required)  // 케이스 스터디 본문(Markdown)
- coverImageAssetId (nullable, FK -> FileAsset)
- techTags (string[])
- visibility (enum: PRIVATE/UNLISTED/PUBLIC, default PUBLIC)
- isFeatured (bool, default false)
- createdAt, updatedAt
- deletedAt (nullable)  // soft delete

**관계**
- links (ProjectLink 1:N)

**규칙**
- isFeatured=true ⇒ visibility=PUBLIC (대표는 공개여야 함)
- Public API는 “노출 허용 필드만” select해서 반환(요약/본문/링크 등)

**인덱스**
- unique(slug)
- index(ownerId, updatedAt desc)
- index(visibility, isFeatured)

---

## 3.5 ProjectLink (프로젝트 링크)
- id (PK)
- projectId (FK -> Project)
- label (required)
- url (required)
- order (int, default 0)

**인덱스**
- index(projectId, order)

---

## 3.6 Experience (원본 데이터: 이력서/포트폴리오 재료)
- id (PK)
- ownerId (FK -> User)
- role (required)
- company (nullable)
- visibility (enum: PRIVATE/UNLISTED/PUBLIC, default PUBLIC)
- startDate (nullable, date)
- endDate (nullable)
- isCurrent (bool, default false)
- summary (nullable, text)
- bulletsJson (jsonb, required, min 1)  // ["성과/기여", ...]
- metricsJson (jsonb, nullable)         // ["응답 30% 개선", ...]
- techTags (string[])
- evidencesJson (jsonb, nullable)       // ["https://...", ...]
- isFeatured (bool, default false)
- order (int, default 0)
- createdAt, updatedAt
- deletedAt (nullable)

**정책**
- Public에 “전문 노출”은 하지 않음(원하면 요약 섹션만)
- Resume에서 override를 허용하여 원본을 보존

**인덱스**
- index(ownerId, visibility, updatedAt desc)
- index(isFeatured)

---

## 3.7 Resume (회사/직무별 스냅샷)
- id (PK)
- ownerId (FK -> User)
- title (required)       // 예: "A사 백엔드"
- company (required)
- position (required)
- level (nullable)       // 예: junior/mid/senior 또는 텍스트
- summaryMd (nullable)   // 버전 상단 요약(자기소개/역량)
- createdAt, updatedAt
- deletedAt (nullable)

**인덱스**
- index(ownerId, updatedAt desc)
- index(company, position)

---

## 3.8 ResumeItem (Resume ↔ Experience 조인 + 순서 + override)
- id (PK) 또는 (resumeId, experienceId) 복합키 중 택1
- resumeId (FK -> Resume)
- experienceId (FK -> Experience)
- sortOrder (int, required)
- overrideBulletsJson (jsonb, nullable)  // 버전 전용 bullet
- overrideMetricsJson (jsonb, nullable)
- overrideTechTags (string[], nullable)
- createdAt, updatedAt

**규칙**
- 하나의 Resume에 같은 Experience는 1번만 포함
- 원본 Experience 변경은 Resume에 자동 반영하지 않음(혼선 방지)
  - (옵션) “Sync from source” 버튼으로 수동 동기화

**제약/인덱스**
- unique(resumeId, experienceId)
- index(resumeId, sortOrder)

---

## 3.9 Note (개념노트: 비공개 기본)
- id (PK)
- ownerId (FK -> User)
- title (required)
- domain (nullable)     // CS/전자/영어 등 자유
- tags (string[])
- contentMd (required)
- referencesJson (jsonb, nullable)  // url/서지 텍스트
- createdAt, updatedAt
- deletedAt (nullable)

**검색(확장)**
- FTS용 `searchVector(tsvector)` 컬럼을 SQL migration으로 추가하는 방식 권장(Prisma에서 직접 관리가 까다로운 경우가 많음)

**인덱스**
- index(ownerId, updatedAt desc)
- (옵션) GIN(searchVector)  // FTS용

---

## 3.10 NoteEmbedding (유사도 추천용 — pgvector)
- id (PK)
- noteId (FK -> Note, unique 또는 noteId+model 복합 unique)
- model (required)          // 예: "text-embedding-3-small" 같은 식별자
- dims (required)
- embedding (vector(dims))  // pgvector 타입
- createdAt, updatedAt

**정책**
- v1에서는 “연관 후보 추천” 용도만(자동=후보, 확정은 사용자)
- 추후 BlogPost/Project에도 확장하려면 Embedding 테이블을 일반화 가능

**인덱스(확장)**
- (옵션) HNSW 또는 IVFFlat 인덱스 (데이터량/성능 요구에 따라 선택)

---

## 3.11 NoteEdge (Note ↔ Note 관계)
- id (PK)
- ownerId (FK -> User)  // 멀티유저 대비 + 안전
- fromNoteId (FK -> Note)
- toNoteId (FK -> Note)
- relationType (enum)  // related | prerequisite | similar | contrast (v1은 related만 써도 됨)
- status (enum)        // candidate | confirmed | rejected(옵션)
- weight (float, nullable)  // 유사도 점수/가중치
- evidenceJson (jsonb, nullable) // 왜 연결됐는지(키워드/유사도 근거) — 디버깅/설명용
- computedAt (nullable)      // 후보 생성 시간
- confirmedAt (nullable)     // 확정 시간
- createdAt, updatedAt

**규칙**
- 자동 생성은 candidate만
- 그래프 탐색/표시에는 confirmed만 사용
- 잘못 연결 방지: confirmed 해제 가능(Undo)

**제약/인덱스**
- unique(ownerId, fromNoteId, toNoteId, relationType)
- index(fromNoteId, status)
- index(toNoteId, status)

> 방향성:
> - related/similar는 보통 “양방향” 느낌이라 UI에서 Confirm 시 양쪽 엣지를 같이 만들지, 단방향 1개만 둘지 정책 선택 필요
> - v1 권장: 단방향 1개만 저장 + UI에서 양쪽 조회(편함/단순)

---

## 3.12 BlogPost (비공개 기본)
- id (PK)
- ownerId (FK -> User)
- slug (unique)
- title (required)
- category (nullable)
- tags (string[])
- contentMd (required)
- status (enum)  // draft | published | archived
- lintSummaryJson (jsonb, nullable) // 최신 lint 결과 요약(빠른 조회용)
- externalUrl (nullable)
- externalStatus (enum)  // none | posted | updated(옵션)
- lastExportedAt (nullable)
- createdAt, updatedAt
- deletedAt (nullable)

**인덱스**
- unique(slug)
- index(ownerId, updatedAt desc)
- index(status)

---

## 3.13 BlogLintRun (옵션: lint 히스토리)
- id (PK)
- blogPostId (FK -> BlogPost)
- severityCountsJson (jsonb)
- resultsJson (jsonb)   // [{ruleId,severity,message,location,suggestion}, ...]
- createdAt

> v1 최소 구현은 BlogPost에 최신 결과만 저장해도 됨  
> 히스토리 비교가 필요해지면 BlogLintRun을 켠다.

---

## 3.14 BlogExportArtifact (Export 이력)
- id (PK)
- ownerId (FK -> User)
- blogPostId (FK -> BlogPost)
- format (string)  // html | md | zip
- fileName (string)
- contentType (string)
- byteSize (int)
- snapshotHash (string)
- payload (bytes)
- createdAt

---

## 3.15 FileAsset (옵션: 이미지/첨부 공용)
- id (PK)
- ownerId (FK -> User)
- storageProvider (enum)  // s3 | r2 | local
- storageKey (required)
- mimeType, sizeBytes
- originalName (nullable)
- createdAt

---

## 3.16 AuditLog (옵션: 변경 감사/운영 안정)
- id (PK)
- ownerId (FK -> User)
- action (enum/string)  // create_project, update_note, export_post ...
- targetType (string)   // Project/Note/BlogPost/Resume...
- targetId (string)
- metaJson (jsonb)      // 변경 요약(민감정보 제외)
- createdAt

---

## 4) 공개/비공개 데이터 노출 규칙 (데이터 레벨)
### 4.1 Public에서 접근 가능한 데이터
- Project: visibility=PUBLIC AND deletedAt IS NULL
- (옵션) Experience: visibility=PUBLIC AND isFeatured=true AND deletedAt IS NULL (단, “요약만”)

### 4.2 절대 Public에 노출되면 안 되는 데이터(기본)
- Resume/ResumeItem
- Note/NoteEmbedding/NoteEdge
- BlogPost(초안 포함), lint 결과 상세
- AuditLog

### 4.3 API 설계 규칙
- Public API는 “Public DTO”를 따로 두고, select 필드를 강제한다.
- Private API는 ownerId 스코프를 항상 포함한다(멀티유저 대비 + 안전).

---

## 5) 검색/추천 설계(데이터 관점)
### 5.1 Full Text Search(FTS)
- Note/BlogPost 본문 검색은 Postgres FTS(tsvector/tsquery)를 1차로 사용
- 스키마 확장은 SQL migration으로 `searchVector` + GIN 인덱스 추가

### 5.2 Vector Similarity(pgvector)
- NoteEmbedding으로 “연관 후보”를 계산(Top-N)
- 인덱스는 데이터량이 커질 때(HNSW/IVFFlat) 단계적으로 적용

---

## 6) 마이그레이션/확장 포인트
- 태그 정규화가 필요해지면:
  - Tag 테이블 + (EntityTag 조인)으로 확장
- “노트 ↔ 프로젝트/블로그”까지 그래프를 확장하려면:
  - (v2) GraphNode 테이블을 두고 NodeID로 연결(다형 FK 문제 해결)
- 공유 링크가 필요해지면:
  - ShareToken(entityType, entityId, token, expiresAt, scope) 추가

---


## Post-M5 데이터 모델 확장 계획 (2026-02-16)

### 즉시 반영/확장
- `Notebook`/`Note` 파이프라인 강화 (CRUD/집계)
- `ResumeShareLink` 모델 도입 (토큰 기반 이력서 공유)
- `BlogExportArtifact` 모델 도입 (format/snapshotHash/payload 기반 export 이력)
- `AuditLog` 모델 도입 (행위 추적)
- `DomainLink` 모델 도입 (Cross-domain 링크 기초 스키마)
- `NoteEmbedding` 운영 필드 보강(`status`, `lastEmbeddedAt`, `error`, `updatedAt`)

### P1 예정 모델
- (비어 있음)

### P2 예정 모델
- (비어 있음)

### 관계 원칙
- 모든 신규 모델은 `ownerId` 스코프를 기본 키/인덱스 전략에 반영
- 공개 접근은 토큰/slug 기반으로 제한적으로 허용
