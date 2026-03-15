# PoReSt 작업 검증 체크리스트

기준일: 2026-03-16
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T86 — 성장 타임라인 (자동 수집 + 히트맵) ✅

---

### 스키마

- [x] GrowthEvent 모델 정의 (type, title, description, entityId, occurredAt)
- [x] `@@index([ownerId, occurredAt])` 인덱스
- [x] `@@index([ownerId, type])` 인덱스
- [x] User relation `growthEvents` 추가
- [x] `prisma db push` 정상 반영
- [x] `prisma generate` 클라이언트 생성

### growth-timeline 모듈

- [x] `interface.ts` — GrowthEventDto, DailyActivityCount, TypeDistribution, MonthlySummary 타입
- [x] `interface.ts` — GROWTH_EVENT_TYPES 8개 정의
- [x] `interface.ts` — GROWTH_EVENT_LABELS 한국어 라벨
- [x] `interface.ts` — GrowthTimelineServiceError + isGrowthTimelineServiceError 타입 가드
- [x] `implementation.ts` — createEventSchema Zod 검증 (type, title, description, occurredAt)
- [x] `getTimeline()` — 히트맵 일별 카운트 + 타입 분포 + 월별 요약
- [x] `createEvent()` — 수동 이벤트 추가 + Zod 검증
- [x] `deleteEvent()` — 소유권 검증 + NOT_FOUND/FORBIDDEN 에러
- [x] `syncFromEntities()` — 6가지 엔티티 자동 수집
- [x] `syncFromEntities()` — entityId 기반 중복 방지 (skipped 카운트)
- [x] `syncFromEntities()` — JOB_APPLIED: appliedAt 우선 사용

### 자동 수집 대상 (6가지)

- [x] Skill → SKILL_ADDED
- [x] Project → PROJECT_CREATED
- [x] Experience → EXPERIENCE_ADDED
- [x] Resume → RESUME_CREATED
- [x] Note (deletedAt null) → NOTE_CREATED
- [x] CompanyTarget (APPLIED/OFFER) → JOB_APPLIED/OFFER_RECEIVED

### API

- [x] `GET /api/app/growth-timeline` — 인증 필수, 타임라인 반환
- [x] `POST /api/app/growth-timeline` — 인증 + JSON 검증 + 이벤트 생성 (201)
- [x] `POST /api/app/growth-timeline/sync` — 인증 + 자동 수집 결과
- [x] `DELETE /api/app/growth-timeline/[id]` — 인증 + 소유권 + 삭제

### 워크스페이스 UI

- [x] `/app/growth-timeline` 페이지 정상 렌더링
- [x] 요약 카드 4개 (전체 이벤트, 최근 표시, 이벤트 유형, 활동 월수)
- [x] 활동 히트맵 (365일, 주 단위 그룹핑, 컬러 강도 5단계)
- [x] 월별 바 차트 (최근 12개월)
- [x] 이벤트 타입 분포 (퍼센트 바)
- [x] 성장 타임라인 리스트 (역순, 15건 초기 표시, 전체 보기)
- [x] 이벤트 추가 모달 (유형/제목/설명/발생일)
- [x] 자동 수집 버튼 (결과 메시지 표시)
- [x] 이벤트 삭제 버튼
- [x] AppSidebar "성장 타임라인" 메뉴 추가

### 테스트 (22개)

- [x] GROWTH_EVENT_TYPES 8개 정의 (1)
- [x] 모든 타입에 한국어 라벨 존재 (1)
- [x] GrowthTimelineServiceError 기본 생성 (1)
- [x] GrowthTimelineServiceError 필드 에러 포함 (1)
- [x] isGrowthTimelineServiceError true (1)
- [x] isGrowthTimelineServiceError false (1)
- [x] 유효한 입력 → 이벤트 생성 (1)
- [x] 빈 제목 → VALIDATION_ERROR (1)
- [x] 잘못된 이벤트 타입 → VALIDATION_ERROR (1)
- [x] 잘못된 날짜 형식 → VALIDATION_ERROR (1)
- [x] 제목 200자 초과 → VALIDATION_ERROR (1)
- [x] 설명 2000자 초과 → VALIDATION_ERROR (1)
- [x] 존재하지 않는 이벤트 → NOT_FOUND (1)
- [x] 다른 소유자 이벤트 삭제 → FORBIDDEN (1)
- [x] 정상 삭제 (1)
- [x] 기존 엔티티가 없으면 0개 생성 (1)
- [x] 기술 추가 시 SKILL_ADDED 이벤트 생성 (1)
- [x] 이미 동기화된 엔티티는 건너뜀 (1)
- [x] 여러 엔티티 복합 동기화 (1)
- [x] JOB_APPLIED 이벤트 생성 — appliedAt 사용 (1)
- [x] 이벤트 없음 → 빈 타임라인 (1)
- [x] 이벤트 있음 → 히트맵/타입 분포/월별 요약 포함 (1)

### T86 게이트 4종

- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (64 suites, 413 tests)
- [x] `npm run vercel-build` 통과

### Playwright 검증

- [x] 홈 페이지 200 정상 렌더링
- [x] 경력 페이지 200 정상
- [x] Sitemap 200 정상
- [x] Growth Timeline API 401 (인증 보호 — GET/POST/POST sync/DELETE)
- [x] Job Tracker API 401 (인증 보호)
- [x] `/app/growth-timeline` → 로그인 리다이렉트 정상

---

### 매 태스크 종료 시 공통

- [x] 게이트 4종 통과
- [x] Jest 테스트 22개 통과 (growth-timeline.test.ts)
- [x] Playwright 브라우저 테스트 6개 통과
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
