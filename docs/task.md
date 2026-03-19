# PoReSt 작업 상세 계획서

기준일: 2026-03-19
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T91 ✅ / T92 ✅ / T93 ✅ / T94 ✅ (Sprint 3 완료)

> history.md 참조. 기준선: 69 suites, 482 tests + E2E 17 tests.

---

## T95 — 화면 전환 속도 병목 진단 ✅

> history.md 참조. D1~D9 전체 완료. P1/P2/P3 우선순위 확정.

---

## T96 — 진단 기반 성능 최적화 적용 ✅ 완료 (통합 게이트 최종 검증 2026-03-19)

### 배경

T95 진단 결과: **P1 병목 = loading.tsx 전무 (27개 페이지) + 레이아웃 Suspense 없음**

현재 private 페이지 loading.tsx **0개**. 공개 포트폴리오에만 T90에서 3개 추가.
사용자가 사이드바 메뉴를 클릭하면 빈 화면 → 콘텐츠가 나타나는 "깜빡임"이 체감 느림의 핵심 원인.

### 핵심 원칙

- **기존 포트폴리오 스켈레톤 패턴 재사용**: `animate-pulse` + `bg-black/10 dark:bg-white/10` (T90 패턴)
- **실제 페이지 레이아웃 매칭**: 각 스켈레톤은 해당 page.tsx의 구조를 반영하여 CLS 방지
- **공통 패턴 추출**: 목록 페이지(제목+카드 그리드), 대시보드 페이지(요약 카드+차트), 클라이언트 페이지(제목+로딩) 3가지 패턴

### 스켈레톤 패턴 분류

| 패턴 | 구조 | 해당 페이지 |
|---|---|---|
| **목록형** | h1 제목 + 카드 그리드 (2~3열) | projects, resumes, experiences, notes, blog, skills, testimonials |
| **대시보드형** | 요약 카드 행 + 차트/히트맵 영역 | 홈(page.tsx), analytics, growth-timeline |
| **클라이언트형** | h1 제목 + 로딩 스피너/카드 | feedback, audit, company-targets, domain-links, experience-stories, job-tracker |
| **설정형** | 폼 필드 스켈레톤 | portfolio/settings |

---

### 확정 작업 항목 (18개 — 신규 파일 17개 + layout 수정 1개)

#### Session A: 주요 페이지 loading.tsx (12개 신규) ✅

| # | 파일 | 패턴 | 상태 |
|---|---|---|---|
| A1 | `app/loading.tsx` | 대시보드형 (헤더+체크리스트+메트릭 4카드) | ✅ |
| A2 | `app/projects/loading.tsx` | 목록형 (h1+필터+카드 리스트) | ✅ |
| A3 | `app/resumes/loading.tsx` | 목록형 (h1+2버튼+카드 리스트) | ✅ |
| A4 | `app/experiences/loading.tsx` | 목록형 (h1+입력폼+카드 리스트) | ✅ |
| A5 | `app/notes/loading.tsx` | 목록형 (h1+2열 노트북/작성폼+노트 목록) | ✅ |
| A6 | `app/blog/loading.tsx` | 목록형 (h1+버튼+카드 리스트) | ✅ |
| A7 | `app/skills/loading.tsx` | 목록형 (h1+폼+프리셋 그리드+스킬 리스트) | ✅ |
| A8 | `app/analytics/loading.tsx` | 대시보드형 (4카드+바차트+2열 분포) | ✅ |
| A9 | `app/growth-timeline/loading.tsx` | 대시보드형 (3카드+히트맵+2열 차트) | ✅ |
| A10 | `app/feedback/loading.tsx` | 클라이언트형 (h1+버튼+카드 리스트) | ✅ |
| A11 | `app/job-tracker/loading.tsx` | 클라이언트형 (h1+칸반 6열) | ✅ |
| A12 | `app/testimonials/loading.tsx` | 클라이언트형 (h1+버튼+카드 리스트) | ✅ |

#### Session B: 레이아웃 Suspense + 나머지 loading.tsx (5개 신규 + 1개 수정)

