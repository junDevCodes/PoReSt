# Functional Spec (기능명세서) — PoReSt
버전: v1.0  
상태: Draft (개발 착수용)  
우선순위: Portfolio > Notes > Blog > Feedback  
권한 정책: Public(포트폴리오만) / Private(로그인 사용자)

---

## 0) 문서 목적
- 화면/기능 단위로 “무엇을 어떻게 동작시키는지”를 구체화한다.
- Public/Private 경계를 기능 레벨에서 고정해 데이터 노출 실수를 막는다.
- MVP에 필요한 입력 규칙/상태값/예외 흐름을 확정한다.

---

## 1) 공통 UI/동작 원칙

### 1.1 레이아웃 분리
- Public 레이아웃: 가벼운 상단 네비(Home, Projects) + 푸터(Contact)
- Private 레이아웃: 사이드바(Portfolio/Resumes/Notes/Blog/Feedback/Settings) + 상단 바(검색/로그아웃)

### 1.2 콘텐츠 편집(작성 UX)
- 기본 에디터: Markdown 기반(미리보기 포함)
- 자동 저장: 입력 후 N초 inactivity 또는 “Save” 클릭(초기엔 Save 중심 권장)
- 에디터 공통 기능:
  - 코드블록, 링크, 이미지, 리스트, 제목(h1~h3), 인용
  - 미리보기 토글
  - (선택) 템플릿 삽입 버튼(프로젝트/노트/블로그)

### 1.3 상태/메시지 규칙
- 성공: 상단 토스트 “Saved”
- 실패: 폼 하단/필드 옆 에러 + 상단 토스트(요약)
- 삭제: 2단계(Confirm) + 기본 soft delete(복구 가능) 권장
- 로딩: skeleton(리스트), spinner(버튼 내)

### 1.4 접근 제어(기능 레벨)
- Public 페이지에서 Private 데이터 요청 금지
- Private 페이지는 UI 진입 전(라우팅) + API 호출 시(서버) 2중 보호

---

## 2) Public 기능명세 (포트폴리오)

## 2.1 Home `/`
**목표:** 방문자가 “대표 프로젝트”로 오너의 역량을 빠르게 이해

### 화면 구성
- Hero: 이름/한 줄 소개/주요 키워드(짧게)
- Featured Projects(최대 3~6개)
- (선택) Featured Experiences(최대 3개) — 넣을 경우에도 “요약만”
- Contact: 이메일/깃헙/링크드인 등

### 동작
- Featured Projects는 `isFeatured=true` AND `visibility=PUBLIC` 조건을 기본으로 노출
- Project 카드 클릭 → `/u/[publicSlug]/projects/[slug]` (legacy `/projects/[slug]` 리다이렉트 지원)

### 검증/예외
- Featured가 0개면: 최신 Public 프로젝트 Top-N으로 fallback

---

## 2.2 Projects List `/projects`
**목표:** 전체 프로젝트를 탐색/필터링

### 화면 구성
- 검색(제목/태그)
- 태그 필터(멀티 선택)
- 정렬(최신/대표/성과 기준은 v2, MVP는 최신)
- 프로젝트 카드 리스트

### 동작
- 검색 입력 시 debounce 후 필터 적용
- 태그/검색 조건 변경 시 URL query 반영(옵션)

---

## 2.3 Project Detail `/u/[publicSlug]/projects/[slug]`
**목표:** 전형적인 케이스 스터디 포맷으로 신뢰도 있는 상세 제공

### 섹션 템플릿(최소)
- Problem (무엇을 해결했나)
- Approach (어떻게 접근했나)
- Architecture (구성/흐름)
- Results (정량/정성 성과)
- Links (GitHub/데모/문서)

### 동작/정책
- Private/초안 내용 노출 금지(공개 필드만 렌더)
- 이미지가 있으면 최적화 적용(서빙/리사이즈)

### 예외
- slug 미존재: 404 페이지 + `/projects` 이동 버튼
- 레거시 경로(`/projects/[slug]`) 접근: canonical 경로로 리다이렉트

---

## 3) Private 기능명세 (로그인 사용자 워크스페이스)

## 3.1 Dashboard `/app`
**목표:** 관리 진입점(최근 작업/요약)

