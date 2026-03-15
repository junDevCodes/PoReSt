# PRD — PoReSt (Portfolio + Notes + Blog + Resume + Feedback)
버전: v1.0  
상태: Draft (개발 착수용)  
작성일: 2026-02-03  
기본 사용자: 다중 사용자(개인용 시작 → 안정화 후 확장)

---

## 1) 배경/문제 정의
### 1.1 배경
- 포트폴리오(공개), 이력서(회사별), 지식노트(분야 무관), 블로그(글/검수)가 각기 분산되어 관리 비용이 큼
- 개인용으로 안정화한 뒤, “공개 포트폴리오”만 배포하여 외부에 보여줄 수 있는 구조가 필요

### 1.2 핵심 문제
- (P1) 경험/프로젝트 원본이 없어서 회사별 이력서 작성 시 반복 작업 발생
- (P2) 지식노트가 누적될수록 연관 개념 탐색/정리 비용 급증
- (P3) 블로그 글 품질(표현/규칙)이 흔들리고, 외부 플랫폼과의 연동은 정책/기술 제약이 큼
- (P4) 개인 데이터(이력서/노트/블로그 초안)가 공개 영역에 노출되면 안 됨

---

## 2) 목표/성공 기준
### 2.1 목표(Goals)
- (G1) 공개 포트폴리오를 전형적인 형태로 깔끔하게 제공(누구나 접근)
- (G2) `/app`에서 로그인 사용자가 경험/프로젝트/이력서/노트/블로그를 체계적으로 관리
- (G3) 지식노트는 분야 제한 없이 누적되며, “연관/유사 개념”을 자동 추천 + 확정 연결로 그래프화
- (G4) 블로그는 작성 시 규칙 기반 표현 검출로 품질을 일관되게 관리
- (G5) (후순위) 문서별 자동 피드백을 실행하고 히스토리로 비교

### 2.2 성공 지표(KPI) — MVP 기준
- 포트폴리오: 대표 프로젝트 3개 이상, 프로젝트 상세 페이지 완성도(Problem→Approach→Result 템플릿) 충족
- 이력서: Experience 원본 1개가 2개 이상의 Resume 버전에 재사용
- 노트: 노트 100개 이상에서도 “연관 개념 이동/탐색”이 유효(연관 후보 클릭률/확정 엣지 수)
- 블로그: 표현 검출 항목 수정 후 재검수 통과율 상승
- 보안: `/app/*` 비인증 접근 100% 차단(권한 테스트 통과)

---

## 3) 사용자/권한 정책 (Public vs Private)
### 3.1 Public (누구나 접근)
- `/` : 포트폴리오 홈(대표 프로젝트/소개/연락)
- `/projects` : 프로젝트 목록
- `/u/[publicSlug]` : 사용자 포트폴리오 홈
- `/u/[publicSlug]/projects` : 사용자 프로젝트 목록
- `/u/[publicSlug]/projects/[slug]` : 사용자 프로젝트 상세(케이스 스터디, canonical)
- `/projects/[slug]` : 레거시 상세 경로(canonical로 리다이렉트)

> 정책: 포트폴리오 페이지에 블로그/노트 콘텐츠를 “본문으로 섞지 않음”.  
> 필요 시 상단/푸터의 링크로만 분기 제공(선택).

### 3.2 Private (로그인 사용자 접근, 로그인/인증 필수)
- `/app` : 대시보드
- `/app/portfolio` : 프로젝트/경험 CRUD + 대표 설정
- `/app/resumes` : 회사/직무별 이력서 버전 관리
- `/app/notes` : 개념노트 + 그래프 연결 관리
- `/app/blog` : 블로그 작성/검수/Export/상태 관리
- `/app/feedback` : (후순위) 피드백 실행/히스토리

---

## 4) 범위 정의 (Scope)
### 4.1 MVP 범위 (우선순위 반영)
1) 포트폴리오(공개) + 포트폴리오 관리(비공개)
2) 지식노트(비공개) + 연관 추천(후보) + 엣지 확정/해제
3) 블로그(비공개) + 표현 검출(룰 기반) + Export + 외부 URL/상태관리
4) 피드백(후순위) — 최소 “피드백 결과 저장/비교”부터

### 4.2 MVP 비목표(Non-goals)
- 다중 사용자 SaaS, 협업/공유 편집
- 외부 블로그 플랫폼 전체 자동 게시/수정의 완전 지원(정책/제약으로 변동 리스크 큼)
- 지식 그래프 고급 분석(클러스터/중심성/학습경로)은 2단계 이후

---

## 5) 핵심 사용자 시나리오 (Top Journeys)
### J1. 포트폴리오 운영
1) `/app/portfolio`에서 Project/Experience 작성
2) 대표 프로젝트/경험 지정
3) 공개 `/` 및 `/projects`에 자동 반영

### J2. 이력서 버전 운영
1) `/app/resumes`에서 “회사/직무” ResumeVersion 생성
2) Experience 선택/정렬 + 문장 수정(스냅샷 저장)
3) (옵션) 공유 링크/PDF/HTML 출력

