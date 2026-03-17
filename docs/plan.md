# PoReSt 전체 작업 계획서 — Sprint 2

기준일: 2026-03-18
문서 정의: 프로젝트 비전·마일스톤·로드맵·게이트를 관리하는 단일 기준 문서
관련 문서: `task.md`(현재 태스크 상세), `checklist.md`(검증 체크리스트), `history.md`(완료 이력·맥락), `archive.md`(보류 항목·아이디어)

---

## 1) 비전과 전략

### 1.1 비전

PoReSt는 공개 포트폴리오(`/portfolio/[publicSlug]`)와 개인 워크스페이스(`/app`)를 통합한 **개인 개발자 OS**다.

### 1.2 제품 전략

**Dogfooding → 폴리시 → 확장**

1. **Sprint 1 (M6~M10)**: 기능 구현 완료 ✅ → `history.md` 참조
2. **Sprint 2 (M11-P, 현재)**: 포트폴리오/이력서 프로덕션 폴리시 + 프론트엔드 최적화
3. **Sprint 3 (확장, 보류)**: 멀티유저, 커스텀 도메인 → `archive.md` 이관

### 1.3 Sprint 2 핵심 원칙

- **포트폴리오/이력서만 건드린다** — 노트, 블로그, 기업분석 고도화는 보류
- **디자인 퀄리티 우선** — "HR이 10초 안에 인상 받는" 수준
- **성능 체감 개선** — 화면 전환이 빠르다고 느끼게
- **기능 추가 최소화** — 있는 것을 다듬는 데 집중

---

## 2) Sprint 1 완료 요약

> 상세 이력은 `history.md` 참조

| 마일스톤 | 핵심 내용 | 상태 |
|---|---|---|
| M6 | 안정화 완결 (Audit, 에러 표준화) | ✅ |
| M7 | 포트폴리오 채용 가치 (HR 직결, SEO, 경력, 레이아웃) | ✅ |
| M8 | AI 고도화 (Gemini 임베딩/피드백/이력서 초안) | ✅ |
| M9 | 데이터·인사이트 (방문 분석, 엔티티 연결) | ✅ |
| M10 | 커리어 관리 (지원 트래커, 추천서, 성장 타임라인) | ✅ |

**기준선**: 64 suites, 413 tests / lint 0 errors

### 확장 판단 결과 (2026-03-17): ⏸️ 보류

| 기준 | 결과 |
|---|---|
| 매일 사용 (주 5회) | ❌ |
| 외부 조회 (월 50회) | ❌ |
| 타인 요청 (1명+) | ❌ |
| 비용 감당 (월 $20↓) | ❌ |

→ 확장 대신 **프로덕션 폴리시** 진입

---

## 3) Sprint 2 마일스톤 — M11-P: Production Polish

### 목표

> 포트폴리오를 공유했을 때 "이거 뭘로 만들었어?" 라는 반응이 나오는 수준

### Phase 1: 포트폴리오/이력서 폴리시

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T88 | 포트폴리오 디자인/UX 프로덕션 레벨 | ✅ 완료 |
| T89 | 이력서 편집/공유 UX 프로덕션 폴리시 | ✅ 완료 |

### Phase 2: 프론트엔드 성능 최적화

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T90 | 화면 전환 속도 + 번들 최적화 + Core Web Vitals | 예정 |

### 실행 순서

```
T88 (포트폴리오 폴리시)
  ↓
T89 (이력서 UX)       ← T88과 디자인 토큰 공유 가능
  ↓
T90 (성능 최적화)     ← 폴리시 완료 후 측정 기반 최적화
```

---

## 4) 태스크 상세

### T88 — 포트폴리오 프로덕션 폴리시

**범위**: 공개 포트폴리오 (`/portfolio/[publicSlug]`) 전체 디자인/UX 개선

**예상 영역** (실제 항목은 task.md에서 현황 진단 후 확정):
- 포트폴리오 홈 레이아웃/타이포그래피/여백
- 프로젝트 카드 디자인
- 경력 타임라인 시각적 완성도
- 기술 스택 섹션 표현
- 추천서 섹션 디자인
- 반응형 (모바일/태블릿)
- 다크모드 일관성
- 마이크로 인터랙션 (hover, transition)

### T89 — 이력서 편집/공유 UX 프로덕션 폴리시

**범위**: 공유 페이지 리디자인 + PDF 품질 + 편집 UX 구조화 + 목록/생성 폴리시

**확정 영역** (12개 항목, 3 세션 병렬):
- Session A: 데이터 포맷 유틸 + 공유 페이지 크림 배경 리디자인 + PDF 프로급 개선 + 인쇄 CSS
- Session B: bullets/metrics 구조화 편집기 + 프리뷰 포맷 + 공유 링크 인라인 관리
- Session C: 목록 상태 배지/hover + 생성 상태 고정 + 모바일 반응형

### T90 — 프론트엔드 성능 최적화

**범위**: 화면 전환 속도, 번들 사이즈, Core Web Vitals

**예상 영역**:
- 페이지 전환 속도 (현재 느린 부분 측정)
- 번들 분석 + 코드 스플리팅
- 이미지 최적화
- Server Component / Client Component 분리 최적화
- Suspense + Loading UI
- LCP / FCP / CLS 개선

---

## 5) 게이트 규칙

### 5.1 고정 게이트 (매 태스크 완료 시)

1. `npm run lint` — 0 errors
2. `npm run build` — 성공
3. `npx jest --runInBand` — 기준선 이상
4. `npm run vercel-build` — 성공

### 5.2 Sprint 2 추가 게이트

- Lighthouse 성능 점수 측정 (T90 완료 시 기준선 설정)
- Playwright 프로덕션 시각 검증 (포트폴리오 주요 페이지)

### 5.3 기준선

- jest: 65 suites, 429 tests
- lint: 0 errors, 8 warnings
- 브랜치: main 직접 push

---

## 6) 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| 디자인 폴리시 범위 확산 | task.md에서 구체 항목 15개 이내로 제한 |
| 성능 최적화 → 기능 파괴 | 기존 테스트 기준선 보호 |
| "완벽" 함정 | Phase별 완료 기준 명확화, 80% 달성 시 다음 Phase 이동 |

---

## 7) 아키텍처 현황 메모

> Sprint 1에서 구축된 기술 스택. Sprint 2에서 참조용.

- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **스타일**: Tailwind CSS 4
- **ORM**: Prisma 7.3 + NeonDB (PostgreSQL)
- **인증**: NextAuth 4.x (Google OAuth)
- **배포**: Vercel
- **다크모드**: `[data-theme="dark"]` + localStorage `"portfolio-theme"`
- **PDF**: `pdf-download.ts` (html2canvas-pro + jsPDF)
- **SEO**: sitemap.ts(동적), robots.ts, OG Image(동적), JSON-LD
- **layoutJson**: `{ sections: [{ id, visible }] }` — 섹션 순서/가시성
- **이력서 공유**: `ResumeShareLink` (nanoid 12자)
- **Skills 아이콘**: Simple Icons CDN + devicon CDN fallback
- **Gemini**: `src/modules/gemini/` — `withGeminiFallback()` 패턴