### 구성(최소)
- 요약 카드: Projects / Experiences / Notes / BlogPosts 개수
- Quick Actions: New Project, New Note, New Post
- Recent: 최근 수정 항목 5개(타입별)

---

# 4) Portfolio Admin

## 4.1 Projects 관리 `/app/projects`
### 리스트
- 컬럼: Title / Visibility / Featured / UpdatedAt
- 기능: 검색(Title), 필터(visibility=PUBLIC), 정렬(UpdatedAt)

### 생성/편집 `/app/projects/[id]`
**필드**
- title (필수, 2~80자)
- slug (필수, 유니크, 영문/숫자/하이픈 권장)
- description (선택, 0~200자)
- contentMd (Markdown, 필수)
- techTags (선택)
- links[] (선택: label + url)
- visibility (PUBLIC/UNLISTED/PRIVATE)
- isFeatured (선택 boolean)

**검증**
- slug 중복: 저장 불가 + 자동 slug 제안(예: `title-2`)
- isFeatured=true면 visibility=PUBLIC이어야 함(규칙)

**삭제**
- soft delete 기본(복구 가능)
- isFeatured였던 항목 삭제 시: featured 재설정 유도

---

## 4.2 Experiences 관리 `/app/experiences`
### 리스트
- 컬럼: Title / Period / Featured / UpdatedAt
- 기능: 검색(Title), 태그 필터(techTags)

### 생성/편집 `/app/experiences/[id]`
**필드**
- role (필수)
- company (선택)
- period (선택: YYYY-MM ~ YYYY-MM 또는 텍스트, startDate/endDate로 저장)
- visibility (PUBLIC/UNLISTED/PRIVATE)
- summary (선택, 0~200자)
- bullets[] (필수: 최소 1개, 각 20~200자 권장)
- metrics[] (선택: 숫자/단위 포함 권장)
- techTags (선택)
- evidences[] (선택: url)
- isFeatured (선택)

**정책**
- Experience는 Public에 “전문 노출”하지 않고 요약만(넣을 경우)  
- ResumeVersion에서 “버전 전용 편집” 가능해야 함(원본 보존)

---

# 5) Resume 관리

## 5.1 Resume 목록 `/app/resumes`
- 리스트: title(예: “A사 백엔드”), company, position, updatedAt
- 액션: New Resume, Duplicate(템플릿화), Delete

## 5.2 Resume 편집 `/app/resumes/[id]`
### 생성 시 입력(필수)
- title, company, position (level은 선택)

### 편집 기능
- Experience 선택(체크리스트)
- 선택된 Experience 정렬(Drag & Drop 또는 Up/Down)
- 버전 전용 편집(스냅샷)
  - 각 Experience에 대해 custom bullets/summary를 override 가능
  - 원본 변경을 자동 반영하지 않음(혼선 방지)
  - (선택) “Sync from source” 버튼 제공(수동 동기화)

### 출력
- MVP: HTML Preview
- (옵션) PDF Export
- (옵션) Share Link: token + 만료 + 범위(해당 Resume만)

---

# 6) Notes + Knowledge Graph

## 6.1 Notes 목록 `/app/notes`
- 리스트: title, domain, tags, updatedAt
- 기능: 검색(title/body), 필터(domain/tags), New Note

## 6.2 Note 생성/편집 `/app/notes/[id]`
### 필드
- title (필수)
- domain (선택: CS/전자/영어 등 자유)
- tags[] (선택)
- contentMd (Markdown, 필수)
- references[] (선택: url 또는 서지 텍스트)

### 연관 후보(자동 추천)
- 후보 표시 섹션: “Related Candidates”
- 후보는 Top-N(기본 10)만 노출
- 후보는 자동 갱신 대상이며, 사용자가 확정하기 전까지 “참고용” 표시

### 엣지(관계) 확정/해제
- 후보마다 액션:
  - Confirm → confirmed edge 생성/업데이트
  - (옵션) Reject → 재추천 방지
- confirmed edge만:
  - “Related Notes 리스트”
  - “Mini Graph(간단 시각화)”에 반영

### 관계 타입(relationType) 기본값
- related (기본)
- prerequisite (선행 개념)
- similar (유사 개념)
- contrast (비교/대조)
> MVP에서는 related만 먼저 제공하고 나머지는 v2로 확장 가능

