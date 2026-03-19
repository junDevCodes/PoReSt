# PoReSt 전체 작업 계획서 — Sprint 4

기준일: 2026-03-19
문서 정의: 프로젝트 비전·마일스톤·로드맵·게이트를 관리하는 단일 기준 문서
관련 문서: `task.md`(현재 태스크 상세), `checklist.md`(검증 체크리스트), `history.md`(완료 이력·맥락), `archive.md`(보류 항목·아이디어)

---

## 1) 비전과 전략

### 1.1 비전

PoReSt는 공개 포트폴리오(`/portfolio/[publicSlug]`)와 개인 워크스페이스(`/app`)를 통합한 **개인 개발자 OS**다.

### 1.2 제품 전략

**Dogfooding → 폴리시 → 품질 보증 → 실전 최적화**

1. **Sprint 1 (M6~M10)**: 기능 구현 완료 ✅
2. **Sprint 2 (M11-P)**: 포트폴리오/이력서 프로덕션 폴리시 ✅
3. **Sprint 3 (M12)**: 품질 보증 — 테스트 + E2E + 접근성 + 성능 기준선 ✅
4. **Sprint 4 (M13, 현재)**: 실전 최적화 — 화면 전환 속도 + AI 자기소개서 RAG

### 1.3 Sprint 4 핵심 원칙

- **체감 속도 우선** — 사용자가 "빠르다"고 느끼는 개선 (측정보다 체감)
- **원인 진단 → 수정** — 감이 아닌 프로파일링 기반 병목 식별
- **AI 실전 무기** — Gemini API로 합격 자소서 기반 RAG 프롬프팅
- **기존 품질 보호** — Jest 482 + E2E 17 기준선 유지

---

## 2) Sprint 1~3 완료 요약

> 상세 이력은 `history.md` 참조

| Sprint | 마일스톤 | 핵심 | 상태 |
|---|---|---|---|
| S1 (M6~M10) | 기능 구현 | 17개 모듈, 72+ API | ✅ |
| S2 (M11-P) | 프로덕션 폴리시 | T88~T90, 디자인/성능/코드품질 | ✅ |
| S3 (M12) | 품질 보증 | T91~T94, 테스트/E2E/접근성/Lighthouse | ✅ |

**Sprint 3 기준선**: 69 suites, 482 tests + E2E 17 tests / lint 0 errors / Lighthouse Perf 87~98

---

## 3) Sprint 4 마일스톤 — M13: 실전 최적화

### 목표

> GitHub 로그인부터 내부 메뉴 탐색까지 화면 전환이 "빠르다"고 느끼게 + 구직 실전 AI 자기소개서

### 진입 근거

- 사용자 체감: "GitHub 로그인 → 내부 메뉴 전환 속도가 느리다"
- 구직 활동 진행 중: AI 자기소개서가 즉시 가치를 제공
- archive.md "AI 자기소개서" 복귀 조건 충족 (이력서 AI 초안 T80-5 안정화)
- archive.md "기업 분석 고도화" 복귀 조건 충족 (구직 활동 시작)

### Phase 1: 프론트엔드 화면 전환 속도 최적화

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T95 | 화면 전환 속도 병목 진단 (프로파일링 + 번들 분석) | ✅ 완료 |
| T96 | P1 병목: loading.tsx 17개 + layout Suspense (2세션 병렬) | ✅ 완료 (게이트 최종 검증 2026-03-19) |

### Phase 2: AI 자기소개서 RAG

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T97 | 합격 자소서 RAG 파이프라인 (스키마 + 임베딩 + 검색) | ⬜ 대기 |
| T98 | 자기소개서 생성 API + 워크스페이스 UI | ⬜ 대기 |

### 실행 순서

```
Phase 1 (성능)                    Phase 2 (AI 자기소개서)
──────────────                   ──────────────────────
T95 (병목 진단)
  ↓
T96 (최적화 적용)                 T97 (RAG 파이프라인)
                                    ↓
                                  T98 (생성 API + UI)
```

- **T95 → T96**: 순차 (진단 후 수정)
- **Phase 1 ∥ Phase 2**: T96과 T97은 병렬 가능 (파일 겹침 없음)

---

## 4) 태스크 상세

### T95 — 화면 전환 속도 병목 진단

**범위**: GitHub 로그인 → 워크스페이스 진입 → 내부 메뉴 전환 전 구간 프로파일링

**진단 대상**:
1. **인증 플로우**: NextAuth 콜백 → 리다이렉트 → 세션 체크 시간
2. **미들웨어**: `middleware.ts` 매 요청 오버헤드
3. **워크스페이스 레이아웃**: `(private)/app/layout.tsx` 세션/데이터 페칭
4. **사이드바**: AppSidebar 렌더링 — 클라이언트 컴포넌트 여부, 리렌더링
5. **페이지별 데이터**: `/app/*` 하위 page.tsx의 Prisma 쿼리 직렬/병렬
6. **loading.tsx 유무**: private 페이지에 loading 스켈레톤 있는지
7. **Link prefetch**: `next/link` prefetch 설정 확인
8. **번들 크기**: `@next/bundle-analyzer`로 클라이언트 번들 분석
9. **동적 import**: 무거운 라이브러리 (html2canvas-pro, jsPDF) 즉시 로드 여부

