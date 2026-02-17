# PoReSt — 최종 통합 요약 (Master Summary)

버전: v1.2 (2026-02-06 업데이트)  
목표: "공개 포트폴리오(메인)" + "오너 전용 통합 관리(/app)"로 포트폴리오/이력서/지식노트/블로그를 한 플랫폼에서 운영한다.  
우선순위: Portfolio > Notes > Blog > Feedback

---

## 📋 문서 현황

### 핵심 설계 문서 (개발 착수용)
1. `01_Vision_One_Pager.md` - 비전/목표
2. `02_PRD.md` - 제품 요구사항
3. `03_IA_Routing_Map.md` - 정보 구조/라우팅
4. `04_User_Flow_Use_Cases.md` - 사용자 플로우
5. `05_Requirements_Spec.md` - 요구사항 명세
6. `06_Functional_Spec.md` - 기능 명세
7. `07_Data_Model_ERD.md` - 데이터 모델
8. `08_Prisma_Schema_v1.md` - Prisma 스키마
9. `09_API_Spec.md` - API 명세
10. `10_Technical_Design_Architecture.md` - 기술 설계
11. `11_Development_Plan_Sprint_Backlog.md` - 개발 계획

### 참고 문서 (Q&A/가이드)
12. `12_QA_Technical_Details.md` - 기술 상세 Q&A (Q1-Q6)
13. `13_QA_Supplement.md` - 추가 Q&A (Q7-Q13)

---

## 🎯 제품 구조 한 장 요약

### Public (누구나 접근)
- `/` : 대표 포트폴리오
- `/projects` : 공개 프로젝트 목록
- `/projects/[slug]` : 케이스 스터디 상세

### Private (오너만 접근)
- `/app/*` : 포트폴리오 관리 / 이력서 / 노트 / 블로그 / (후순위) 피드백

**핵심 정책**
- Public은 **포트폴리오만** 보여준다.
- Private은 **로그인/인증** 없으면 진입 불가.
- 데이터 노출 방지: **Route 보호 + API 보호 2중 방어**.

---

## 🛠 기술 스택 확정안 (v1)

| 레이어 | 기술 |
|--------|------|
| Frontend/BFF | Next.js (App Router) + Route Handlers |
| Auth | Auth.js (NextAuth) + Prisma Adapter |
| Database | PostgreSQL + Prisma ORM |
| Search | Postgres FTS (Notes/Blog) |
| Similarity | pgvector (선택, Notes 연관 후보) |
| Deploy | Vercel (ISR/캐시) |
| Storage | S3/R2/Supabase Storage (선택) |

---

## 📦 MVP 단계별 범위

### M1 — Portfolio (최우선)
- Public 3페이지 완성 + Admin CRUD
- 대표 프로젝트 노출
- ISR 캐싱 적용

### M2 — Resume (✅ B 옵션 확정: ResumeItem 조합형)
- ResumeVersion + ResumeItem 테이블
- Experience 재사용 + override + 정렬
- UX: 동기화 알림, 원본 업데이트 배지, Diff 뷰 (v1.5)

### M3 — Notes + Graph
- Notebook + Note CRUD
- 후보(candidate) 자동 생성 + Confirm
- **품질 개선**: Threshold 0.7, Rejected 상태, Domain 필터링
- confirmed 기반 연관 개념 리스트/미니 그래프

### M4 — Blog
- BlogPost CRUD + status
- Lint (룰 10개+) + 결과 저장
- Export (HTML/MD) + 외부 URL 관리
- 자동 게시(Connector)는 v1 보류

### M5 — Feedback (후순위)
- 대상별 피드백 실행/저장/비교
- Resume/Portfolio: 회사/직무 컨텍스트
- Note/Blog: 근거/단정/상충 점검

---

## 🔑 핵심 설계 철학

### 데이터 재사용
- **원본**: Experience, Note, BlogPost, Project
- **조합**: Resume (ResumeItem), NoteEdge (candidate/confirmed)
- "자동 확정 금지": 자동은 candidate까지만, confirmed는 오너 액션

### Public 노출 규칙
- Project/PortfolioSettings: 공개 허용 데이터만 DTO로 제공
- Resume/Notes/Blog/Feedback: 기본 Private, 절대 Public 노출 금지

### 외부 연동
- Blog: v1은 Export + URL 관리, Connector는 확장 설계만
- 이유: 플랫폼 정책 변동 리스크 분리

---

## 🚀 주요 업데이트 사항 (v1.2)

### 1. M1 스키마 정합성 확정
- Visibility 기반 공개 정책 확정
- Project 필드(슬러그/본문/대표노출) 정합
- 문서 전반(스키마/기능/API) 용어 통일