### 후보 생성 전략(단계적)
- 1차(MVP): 태그/키워드 기반(빠르고 단순)
- 2차: 임베딩 기반 유사도(예: pgvector)로 Top-N 추천

---

# 7) Blog + Lint + Export

## 7.1 Blog 목록 `/app/blog`
- 리스트: title, status(draft/published/archived), updatedAt
- 필터: status, tags
- 액션: New Post

## 7.2 Post 작성/편집 `/app/blog/[id]`
### 필드
- title (필수)
- slug (필수, 유니크)
- category (선택)
- tags[] (선택)
- contentMd (Markdown, 필수)
- status (draft/published/archived)

### Lint(표현 검출) 패널
- 실행 방식: 자동(저장 시) + 수동(Run Lint 버튼)
- 결과 모델:
  - severity: info/warn/error
  - ruleId, message, location(라인/문단), suggestion
- 사용자 수동 액션:
  - Fix Later(기본): 수정 후 재검수
  - Ignore(옵션): 무시 사유 기록(required)

### MVP Lint 룰(최소 10개)
- 너무 긴 문장(임계치 초과)
- 같은 단어/표현 과다 반복
- 모호 표현 과다(“같다/느낌/아마” 등)
- 과장 표현/금칙어(리스트)
- 링크 없는 단정 문장(참고/근거 없으면 warn)
- 제목-본문 톤 급변(휴리스틱)
- 문단 길이 과다(가독성)
- 코드블록만 있고 설명 부족
- 숫자/단위 표기 불일치
- 맞춤법/띄어쓰기(1차는 라이브러리 기반 적용 가능)

## 7.3 Export + 외부 URL/상태 관리
- Export 타입: HTML / Markdown zip(옵션)
- Export 기록:
  - lastExportedAt
  - artifactId(or file path)
- 외부 게시 상태:
  - externalUrl
  - externalStatus: none/posted/updated (MVP는 none/posted만)
  - postedAt

**정책**
- MVP는 Connector(자동 게시)는 “인터페이스만” 설계하고, 실제 게시 워크플로는 Export + URL 등록으로 안정화

---

# 8) 공통 에러/예외 처리
- 401(비인증): `/login?next=...` 리다이렉트
- 403(권한 없음): 403 페이지(또는 login)
- 404: 존재하지 않는 slug/id
- 409: slug 중복
- 422: 유효성 검증 실패(필드별 메시지)

---

# 9) MVP 완료 기준(기능명세 관점)
- Public 핵심 페이지가 완성도 있게 노출(홈/목록/canonical 상세)
- /app 전 구간 인증 보호(라우트 + API)
- Project/Experience CRUD → Public 반영
- Notes: 후보 추천 + confirmed edge + 연관 탐색
- Blog: lint(10개 룰) + export + 외부 URL 등록

---

# 10) 오픈 이슈(다음 문서에서 확정 필요)
- Tag 모델: string[] vs Tag 테이블
- Share Link를 MVP에 포함할지(토큰/만료/범위)
- Note 후보의 rejected 상태를 둘지(재추천 방지)
- PDF Export 방식(서버 렌더/클라이언트 렌더/외부 서비스)

---


## Post-M5 기능 흐름 추가 (2026-02-16)

### G1 내 워크스페이스 조회
1. 로그인 사용자가 `/api/app/me` 호출
2. 사용자 기본 정보 + workspace(`publicSlug`, `isPublic`) 반환
3. 미존재 사용자 레코드는 404

### G2 Notebook/Note 작성 파이프라인
1. 노트북 생성
2. 노트 작성 시 노트북 선택 필수
3. 노트가 남아있는 노트북 삭제 시 409 반환

### G3 Public Projects 검색/필터
1. 목록 API에 `q/tag/publicSlug` 조건 적용
2. `limit/cursor` 기반 커서 페이지네이션
3. 응답은 `data[] + nextCursor`

### G4 Feedback 대상 자동 선택
1. targetType 선택
2. `/api/app/feedback/targets`에서 대상 목록 로드
3. 목록에서 targetId 선택 후 요청 생성

### G5 Blog Lint Rule10
- 헤딩 레벨 점프 감지(`HEADING_LEVEL_JUMP`)를 추가하여 문서 구조 품질 점검