**산출물**: 병목 우선순위 리스트 (P1/P2/P3) + T96 작업 항목 확정

### T96 — P1 병목: loading.tsx 17개 + layout Suspense

**범위**: T95 진단 P1 병목 해소 — private 페이지 loading.tsx 스켈레톤 17개 + layout.tsx Suspense 경계

**확정 영역** (18개 항목, 2 세션 병렬):
- Session A: 주요 12개 loading.tsx (홈/프로젝트/이력서/경력/노트/블로그/스킬/분석/성장/피드백/트래커/추천서)
- Session B: layout.tsx Suspense + 나머지 5개 loading.tsx (감사/기업/링크/스토리/설정)

**스켈레톤 패턴**: 목록형(h1+카드), 대시보드형(요약+차트), 클라이언트형(h1+로딩), 설정형(폼 필드)
**스타일**: `animate-pulse` + `bg-black/10 dark:bg-white/10` (T90 패턴 재사용)

**제외 (archive)**: P2 중복 인증, P3 번들 심화

### T97 — 합격 자소서 RAG 파이프라인 (← archive 복귀)

**범위**: 자기소개서 데이터 모델 + Gemini 임베딩 + 유사 자소서 검색 + 프롬프트 설계

**핵심 설계**:
1. **CoverLetter Prisma 모델**
   - ownerId, targetCompany, targetRole, contentMd, status(DRAFT/FINAL)
   - `isReference: Boolean` — 합격 자소서 마킹 (RAG 코퍼스)
   - 관련 experienceId, resumeId 연결 (선택)

2. **임베딩 파이프라인**
   - isReference=true 자소서 → Gemini text-embedding-004 → pgvector 저장
   - 기존 NoteEmbedding 패턴 재사용 (CoverLetterEmbedding 모델)

3. **RAG 검색**
   - 입력: targetRole + targetCompany + JD 키워드
   - 검색: 코사인 유사도로 상위 3~5개 합격 자소서 검색
   - `withGeminiFallback()` 패턴 — API KEY 없으면 키워드 기반 fallback

4. **프롬프트 설계**
   - System: "합격 자소서 작성 전문 컨설턴트" 페르소나
   - Context: 검색된 합격 자소서 예시 (few-shot)
   - User data: 경력/프로젝트/스킬 데이터 자동 포함
   - Output: 구조화된 자기소개서 (지원동기/역량/성장계획/입사후포부)

### T98 — 자기소개서 생성 API + 워크스페이스 UI

**범위**: API 엔드포인트 + 생성 UI + 편집/저장

**예상 영역**:
1. **API**
   - `POST /api/app/cover-letters/generate` — RAG 기반 생성
   - `GET/POST /api/app/cover-letters` — CRUD
   - `PATCH/DELETE /api/app/cover-letters/[id]` — 수정/삭제

2. **워크스페이스 UI** (`/app/cover-letters`)
   - 생성 폼: targetCompany + targetRole + JD + 지원 동기 힌트
   - 합격 자소서 등록: 기존 합격본 마킹 (isReference)
   - 생성 결과: 마크다운 에디터로 편집/저장
   - AppSidebar "자기소개서" 메뉴 추가

---

## 5) 게이트 규칙

### 5.1 고정 게이트 (매 태스크 완료 시)

1. `npm run lint` — 0 errors
2. `npm run build` — 성공
3. `npx jest --runInBand` — 기준선 이상
4. `npm run vercel-build` — 성공

### 5.2 Sprint 4 추가 게이트

- 화면 전환 체감 개선 확인 (T95~T96)
- E2E 17개 기존 통과 유지 (성능 최적화 → UI 회귀 없음)
- 자기소개서 생성 API 동작 확인 (T97~T98)
- Gemini fallback 정상 (API KEY 없어도 기본 동작)

### 5.3 기준선

- jest: 69 suites, 482 tests
- E2E: 8 specs, 17 tests
- lint: 0 errors, 8 warnings

---

## 6) 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| 성능 병목이 Vercel 인프라(cold start) | loading.tsx + prefetch로 체감 개선, 인프라 자체는 변경 불가 |
| 번들 분석 → 과도한 리팩토링 | P1 병목만 수정, 나머지는 archive |
| RAG 코퍼스 부족 (합격 자소서 0개) | 합격본 없으면 few-shot 프롬프트만으로도 동작 |
| Gemini API KEY 미설정 | withGeminiFallback 패턴 유지 — 키워드 기반 fallback |

---

## 7) 아키텍처 현황 메모

- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **스타일**: Tailwind CSS 4
- **ORM**: Prisma 7.3 + NeonDB (PostgreSQL)
- **인증**: NextAuth 4.x (Google OAuth)
- **배포**: Vercel
- **CI/CD**: GitHub Actions (lint→build→jest→deploy) + E2E (별도 워크플로우)
- **AI**: Gemini (text-embedding-004, gemini-2.0-flash) + `withGeminiFallback()` 패턴
- **테스트**: Jest (69 suites, 482 tests) + Playwright E2E (17 tests, 8 specs)
- **접근성**: @axe-core/playwright, skip-to-content, 시맨틱 nav/h3, aria-hidden/aria-label