### J3. 지식노트 그래프
1) `/app/notes`에서 노트 작성(분야/태그/본문)
2) 자동 연관 후보 추천 확인(유사도 상위 N개)
3) 필요한 관계만 확정(Edge confirmed=true)
4) 개념 상세에서 연관 개념 탐색

### J4. 블로그 작성 & 검수
1) `/app/blog`에서 글 작성(draft)
2) 표현 검출 결과 확인(룰 기반)
3) 수정 후 재검수 통과
4) Export 생성(HTML/MD) + 외부 게시 완료 후 URL 등록

### J5. 피드백(후순위)
- 포트폴리오/이력서: 직무/회사 맥락 입력 → 구조/정량화/누락 점검
- 노트/블로그: 출처/단정 표현/상충 가능성 점검 → 결과 저장 및 비교

---

## 6) 요구사항 요약 (High-level)
### 6.1 기능 요구사항 (FR) — 모듈별
#### A) Public Portfolio
- 홈(소개/대표 프로젝트/연락), 프로젝트 목록, 프로젝트 상세
- SEO(OG, sitemap, robots), 이미지 최적화

#### B) Private Dashboard (Authenticated)
- 인증/세션 기반 접근 제어(`/app/*` 보호)
- CRUD 화면: Project, Experience, ResumeVersion, Note, BlogPost
- 공개/비공개 경계 확실히 분리(데이터 노출 규칙)

#### C) Notes Graph
- 자동 연결은 “후보 추천”까지만 (신뢰도 문제)
- 사용자가 확정한 엣지만 그래프 관계로 저장/사용
- 최소 그래프 UI: 개념 상세에 연관 리스트 + 미니 그래프

#### D) Blog Lint
- 표현 검출 룰 엔진(초기 10개 이상) + 메시지/수정 가이드
- Export 생성 + 외부 URL/상태 관리
- 외부 연동은 Connector 인터페이스로 확장 가능하게 설계

#### E) Feedback (Later)
- 실행/저장/비교(히스토리)
- 템플릿 기반 점검(회사/직무/문서 타입별)

### 6.2 비기능 요구사항 (NFR)
- 보안: `/app/*` 무조건 인증 필요, 토큰/세션 안전 저장, CSRF/XSS 기본 방어
- 성능: Public 포트폴리오 페이지는 빠른 로딩(캐시/SSG/ISR), 이미지 최적화
- 운영: 개인용이라도 배포/롤백/백업이 단순해야 함
- 감사/이력: 최소한 수정 시간(updatedAt) 및 주요 변경 이력(선택)

---

## 7) 콘텐츠/데이터 모델 (PRD 수준)
### 7.1 핵심 엔티티(초기)
- Project: 공개 노출 가능(대표/목록/상세)
- Experience: 원본(이력서/포트폴리오 조합 재료)
- ResumeVersion: 회사/직무별 스냅샷(비공개 기본)
- Note(Concept): 분야 무관, 비공개 기본
- Edge: 관계(후보/확정, relationType, weight)
- BlogPost: 비공개 기본(draft/published/archived), lint 결과 포함
- (Later) FeedbackRun: 실행 결과/비교용

### 7.2 공개/비공개 규칙(요약)
- Public은 Project/선택된 Experience 일부만 노출
- Resume/Note/Blog/Feedback는 기본 비공개 + ownerId 스코프 기반으로 본인만 접근
- 공유 링크 기능이 들어갈 경우, 토큰/만료/범위 제한 정책 필수

---

## 8) 리스크 & 대응
### R1. 외부 블로그 자동 게시/수정 제약
- 대응: MVP는 Export + 외부 URL/상태 관리 우선, Connector는 확장 설계만
### R2. 지식 그래프 자동 연결의 품질(오탐/과다 연결)
- 대응: 자동은 “후보”만, 확정은 사용자 승인(confirmed edge)
### R3. 개인 데이터 유출(권한/캐시/로그 실수)
- 대응: `/app` 라우트 완전 분리 + 서버 인증 + 민감 데이터 캐시 정책 분리

---

## 9) 릴리즈 계획(마일스톤)
- M0: 프로젝트 세팅(Next.js + Auth + Prisma + Postgres) /app 보호
- M1: Public Portfolio + /app/portfolio CRUD + 대표 반영
- M2: ResumeVersion(회사/직무별) 생성/편집/프리뷰
- M3: Notes CRUD + 연관 후보 + Edge 확정 + 미니 그래프
- M4: Blog CRUD + Lint(룰) + Export + 외부 URL/상태관리
- M5: Feedback(후순위) 실행/저장/비교

---

## 10) 참고 링크(근거/기술 가이드)
- Next.js Authentication Guide(공식): https://nextjs.org/docs/app/guides/authentication
- Next.js Middleware(공식): https://nextjs.org/docs/14/app/building-your-application/routing/middleware
- Prisma Migrate(공식): https://www.prisma.io/docs/orm/prisma-migrate
- Prisma Postgres Quickstart(공식): https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql
- pgvector(공식): https://github.com/pgvector/pgvector
- pgvector 개요(예: Supabase 가이드): https://supabase.com/docs/guides/database/extensions/pgvector
- 티스토리 Open API 종료 공지: https://notice.tistory.com/2664
- 티스토리 Open API 종료 안내 문서: https://tistory.github.io/document-tistory-apis/

