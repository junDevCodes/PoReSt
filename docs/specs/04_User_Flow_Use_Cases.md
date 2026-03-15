# User Flow + Use Cases — Public Portfolio + Private Workspace
버전: v1.0  
목적: “공개(포트폴리오)”와 “비공개(로그인 사용자 워크스페이스)”를 분리한 상태에서, 핵심 작업(포트폴리오→노트→블로그→피드백)의 사용자 흐름과 예외/결정 포인트를 개발 가능한 수준으로 고정한다.

---

## 0) 용어/원칙
- User Flow: 사용자가 특정 목표를 달성하기 위해 거치는 “이상적인 단계 흐름”
- User Journey: 목표 달성 과정의 더 넓은 맥락(상황/감정/채널)을 포함한 지도
> 이 문서는 개발 착수용이므로 **User Flow 중심**으로 작성한다.

---

## 1) 페르소나/권한
### P1. Visitor (Public)
- 목표: 포트폴리오로 오너의 역량/프로젝트/연락처를 빠르게 파악
- 접근: Public만 접근 가능

### P2. Authenticated User (Private)
- 목표: 포트폴리오/이력서/노트/블로그를 한 곳에서 작성·관리·재사용
- 접근: `/app/*` 전 구간 인증 필요

---

## 2) 공통 상태(State) 정의
### 2.1 인증 상태 (Auth State)
- `ANON`: 비로그인 (Public만 접근)
- `AUTH`: 로그인됨 (Private 기능 접근 가능)
- `EXPIRED`: 세션 만료 (재로그인 필요)

### 2.2 콘텐츠 상태 (Content Lifecycle)
- BlogPost: `draft` → `published` → `archived`(옵션)
- Project: Public 노출을 위해 `visibility=PUBLIC` 상태여야 함(정책은 기능명세에서 확정)
- ResumeVersion: 기본 비공개, 출력/공유는 옵션

### 2.3 그래프 관계 상태 (Edge State)
- `candidate`: 자동 추천(후보) — 시스템이 생성/갱신 가능
- `confirmed`: 사용자가 확정 — 그래프 관계로 “신뢰 가능”한 연결
- (옵션) `rejected`: 후보를 명시적으로 거절(재추천 방지)

---

## 3) End-to-End User Flows

## F1. Visitor: 포트폴리오 탐색(공개)
**목표:** 대표 프로젝트 확인 → 상세 케이스 스터디 확인 → 연락/링크로 전환  
**Entry:** `/`  
**Exit:** contact click / 외부 링크 클릭 / 이탈

1) `/` 홈 진입  
2) Featured Projects 목록 스캔  
3) [결정] 관심 프로젝트 있음?
   - Yes → `/u/[publicSlug]/projects/[slug]` 이동
   - No  → `/projects`로 전체 목록 보기
4) `/projects` 목록에서 필터/태그(옵션) 사용 → canonical 상세 이동
5) `/u/[publicSlug]/projects/[slug]`에서 구조(Problem→Approach→Architecture→Results→Links) 확인
6) [결정] 연락/깃헙/라이브 링크 클릭?

**예외/에러**
- slug 없음 → 404 + 프로젝트 목록 링크 제공

---

## F2. Authenticated User: 로그인 → 대시보드 진입
**목표:** `/app/*` 접근을 로그인 사용자에게 허용하고 ownerId 스코프를 강제  
**Entry:** `/login` 또는 `/app/*` 직접 접근  
**Exit:** `/app` 진입 또는 로그인 실패

1) 비로그인 상태에서 `/app/*` 접근  
2) middleware가 인증 체크  
3) 인증 없음 → `/login?next=/app/...` 리다이렉트  
4) 로그인 성공 → `next`로 복귀 (없으면 `/app`)  
5) 로그인 실패 → 오류 메시지 + 재시도

**예외/에러**
- 세션 만료(`EXPIRED`) → 보호 구간 접근 시 자동 `/login` 이동

