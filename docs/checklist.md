# PoReSt 작업 검증 체크리스트

기준일: 2026-03-19
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## Sprint 3 (T91~T94) ✅ 완료

> history.md 참조

---

## T95 — 화면 전환 속도 병목 진단 ✅

---

### D1. 인증 플로우 분석

- [x] NextAuth 콜백 (session, jwt) 내 DB 쿼리 식별
- [x] 로그인 → 최종 /app 도착까지 리다이렉트 횟수 카운트
- [x] 각 구간 예상 소요 시간 기록

### D2. 미들웨어 분석

- [x] `middleware.ts` 로직 크기 + 실행 경로 파악
- [x] matcher 패턴 범위 확인 (불필요한 경로 매칭 여부)
- [x] 매 요청 DB 호출 여부

### D3. 워크스페이스 레이아웃 분석

- [x] `(private)/app/layout.tsx` 서버 데이터 페칭 내용 확인
- [x] 매 페이지 전환마다 레이아웃 재실행 여부
- [x] Suspense 경계 유무

### D4. 사이드바 렌더링 분석

- [x] AppSidebar `'use client'` 여부
- [x] 네비게이션 시 리렌더링 범위 (전체 vs 부분)

### D5. 페이지별 데이터 페칭 분석

- [x] `/app/*` 주요 page.tsx 5~6개 쿼리 패턴 (직렬/병렬)
- [x] 불필요한 overfetch 여부

### D6. loading.tsx 유무 확인

- [x] `/app/*` 하위 디렉토리 loading.tsx 존재 여부 전수 조사
- [x] 없는 페이지 목록 작성

### D7. Link prefetch 분석

- [x] 사이드바/내부 Link의 prefetch 설정 확인
- [x] prefetch={false} 명시된 곳 식별

### D8. 번들 크기 분석

- [x] `next build` 출력에서 큰 chunk 식별
- [x] 'use client' 파일 목록 + 크기
- [x] html2canvas-pro, jsPDF, @google/generative-ai 동적 import 여부

### D9. 서버리스 cold start 분석

- [x] 프로덕션 첫 요청 응답 시간 (cold vs warm)
- [x] 함수 크기 확인

---

### T95 산출물

- [x] **병목 우선순위 리스트** (P1/P2/P3) 작성
- [x] **T96 작업 항목 확정** — P1 병목 기반
- [x] history.md에 진단 결과 기록

---

## T96 — 성능 최적화 적용 ✅ 완료

---

### Session A — 주요 페이지 loading.tsx (12개 신규) ✅

**패턴**: 목록형(h1+카드), 대시보드형(요약+차트), 클라이언트형(h1+로딩)

- [x] A1: `app/loading.tsx` — 대시보드형 (헤더+체크리스트+메트릭 4카드)
- [x] A2: `app/projects/loading.tsx` — 목록형 (h1+필터+카드 리스트)
- [x] A3: `app/resumes/loading.tsx` — 목록형 (h1+2버튼+카드 리스트)
- [x] A4: `app/experiences/loading.tsx` — 목록형 (h1+입력폼+카드 리스트)
- [x] A5: `app/notes/loading.tsx` — 목록형 (h1+2열 노트북/작성폼+노트 목록)
- [x] A6: `app/blog/loading.tsx` — 목록형 (h1+버튼+카드 리스트)
- [x] A7: `app/skills/loading.tsx` — 목록형 (h1+폼+프리셋 그리드+스킬 리스트)
- [x] A8: `app/analytics/loading.tsx` — 대시보드형 (4카드+바차트+2열 분포)
- [x] A9: `app/growth-timeline/loading.tsx` — 대시보드형 (3카드+히트맵+2열 차트)
- [x] A10: `app/feedback/loading.tsx` — 클라이언트형 (h1+버튼+카드 리스트)
- [x] A11: `app/job-tracker/loading.tsx` — 클라이언트형 (h1+칸반 6열)
- [x] A12: `app/testimonials/loading.tsx` — 클라이언트형 (h1+버튼+카드 리스트)

#### Session A 스타일 규칙

- [x] `animate-pulse` + `bg-black/10 dark:bg-white/10` (T90 패턴 준수)
- [x] 실제 page.tsx 레이아웃 구조 매칭 (CLS 방지)
- [x] 외부 라이브러리 없음 (Tailwind only)

#### Session A 게이트

- [x] `npm run lint` 통과 (0 errors — hooks 파일 기존 에러 2개 무관)
- [x] `npm run build` 통과 (70/70 static pages)
- [x] 12개 파일 전부 생성 확인

---

### Session B — 레이아웃 Suspense + 나머지 (1개 수정 + 5개 신규) ✅

- [x] B1: `layout.tsx` Suspense 경계 추가 — `{children}`을 `<Suspense>` 래핑
  - [x] 사이드바 즉시 렌더링 유지 (Suspense 바깥)
  - [x] fallback: WorkspaceSkeleton 콘텐츠 영역 스켈레톤
- [x] B2: `app/audit/loading.tsx` — 클라이언트형 (h1 + 테이블 5행)
- [x] B3: `app/company-targets/loading.tsx` — 클라이언트형 (h1 + 필터 + 폼 + 카드 3행)
- [x] B4: `app/domain-links/loading.tsx` — 클라이언트형 (h1 + 폼 4필드 + 링크 4행)
- [x] B5: `app/experience-stories/loading.tsx` — 클라이언트형 (h1 + 필터 + 폼 + 카드 3행)
- [x] B6: `app/portfolio/settings/loading.tsx` — 설정형 (h1 + 기본정보/연락처/구직/레이아웃 섹션)

#### Session B 게이트

- [x] `npm run lint` 통과 (0 errors)
- [x] `npm run build` 통과
- [x] Suspense 경계 동작 확인 (사이드바 즉시, 콘텐츠 스트리밍)

#### Session B 추가 수정

- [x] Session A `analytics/loading.tsx` Math.random → 정적 배열 수정 (React impure function 에러)
- [x] Session A `growth-timeline/loading.tsx` Math.random → 정적 배열 수정 (동일 에러)

---

### 통합 게이트 (전 세션 완료 후) ✅

- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (69 suites, 482 tests)
- [x] `npm run test:e2e` 통과 (17 passed — UI 회귀 없음)
- [x] 통합 게이트 최종 재검증 완료 (2026-03-19) — lint/build/jest/e2e 4종 통과

---

## T97 — 합격 자소서 RAG 파이프라인 ⬜ 대기

> plan.md 참조. T96 완료 후 또는 병렬 진행.

## T98 — 자기소개서 생성 API + UI ⬜ 대기

> plan.md 참조. T97 완료 후 진행.

---

### 매 태스크 종료 시 공통

- [x] 기존 게이트 4종 통과
- [x] 기존 E2E 17개 통과 (성능 최적화 → UI 회귀 없음)
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