### 2. Resume 구조 확정
- ✅ **B 옵션 (ResumeItem 조합형)** 최종 확정
- ResumeItem에 `notes` 필드 추가
- Experience에 `metricsJson`, `techTags` 추가
- UX: 동기화 알림, 배지, Diff 뷰

### 3. Notes 후보 생성 품질 개선
- **Threshold**: 유사도 0.7 이상만 후보 표시
- **Rejected 상태**: 거절한 후보 재추천 방지 (v1.5)
- **Domain 필터링**: 같은 domain 우선 추천
- **Top-N 제한**: 기본 10개, 최대 20개

### 4. Blog Lint 규칙 관리
- v2에서 Rule 테이블 도입 (동적 관리)
- 오너가 규칙별 on/off, threshold 조정 가능

### 5. 공유 링크 계획
- v1.5: Resume 공유 (기본)
- v2.0: Project 공유
- v2.5: 비밀번호/Analytics

---

## 💰 예상 비용

### 무료 티어 (MVP)
- Vercel Hobby: $0
- Neon Free: $0 (0.5GB)
- R2 Storage: ~$1
- **Total: ~$1/월**

### 실사용 단계
- Vercel Hobby: $0
- Neon Pro: $19
- R2: ~$2
- **Total: ~$21/월**

---

## 📚 API 구조

### Public API
- `/api/public/portfolio` - 포트폴리오 홈 데이터
- `/api/public/projects` - 프로젝트 목록
- `/api/public/projects/{slug}` - 프로젝트 상세

### Private API
- `/api/app/me` - 내 정보
- `/api/app/projects` - Project CRUD
- `/api/app/experiences` - Experience CRUD
- `/api/app/resumes` - Resume CRUD
- `/api/app/notes` - Note CRUD
- `/api/app/notes/edges/confirm` - Edge 확정
- `/api/app/blog/posts` - BlogPost CRUD
- `/api/app/blog/posts/{id}/lint` - Lint 실행
- `/api/app/blog/posts/{id}/export` - Export 생성

---

## 🎯 다음 액션 (바로 실행)

1. **M0: Foundation** (1주)
   - Next.js + Auth + Prisma 세팅
   - Vercel Preview/Prod 배포
   - Route Groups 구조

2. **M1: Portfolio** (2주)
   - Public 3페이지
   - /app/portfolio CRUD
   - ISR + on-demand revalidate

3. **M2: Resume** (1주)
   - ResumeVersion + ResumeItem
   - Experience 선택/정렬
   - HTML Preview

4. **M3: Notes** (2주)
   - Note CRUD
   - 후보 생성 (태그 기반)
   - Confirm/Undo UI

5. **M4: Blog** (1주)
   - BlogPost CRUD
   - Lint 엔진 (10개 규칙)
   - Export + URL 관리

---

## ⚠️ 주의사항 & 리스크

### 서버리스 DB 연결
- **문제**: 함수 인스턴스마다 새 연결 생성
- **해결**: Neon/Supabase pooled connection 사용

### Notes 추천 품질
- **문제**: 과다 연결, 오탐
- **해결**: Threshold 0.7, Rejected 상태, Domain 필터

### Public/Private 데이터 노출
- **문제**: 캐시/API 실수로 노출
- **해결**: 2중 방어 (Route + API) + DTO 강제

### 외부 블로그 연동
- **문제**: API 정책 변경
- **해결**: Export 중심, Connector는 확장만

---

## 📖 참고 문서

### 기술 상세 Q&A
- **Q1**: 서버리스 DB 커넥션 관리
- **Q2**: 마이그레이션 전략
- **Q3**: Resume 데이터 구조 (B 옵션)
- **Q4**: Tag 정규화 시점
- **Q5**: 공유 링크 단계적 구현
- **Q6**: Vercel 성능 최적화
- **Q7-Q13**: CI/CD, 모니터링, UI/UX

자세한 내용은 `12_QA_Technical_Details.md`, `13_QA_Supplement.md` 참조

---

**최종 상태**: 개발 착수 가능 ✅  
**권장**: M0 (Foundation)부터 시작 → M1 세로로 완주 → 안정화 후 M2, M3


## Post-M5 Gap Closure (2026-02-16)

### 추가 기능 로드맵
- P0(완료): G1 `/api/app/me`, G2 Notebook CRUD/작성 파이프라인, G3 Public Projects 검색/필터/cursor, G4 Feedback 대상 자동 선택, G5 Blog Lint Rule10
- P1(완료): G6 Resume 공유 링크, G7 Export 이력, G8 Audit Log, G9 관측성 표준화
- P2(진행중): G10 Cross-domain 링크(완료), G11 pgvector 임베딩 운영(완료), G12 공개 사용자 디렉토리(완료), T36 운영 검증/문서화 잔여

### 운영 원칙
- 섹션 단위로 `lint/build/jest/vercel-build` 통과 후 완료 처리
- 기능 반영 시 `docs/*` 동시 동기화