---

## F3. Authenticated User: 포트폴리오 원본 관리 → Public 반영
**목표:** Project/Experience 작성 + 대표 설정 → Public 페이지에 반영  
**Entry:** `/app/portfolio`  
**Exit:** Public 확인(`/`, `/projects`)

### F3-1 Project CRUD
1) `/app/portfolio/projects` 진입  
2) “New Project”  
3) 입력: title/slug/description/contentMd/links/techStack/visibility/isFeatured  
4) Save  
5) [결정] visibility=PUBLIC 상태인가?
   - Yes → Public 목록/상세에 표시
   - No  → Private 데이터로만 유지

### F3-2 Experience CRUD (이력서/포트폴리오 재료)
1) `/app/portfolio/experiences` 진입  
2) “New Experience”  
3) 입력: 역할/기간/성과지표/기여/근거 링크/techTags  
4) Save  
5) [결정] Featured Experience로 설정?
   - Yes → Public 홈(대표 경험 섹션이 있다면)에 반영
   - No  → Resume 조합용 데이터로 유지

**예외/에러**
- slug 충돌 → 저장 불가 + 자동 제안 slug 제공
- 삭제: 기본은 soft delete 권장(복구 가능)

---

## F4. Owner: 회사별 이력서 버전(ResumeVersion) 생성/편집
**목표:** 경험 원본을 선택/정렬하여 회사/직무별 스냅샷 생성  
**Entry:** `/app/resumes`  
**Exit:** 프리뷰/출력/공유(옵션)

1) `/app/resumes` 목록에서 “New Resume”  
2) 입력: company/position/level(옵션)/title  
3) Experience 선택(체크리스트)  
4) 정렬(드래그/업다운)  
5) 각 경험의 문장/요약을 “버전 전용 편집”으로 수정(원본 보존)  
6) Save  
7) [결정] 출력 형태?
   - HTML Preview (MVP)
   - PDF Export (옵션)
   - Share Link (옵션: 토큰/만료/범위)

**예외/에러**
- Experience 원본 변경 시: 기존 Resume 스냅샷에 반영할지(수동 “Sync from source” 버튼 권장)

---

## F5. Owner: 지식노트(Notes) 작성 → 연관 후보 추천 → 엣지 확정
**목표:** 분야 무관 노트 누적 + “연관 개념” 관리 비용 감소  
**Entry:** `/app/notes`  
**Exit:** 노트 탐색/그래프 탐색

1) `/app/notes`에서 “New Note”  
2) 입력: title/domain(tags)/content/references  
3) Save  
4) 시스템 작업(자동):
   - 키워드/태그 기반 1차 후보 산출
   - (선택) 임베딩 생성 후 유사도 Top-N 후보 생성
5) Note 상세(`/app/notes/[id]`)에서 “Related Candidates” 확인  
6) [결정] 후보 중 확정할 관계가 있는가?
   - Yes → “Confirm Edge” (candidate → confirmed)
   - No  → 후보 유지 또는 “Reject”(옵션)
7) confirmed 엣지 기반으로 “연관 개념 리스트 + 미니 그래프” 제공  
8) 연관 개념 클릭 → 해당 Note 상세로 이동(탐색 루프)

**예외/에러**
- 후보가 과다: Top-N 제한 + 도메인/태그 필터 제공
- 잘못 연결: confirmed 해제(Undo) 가능

---

## F6. Owner: 블로그 작성 → 표현 검출(Lint) → Export/외부 URL 상태관리
**목표:** 글 품질 안정화 + 외부 게시 “리스크 분리”  
**Entry:** `/app/blog`  
**Exit:** Export 완료 + 외부 URL 등록(선택)

1) `/app/blog`에서 “New Post”  
2) 입력: title/slug/category/tags/content/status=draft  
3) Save  
4) Lint 실행(자동/수동)
   - 룰 기반 검출(중복 표현, 과장/금칙어, 과도한 모호 표현, 긴 문장 등)