| # | 파일 | 패턴 | 설명 |
|---|---|---|---|
| B1 | `layout.tsx` 수정 | — | `{children}`을 `<Suspense fallback={<워크스페이스 스켈레톤>}>` 래핑 |
| B2 | `app/audit/loading.tsx` | 클라이언트형 | h1 "감사 로그" + 테이블 placeholder |
| B3 | `app/company-targets/loading.tsx` | 클라이언트형 | h1 "기업 분석" + 카드 리스트 |
| B4 | `app/domain-links/loading.tsx` | 클라이언트형 | h1 "교차 링크" + 테이블 placeholder |
| B5 | `app/experience-stories/loading.tsx` | 클라이언트형 | h1 "STAR 스토리" + 카드 리스트 |
| B6 | `app/portfolio/settings/loading.tsx` | 설정형 | h1 "설정" + 폼 필드 스켈레톤 |

### 병렬 실행 구조

```
Session A (주요 12개)                Session B (레이아웃 + 5개)
──────────────────                  ──────────────────────
A1. 홈 대시보드 ✅                   B1. layout.tsx Suspense ✅/❌
A2. 프로젝트 ✅                     B2. 감사 로그 ✅/❌
A3. 이력서 ✅                       B3. 기업 분석 ✅/❌
A4. 경력 ✅                         B4. 교차 링크 ✅/❌
A5. 노트 ✅                         B5. STAR 스토리 ✅/❌
A6. 블로그 ✅                       B6. 포트폴리오 설정 ✅/❌
A7. 스킬 ✅
A8. 분석 ✅
A9. 성장 타임라인 ✅
A10. 피드백 ✅
A11. 지원 트래커 ✅
A12. 추천서 ✅
       ↘      통합: 게이트 4종 + E2E 17개 + 체감 확인       ↙
```

### 세션별 수정 파일 (충돌 없음)

| 세션 | 파일 | 수 |
|---|---|---|
| **Session A** | `app/loading.tsx` 외 11개 신규 (전부 loading.tsx) | 12개 |
| **Session B** | `layout.tsx` 수정 1개 + `app/*/loading.tsx` 신규 5개 | 6개 |

### B1 Suspense 경계 상세

현재 `layout.tsx`:
```tsx
// 현재: 세션 페칭 블로킹
const session = await getServerSession(authOptions);
return <AppShellWrapper userName={userName}>{children}</AppShellWrapper>;
```

변경 방향:
```tsx
// Suspense로 children 스트리밍
return (
  <AppShellWrapper userName={userName}>
    <Suspense fallback={<WorkspaceSkeleton />}>
      {children}
    </Suspense>
  </AppShellWrapper>
);
```
→ 사이드바는 즉시 렌더링, 메인 콘텐츠만 스트리밍 대기

### 제약 사항

- 기존 테스트 기준선 유지 (69 suites, 482 tests + E2E 17 tests)
- 게이트 4종 통과 (lint/build/jest/vercel-build)
- 스켈레톤 = 실제 페이지 구조 매칭 (CLS 방지)
- `animate-pulse` + `bg-black/10 dark:bg-white/10` (기존 T90 패턴)
- 외부 라이브러리 추가 없음 (Tailwind only)

### 제외 (archive 이관)

- P2: 중복 인증 통합 — 아키텍처 변경 큼, 체감 영향 낮음
- P3: 번들 크기 심화 — 서버 전용 라이브러리 영향 없음

---

## T97 — 합격 자소서 RAG 파이프라인 ⬜ 대기

### 배경

구직 활동 진행 중. Gemini API KEY 입력 시 합격 자소서를 바탕으로 RAG 기반 프롬프팅.
archive.md "AI 자기소개서 생성" 복귀 (복귀 조건: 이력서 AI 초안 안정화 ✅).

### 예상 범위

1. **CoverLetter Prisma 모델** — 자소서 CRUD + isReference(합격본 마킹)
2. **CoverLetterEmbedding** — 합격본 임베딩 (Gemini text-embedding-004)
3. **RAG 검색** — targetRole + JD → 코사인 유사도 상위 3~5개
4. **프롬프트 설계** — "합격 자소서 작성 전문 컨설턴트" + few-shot 합격 예시
5. **withGeminiFallback** — API KEY 없으면 구조화된 템플릿 fallback

---

## T98 — 자기소개서 생성 API + UI ⬜ 대기

### 예상 범위

1. `POST /api/app/cover-letters/generate` — RAG 기반 생성
2. `GET/POST/PATCH/DELETE /api/app/cover-letters` — CRUD
3. `/app/cover-letters` 워크스페이스 페이지
4. 합격본 등록 UI (기존 자소서 → isReference 마킹)
5. AppSidebar "자기소개서" 메뉴 추가
