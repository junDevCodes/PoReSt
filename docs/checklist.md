# PoReSt 작업 검증 체크리스트

기준일: 2026-03-18
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T89 — 이력서 편집/공유 UX 프로덕션 폴리시

---

### Session A — 공유 페이지 + PDF (5개)

**수정 파일:** `_lib/format-resume-data.ts`(신규), `share/[token]/page.tsx`, `_lib/pdf.ts`

#### A1. 데이터 포맷 유틸리티

- [x] `parseBullets(json)` → string[] 안전 변환 (null/undefined/비배열 → 빈 배열)
- [x] `parseMetrics(json)` → {key,value}[] 안전 변환 (null/비객체 → 빈 배열)
- [x] 테스트 작성 (정상 입력 + 엣지 케이스: null, 숫자, 중첩 객체) — 16개

#### A2~A3. 공유 페이지 리디자인 + 포맷 렌더링

- [x] 다크 고정 배경 → 크림 배경 + 프로급 카드 레이아웃
- [x] bullets: `<ul><li>` 서식 리스트 (JSON 평문 제거)
- [x] metrics: key-value 인라인 표시 (JSON 평문 제거)
- [x] summary: whitespace-pre-wrap 텍스트 스타일
- [x] 기술 태그: pill 배지 표시
- [x] experience.summary 표시 (기존 미표시)

#### A4. PDF HTML 리디자인

- [x] bullets: `<ul><li>` 서식 리스트 (기존 `<pre>` JSON 제거)
- [x] metrics: key-value 표시 (기존 `<pre>` JSON 제거)
- [x] summary: white-space: pre-wrap (기존 평문)
- [x] 기술 태그: pill 또는 쉼표 구분 표시
- [x] 타이포그래피: 헤더 계층 + 색상 강조 + 여백

#### A5. 공유 페이지 인쇄 CSS

- [x] `@media print` 기본 스타일 (배경 숨기기, 깨끗한 출력)

---

### Session B — 편집 페이지 UX (4개)

**수정 파일:** `[id]/edit/page.tsx`

#### B6. bullets 구조화 편집기

- [x] JSON textarea → 배열 입력 UI (각 행: input + 삭제 버튼)
- [x] [항목 추가] 버튼
- [x] 기존 JSON 데이터 파싱하여 행 초기화
- [x] 저장 시 string[] → JSON 직렬화

#### B7. metrics 구조화 편집기

- [x] JSON textarea → key-value 쌍 입력 UI (각 행: key + value + 삭제)
- [x] [항목 추가] 버튼
- [x] 기존 JSON 데이터 파싱하여 행 초기화
- [x] 저장 시 Record<string,string> → JSON 직렬화

#### B8. 프리뷰 포맷 렌더링

- [x] 프리뷰 bullets: 마커 리스트 (JSON 평문 제거)
- [x] 프리뷰 metrics: 키-값 인라인 (JSON 평문 제거)
- [x] 프리뷰 기술 태그: pill 배지

#### B9. 공유 링크 인라인 관리

- [x] 편집 페이지에 "공유 링크" 섹션 추가
- [x] 새 공유 링크 생성 버튼 (POST API 호출)
- [x] 기존 링크 목록 (토큰, 생성일, 상태)
- [x] 클립보드 복사 버튼 (full URL)
- [x] 취소(revoke) 버튼 (DELETE API 호출)

---

### Session C — 목록 + 생성 페이지 (3개)

**수정 파일:** `ResumesPageClient.tsx`, `new/page.tsx`

#### C10. 목록 카드 상태 배지 + hover

- [x] 상태 배지 색상: DRAFT(회색) / SUBMITTED(에메랄드) / ARCHIVED(앰버)
- [x] 카드 hover 효과 (shadow-md + -translate-y-0.5)
- [x] 회사/직무 정보 레이아웃 개선

#### C11. 생성 페이지 상태 고정

- [x] 상태 드롭다운 제거 → DRAFT 고정 전송
- [x] 안내 문구 추가

#### C12. 모바일 반응형

- [x] 목록 버튼 줄바꿈 (375px 이하)
- [x] 편집 항목 세로 스택 (md 이하)
- [x] 공유 페이지 여백 최적화 (좁은 화면) — px-4 sm:px-6 적용

---

### 세션별 개별 게이트

각 세션은 독립적으로 lint/build 통과 확인 후 커밋.

**Session A 게이트:**
- [x] `npm run lint` 통과
- [x] `npm run build` 통과

**Session B 게이트:**
- [x] `npm run lint` 통과
- [x] `npm run build` 통과

**Session C 게이트:**
- [x] `npm run lint` 통과
- [x] `npm run build` 통과

### 통합 게이트 4종 (전 세션 완료 후)

- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과 (Next.js 16.1.6 Turbopack)
- [x] `npx jest --runInBand` 통과 (65 suites, 429 tests)
- [x] `npm run vercel-build` 통과

### Playwright 시각 검증 (프로덕션)

- [x] 공유 페이지 크림 배경 + 포맷 렌더링 정상 (bullets `<ul>`, pill 태그, summary, 번호 인디케이터)
- [x] 공유 페이지 에러 처리 (잘못된 토큰 → 에러 메시지)
- [x] 편집 페이지 구조화 편집기 동작 (오버라이드 불릿/지표 + 항목 추가 UI)
- [x] 편집 페이지 공유 링크 관리 동작 (생성 → 활성 표시 → URL 복사/취소)
- [x] 목록 페이지 상태 배지 (초안 회색) + 회사/직무/항목수 레이아웃
- [x] 생성 페이지 DRAFT 고정 배지 + 안내 문구

---

### 매 태스크 종료 시 공통

- [x] 통합 게이트 4종 통과
- [x] Playwright 시각 검증 통과
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