5) [결정] Lint 경고를 수정할 것인가?
   - Yes → 수정 → 재검수
   - No  → “Ignore with reason”(옵션) 저장
6) Export 생성(HTML/MD 패키지)
7) 외부에 게시 완료 후 URL 등록 + 상태(`posted`) 기록

**예외/에러**
- slug 충돌: 자동 제안
- Export 실패: 에러 로그 + 재시도
- 외부 연동(Connector)은 MVP에선 “설계만”, 실행은 Export 우선

---

## F7. (Later) 피드백 실행 → 히스토리 비교
**목표:** 문서별 품질 점검을 실행하고 결과를 버전으로 저장  
**Entry:** `/app/feedback` 또는 각 문서의 “Run Feedback” 버튼  
**Exit:** 결과 저장 + 재실행 비교

1) 대상 선택(Project/Resume/Note/Blog)  
2) 컨텍스트 입력(Resume/Portfolio는 회사/직무/레벨)  
3) 피드백 실행  
4) 결과 저장(FeedbackRun)  
5) 비교(이전 Run과 diff)

---

## 4) Use Cases (개발 착수용 표준 템플릿)

### UC-01 Public: 프로젝트 상세 열람
- Actor: Visitor
- Trigger: 홈/목록에서 프로젝트 클릭
- Preconditions: 프로젝트 visibility=PUBLIC 기준 충족
- Main Flow: F1 3~6
- Postconditions: 상세 페이지 렌더, 링크 클릭 이벤트 기록(옵션)
- Alt Flow: slug 없음 → 404

### UC-02 Private: 프로젝트 생성/수정
- Actor: Authenticated User
- Trigger: New Project / Edit
- Preconditions: AUTH
- Main Flow: F3-1
- Postconditions: Project 저장, Public 반영(조건 충족 시)

### UC-03 Private: 경험(Experience) 생성/수정
- Actor: Authenticated User
- Trigger: New Experience / Edit
- Preconditions: AUTH
- Main Flow: F3-2
- Postconditions: Experience 저장, Resume 조합 가능

### UC-04 Private: 이력서 버전 생성/편집
- Actor: Authenticated User
- Trigger: New Resume / Edit
- Preconditions: AUTH + Experience ≥ 1
- Main Flow: F4
- Postconditions: ResumeVersion 저장(스냅샷)

### UC-05 Private: 노트 작성 및 연관 엣지 확정
- Actor: Authenticated User
- Trigger: New Note / Confirm Edge
- Preconditions: AUTH
- Main Flow: F5
- Postconditions: Note 저장, confirmed Edge 저장(선택)

### UC-06 Private: 블로그 글 작성 + Lint
- Actor: Authenticated User
- Trigger: New Post / Run Lint
- Preconditions: AUTH
- Main Flow: F6 1~5
- Postconditions: lintResult 저장(옵션), 개선 히스토리 남김

### UC-07 Private: 블로그 Export 및 외부 URL 등록
- Actor: Authenticated User
- Trigger: Export / Register URL
- Preconditions: AUTH + Post 존재
- Main Flow: F6 6~7
- Postconditions: export artifact 생성, externalUrl 상태 저장

---

## 5) 이벤트/로그(최소 권장) — 나중에 품질 개선용
- Public: `view_home`, `view_projects`, `view_project_detail`, `click_contact`, `click_external_link`
- Private: `create_project`, `update_project`, `create_experience`, `create_resume`, `confirm_edge`, `run_lint`, `export_post`

---

## 6) 구현 메모(기술 방향과 흐름 연결)
- `/app/*` 보호: middleware + 서버 API authorization “2중 방어”
- 노트 유사도 후보: 초기엔 태그/키워드 + 이후 pgvector 기반 Top-N
- 그래프 품질: 자동 연결은 candidate만, confirmed만 그래프 관계로 취급
- 외부 블로그: MVP는 Export + URL 상태관리(Connector는 확장 설계)

---


