# API Spec — PoReSt (Public Portfolio + Private Owner Dashboard)
버전: v1.0
스타일: REST (Next.js App Router Route Handlers)
원칙: Public API(/api/public/*)와 Private API(/api/app/*)를 분리한다.

---

## 0) 구현 기준(Next.js)
- API는 `app/api/**/route.ts`(Route Handlers)로 구현한다.
- 모든 handler는 Web Request/Response API 기반으로 `Response` 또는 `NextResponse`를 반환한다.

폴더 예시:
app/
  api/
    public/
      portfolio/route.ts
      projects/route.ts
      projects/[slug]/route.ts
    app/
      me/route.ts
      projects/route.ts
      projects/[id]/route.ts
      experiences/route.ts
      experiences/[id]/route.ts
      resumes/route.ts
      resumes/[id]/route.ts
      resumes/[id]/items/route.ts
      notebooks/route.ts
      notes/route.ts
      notes/[id]/route.ts
      notes/[id]/candidates/route.ts
      notes/edges/confirm/route.ts
      notes/edges/remove/route.ts
      blog/posts/route.ts
      blog/posts/[id]/route.ts
      blog/posts/[id]/lint/route.ts
      blog/posts/[id]/export/route.ts
      feedback/requests/route.ts
      feedback/requests/[id]/route.ts

---

## 1) 인증/권한 규칙
### 1.1 Public
- `/api/public/*`는 인증 없이 접근 가능.
- 반환 데이터는 “공개 허용 필드만” 반환(DTO/Select 제한).

### 1.2 Private (Owner only)
- `/api/app/*`는 항상 인증 필요.
- 인증 실패: `401 Unauthorized`
- 권한 없음(오너 아님): `403 Forbidden`
- 데이터 스코프: `ownerId = me.id` 강제

---

## 2) 공통 응답 포맷
### 2.1 성공
- `200 OK` (GET/PUT/PATCH/DELETE)
- `201 Created` (POST)

Body(권장):
{
  "data": <payload>,
  "meta": { ...optional }
}

### 2.2 실패(표준 에러)
- `400 Bad Request`: 파라미터 형식 오류
- `401 Unauthorized`: 비인증
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: slug/unique 충돌
- `422 Unprocessable Entity`: 유효성 검증 실패
- `500 Internal Server Error`: 서버 오류

Body:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "title is required",
    "fields": { "title": "required" }
  }
}

---

## 3) 페이징/정렬 규칙(리스트 공통)
- Cursor 기반 권장:
  - query: `limit`(기본 20, 최대 50), `cursor`(optional), `sort`(optional)
- meta 예시:
meta: {
  "nextCursor": "cuid_...",
  "hasMore": true
}

---

## 4) Public API

## 4.1 공개 포트폴리오 홈 데이터
GET `/api/public/portfolio`

Query:
- `slug`(optional): publicSlug 기반 멀티 포트폴리오 확장 대비 (개인용이면 생략 가능)

Response.data:
{
  "profile": {
    "displayName": "...",
    "headline": "...",
    "bio": "...",
    "avatarUrl": "...",
    "links": [{ "label": "GitHub", "url": "..." }]
  },
  "featuredProjects": [
    { "id":"", "slug":"", "title":"", "subtitle":"", "description":"", "techStack":[""], "repoUrl":"", "demoUrl":"", "thumbnailUrl":"" }
  ],
  "featuredExperiences": [
    { "id":"", "company":"", "role":"", "startDate":"", "endDate":"", "summary":"" }
  ]
}

Notes:
- featuredProjects는 visibility=PUBLIC + isFeatured=true 반영
- featuredExperiences는 visibility=PUBLIC + isFeatured=true (요약 중심)

---

## 4.2 공개 프로젝트 목록
GET `/api/public/projects`

Query:
- `q`(optional): title/description 검색(초기엔 단순 ILIKE)
- `tag`(optional): techStack/tag 필터
- `limit`, `cursor`, `sort`(optional: updatedAt_desc 기본)

Response.data:
[
  { "id":"", "slug":"", "title":"", "description":"", "techStack":[""], "thumbnailUrl":"", "updatedAt":"" }
]

---

## 4.3 공개 프로젝트 상세
GET `/api/public/projects/{slug}`

Path:
- `slug`(required)

Response.data:
{
  "id":"", "slug":"", "title":"", "subtitle":"", "contentMd":"...",
  "techStack":[""], "repoUrl":"", "demoUrl":"", "highlights":{...},
  "updatedAt":""
}

---

## 5) Private API — Auth/Me

## 5.1 내 정보
GET `/api/app/me`

Response.data:
{
  "id":"", "email":"", "isOwner": true
}

---

## 6) Private API — Portfolio Admin

## 6.1 프로젝트 목록/생성
GET  `/api/app/projects`
POST `/api/app/projects`

POST body:
{
  "visibility": "PUBLIC|UNLISTED|PRIVATE",
  "isFeatured": false,
  "slug": "my-project",
  "title": "…",
  "subtitle": "…",
  "description": "…",
  "contentMd": "…",
  "techStack": ["Next.js","Postgres"],
  "repoUrl": "…",
  "demoUrl": "…",
  "thumbnailUrl": "…",
  "highlights": { ... },
  "order": 0
}

Rules:
- slug unique (409 on conflict)
- isFeatured=true면 visibility=PUBLIC이어야 함
- PUBLIC 포트폴리오 라우팅(`/projects/[slug]`)을 쓰려면 Project.slug는 필수 컬럼(스키마에 반영되어야 함)

---

## 6.2 프로젝트 단건 조회/수정/삭제
GET    `/api/app/projects/{id}`
PUT    `/api/app/projects/{id}`
DELETE `/api/app/projects/{id}`

PUT body: 변경 필드만 (partial)

---

## 6.3 경험 목록/생성
GET  `/api/app/experiences`
POST `/api/app/experiences`

POST body:
{
  "visibility":"PUBLIC|UNLISTED|PRIVATE",
  "isFeatured": false,
  "company":"…",
  "role":"…",
  "startDate":"2024-01-01T00:00:00.000Z",
  "endDate": null,
  "isCurrent": true,
  "summary":"…",
  "bulletsJson":[ "성과/기여 1", "성과/기여 2" ],
  "order": 0
}

---

## 6.4 경험 단건 조회/수정/삭제
GET    `/api/app/experiences/{id}`
PUT    `/api/app/experiences/{id}`
DELETE `/api/app/experiences/{id}`

---

## 7) Private API — Resumes

## 7.1 이력서 목록/생성
GET  `/api/app/resumes`
POST `/api/app/resumes`

POST body:
{
  "status":"DRAFT",
  "title":"A사 백엔드 v2",
  "targetCompany":"A",
  "targetRole":"Backend",
  "contentJson": { ... },
  "contentMd": "..."  // optional
}

---

## 7.2 이력서 단건
GET    `/api/app/resumes/{id}`
PATCH  `/api/app/resumes/{id}`
DELETE `/api/app/resumes/{id}`

---

## 7.3 (옵션) 이력서 항목 구성(조합형을 쓸 때)
PUT `/api/app/resumes/{id}/items`

body:
{
  "items": [
    {
      "experienceId":"...",
      "sortOrder":1,
      "overrideBulletsJson":[ "...", "..." ],
      "overrideMetricsJson":[ "..."]
    }
  ]
}

Notes:
- v1에서 Resume를 contentJson으로만 가면 이 엔드포인트는 생략 가능
- 조합형(Experience 재사용)을 강화하려면 ResumeItem을 별도 테이블로 운영

---

## 8) Private API — Notes + Graph

## 8.1 Notebook 목록/생성(분야 단위)
GET  `/api/app/notebooks`
POST `/api/app/notebooks`

POST body:
{ "name":"CS", "description":"…" }

---

## 8.2 Note 목록/생성
GET  `/api/app/notes`
POST `/api/app/notes`

Query(목록):
- `notebookId`(optional)
- `q`(optional) title/body
- `tag`(optional)
- `limit`, `cursor`

POST body:
{
  "notebookId":"...",
  "visibility":"PRIVATE",
  "title":"HTTP 캐시",
  "summary":"...",
  "contentMd":"...",
  "tags":["http","cache"]
}

---

## 8.3 Note 단건
GET    `/api/app/notes/{id}`
PATCH  `/api/app/notes/{id}`
DELETE `/api/app/notes/{id}`

---

## 8.4 연관 후보 조회(자동 추천)
GET `/api/app/notes/{id}/candidates`

Response.data:
[
  { "toNoteId":"...", "relationType":"related", "weight":0.82, "status":"CANDIDATE", "reason":"shared tags + embedding cosine" }
]

Notes:
- 후보는 자동 갱신 대상
- 그래프 표시/탐색은 CONFIRMED만 사용

---

## 8.5 엣지 확정/해제
POST `/api/app/notes/edges/confirm`
POST `/api/app/notes/edges/remove`

confirm body:
{ "fromId":"...", "toId":"...", "relationType":"related" }

remove body:
{ "edgeId":"..." }

Rules:
- unique(fromId,toId,relationType)
- CONFIRMED는 사용자 행동으로만 변경

---

## 9) Private API — Blog + Lint + Export

## 9.1 글 목록/생성
GET  `/api/app/blog/posts`
POST `/api/app/blog/posts`

POST body:
{
  "status":"DRAFT",
  "visibility":"PRIVATE",
  "title":"…",
  "contentMd":"…",
  "summary":"…",
  "tags":["..."]
}

---

## 9.2 글 단건
GET    `/api/app/blog/posts/{id}`
PATCH  `/api/app/blog/posts/{id}`
DELETE `/api/app/blog/posts/{id}`

---

## 9.3 Lint 실행
POST `/api/app/blog/posts/{id}/lint`

Response.data:
{
  "counts": { "error":0, "warn":3, "info":5 },
  "results": [
    { "ruleId":"LONG_SENTENCE", "severity":"warn", "message":"문장이 너무 깁니다", "location":{"paragraph":3}, "suggestion":"…" }
  ]
}

Notes:
- lint 결과는 BlogPost.lintReportJson에 최신 저장
- 히스토리 필요 시 BlogLintRun 테이블 도입

---

## 9.4 Export 생성
POST `/api/app/blog/posts/{id}/export`

Body:
{ "type":"html|markdown_zip" }

Response.data:
{ "artifactId":"...", "createdAt":"..." }

---

## 10) Private API — Feedback (후순위)

## 10.1 피드백 요청 생성
POST `/api/app/feedback/requests`

Body:
{
  "targetType":"PORTFOLIO|RESUME|NOTE|BLOG",
  "targetId":"...",
  "contextJson": { "company":"A", "role":"Backend" },
  "optionsJson": { "strictCitations": true }
}

Response: 201 + requestId

## 10.2 피드백 결과 조회
GET `/api/app/feedback/requests/{id}`

Response.data:
{
  "id":"...",
  "status":"DONE",
  "items":[
    { "severity":"WARN", "title":"정량 지표 부족", "message":"...", "suggestion":"..." }
  ]
}

---

## 11) 보안/데이터 노출 체크리스트(API)
- Public API는 반드시 “허용 필드만” 반환(select 제한)
- Private API는 ownerId 스코프 필수
- 401/403를 UI가 처리할 수 있게 에러 코드 일관성 유지
- Lint/Feedback 결과는 Private 전용(공개 노출 금지)

---

