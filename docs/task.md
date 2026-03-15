# PoReSt 작업 상세 계획서

기준일: 2026-03-16
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T86 — 성장 타임라인 (자동 수집 + 히트맵) ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 성장 이벤트 추적 | 미지원 | GrowthEvent 모델로 이벤트 기록 |
| 자동 수집 | 미지원 | 기존 엔티티(기술/프로젝트/경력/이력서/노트/지원)에서 자동 생성 |
| 히트맵 | 미지원 | 일별/월별 활동 히트맵 시각화 |
| 수동 이벤트 | 미지원 | 자격증/수상/발표 등 수동 이벤트 추가 |
| 대시보드 | 미지원 | 요약 카드 + 히트맵 + 차트 + 타임라인 |

### 핵심 변경

1. **Prisma 스키마 — GrowthEvent 모델**
   - `growth_events` 테이블: ownerId, type, title, description, entityId, occurredAt
   - `@@index([ownerId, occurredAt])`, `@@index([ownerId, type])`
   - 8개 이벤트 타입: SKILL_ADDED, PROJECT_CREATED, EXPERIENCE_ADDED, RESUME_CREATED, NOTE_CREATED, JOB_APPLIED, OFFER_RECEIVED, CUSTOM

2. **growth-timeline 모듈** (`src/modules/growth-timeline/`)
   - `getTimeline()` — 히트맵 + 타입 분포 + 월별 요약 + 최근 이벤트
   - `createEvent()` — Zod 검증 + 수동 이벤트 추가
   - `deleteEvent()` — 소유권 검증 + 삭제
   - `syncFromEntities()` — 6가지 엔티티에서 자동 수집 + 중복 방지

3. **API 라우트**
   - `GET /api/app/growth-timeline` — 타임라인 조회 (days 파라미터)
   - `POST /api/app/growth-timeline` — 수동 이벤트 추가
   - `POST /api/app/growth-timeline/sync` — 자동 수집 실행
   - `DELETE /api/app/growth-timeline/[id]` — 이벤트 삭제

4. **워크스페이스 UI** (`/app/growth-timeline`)
   - 요약 카드 4개 (전체/최근/유형/월수)
   - 활동 히트맵 (365일, GitHub 스타일 컬러 강도)
   - 월별 바 차트 + 이벤트 타입 분포
   - 성장 타임라인 리스트 (역순, 삭제 버튼)
   - 이벤트 추가 모달 + 자동 수집 버튼

5. **AppSidebar** — "성장 타임라인" 메뉴 추가

### 변경 파일 목록

**수정:**
- `prisma/schema.prisma` — GrowthEvent 모델 + User relation
- `src/components/app/AppSidebar.tsx` — 메뉴 추가

**신규:**
- `src/modules/growth-timeline/interface.ts` — DTO + Service 인터페이스
- `src/modules/growth-timeline/implementation.ts` — 서비스 구현 + 자동 수집
- `src/modules/growth-timeline/http.ts` — 에러 응답 헬퍼
- `src/modules/growth-timeline/index.ts` — 공개 API export
- `src/app/api/app/growth-timeline/route.ts` — GET/POST
- `src/app/api/app/growth-timeline/sync/route.ts` — POST sync
- `src/app/api/app/growth-timeline/[id]/route.ts` — DELETE
- `src/app/(private)/app/growth-timeline/page.tsx` — Server Component
- `src/app/(private)/app/growth-timeline/GrowthTimelinePageClient.tsx` — Client Component
- `src/modules/growth-timeline/tests/growth-timeline.test.ts` — 22개 테스트

### 게이트

- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (64 suites, 413 tests)
- [x] `npm run vercel-build` 통과
- [x] push 완료 (`7fb82a3`)

---

## T85 — 추천서/동료 평가 ✅ 완료

(병렬 세션에서 구현 — 커밋 `b3879c5`, `72ce4ab`, `67a4fdc`)

---

## 다음 태스크

- [확장 판단] M10 완료 — "이 제품을 남도 쓰게 할 만한가?"
- T87: 커스텀 도메인 (유료화 경계)
- T81: 블로그 외부 연동 (Optional)
