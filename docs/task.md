# PoReSt 작업 상세 계획서

기준일: 2026-03-16
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T84 — 지원 이력 트래커 (칸반 + JD 매칭) ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 기업 분석 카드 관리 | 리스트 형태 CRUD | 칸반 보드(상태별 컬럼) |
| JD 저장 | 미지원 | CompanyTarget에 jobDescriptionMd 필드 |
| JD 매칭 분석 | 미지원 | Gemini LLM으로 보유 기술/경력 ↔ JD 적합도 분석 |
| 상태 변경 이력 | 미지원 | ApplicationEvent 모델로 타임라인 추적 |
| 지원일 기록 | 미지원 | appliedAt 자동/수동 기록 |
| AI Fallback | 미지원 | 키워드 기반 기본 매칭 |

### 핵심 변경

1. **Prisma 스키마 확장**
   - `CompanyTarget`: `jobDescriptionMd`, `appliedAt`, `matchScoreJson` 추가
   - `ApplicationEvent` 모델 신규 (fromStatus, toStatus, note, createdAt)

2. **job-tracker 모듈** (`src/modules/job-tracker/`)
   - `getBoardForOwner()` — 상태별 그룹핑 칸반 보드 쿼리
   - `changeStatus()` — 상태 변경 + ApplicationEvent 자동 생성
   - `runJdMatch()` — Gemini LLM JD 매칭 + fallback
   - `getEventsForTarget()` — 타임라인 조회

3. **JD 매칭 AI**
   - `JD_MATCH_SYSTEM_PROMPT` — 10년+ 커리어 컨설턴트 페르소나
   - `buildJdMatchPrompt()` — JD + 기술/경력 프롬프트 빌더
   - `parseJdMatchResponse()` — score/matchedSkills/gaps/summary 파서
   - `buildFallbackMatch()` — 키워드 기반 기본 매칭

4. **API 라우트**
   - `GET /api/app/job-tracker` — 칸반 보드 데이터
   - `PATCH /api/app/job-tracker/[id]/status` — 상태 변경 + 이벤트
   - `POST /api/app/job-tracker/[id]/match` — JD 매칭 실행
   - `GET /api/app/job-tracker/[id]/events` — 이벤트 타임라인

5. **칸반 보드 UI** (`/app/job-tracker`)
   - 상태별 6컬럼 (관심→지원→면접→오퍼→탈락→보관)
   - 카드: 회사, 직무, 우선순위, 태그, 매칭 점수, 지원일
   - 상세 모달: 상태 변경, JD 매칭, 이벤트 타임라인

6. **company-targets 모듈 확장**
   - DTO에 jobDescriptionMd, appliedAt, matchScoreJson 추가
   - Zod 스키마에 새 필드 검증 추가

### 변경 파일 목록

**수정:**
- `prisma/schema.prisma` — CompanyTarget 확장 + ApplicationEvent 모델
- `src/modules/company-targets/interface.ts` — DTO + Input 타입 확장
- `src/modules/company-targets/implementation.ts` — Zod, Select, 매핑 확장
- `src/components/app/AppSidebar.tsx` — "지원 트래커" 메뉴 추가

**신규:**
- `src/modules/job-tracker/interface.ts` — Board/Event/Match 타입 정의
- `src/modules/job-tracker/implementation.ts` — 서비스 구현 + JD 매칭
- `src/modules/job-tracker/http.ts` — 에러 응답 헬퍼
- `src/modules/job-tracker/index.ts` — 공개 API export
- `src/app/api/app/job-tracker/route.ts` — Board GET
- `src/app/api/app/job-tracker/[id]/status/route.ts` — PATCH status
- `src/app/api/app/job-tracker/[id]/match/route.ts` — POST match
- `src/app/api/app/job-tracker/[id]/events/route.ts` — GET events
- `src/app/(private)/app/job-tracker/page.tsx` — 칸반 보드 UI
- `src/modules/job-tracker/tests/job-tracker.test.ts` — 22개 테스트

### 게이트

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (62 suites, 359 tests)
- [x] `npm run vercel-build` 통과
- [x] push 완료 (`92ab4d5`)

---

## T83 — 엔티티 연결 (Experience ↔ Project ↔ Skill) ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 엔티티 연결 | DomainLink에 PROJECT/EXPERIENCE만 지원 | SKILL 추가 + 양방향 조회 + 공개 조회 |
| 포트폴리오 표시 | 경력/프로젝트 독립 표시 | 경력→관련 프로젝트 링크 표시 |
| 워크스페이스 UI | SKILL 옵션 없음 | SKILL 선택 + 연결 관리 |
| 공개 API | 없음 | GET /api/public/entity-links?slug= |

### 핵심 변경

1. **DomainLinkEntityType에 SKILL 추가**
   - Prisma 스키마 enum 확장 + `ensureEntityOwnedByOwner` SKILL case
   - `DomainLinkServicePrismaClient`에 `skill`, `portfolioSettings` 추가

2. **양방향 조회** — `listBidirectionalLinksForOwner()`
   - OR 조건으로 source/target 양쪽 매칭

3. **공개 엔티티 링크 조회**
   - `listPublicLinksForOwner(publicSlug)` — PROJECT/EXPERIENCE/SKILL 링크만
   - `listPublicLinksForEntity(publicSlug, entityType, entityId)` — 특정 엔티티

4. **Public API** — `GET /api/public/entity-links?slug=`
   - 비인증 공개 포트폴리오 엔티티 연결 조회

5. **Private API 확장** — entityType+entityId 양방향 조회 파라미터

6. **포트폴리오 표시**
   - 홈/경력 페이지에 "관련 프로젝트:" 링크 pill 표시
   - DomainLinkEntityType enum 사용 (Prisma 런타임 호환)

7. **워크스페이스 UI** — domain-links 페이지에 SKILL 타입 옵션 추가

### 변경 파일 목록

**수정:**
- `src/modules/domain-links/interface.ts` — PublicEntityLinkDto, 양방향/공개 조회 메서드
- `src/modules/domain-links/implementation.ts` — SKILL case + 3개 신규 메서드
- `src/app/api/app/domain-links/route.ts` — 양방향 조회 파라미터
- `src/app/(private)/app/domain-links/page.tsx` — SKILL 옵션
- `src/app/(public)/portfolio/[publicSlug]/page.tsx` — 엔티티 연결 표시
- `src/app/(public)/portfolio/[publicSlug]/experiences/page.tsx` — 관련 프로젝트

**신규:**
- `src/app/api/public/entity-links/route.ts` — 공개 API
- `src/modules/domain-links/tests/entity-links.test.ts` — 13개 테스트

### 게이트

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (62 suites, 359 tests)
- [x] `npm run vercel-build` 통과
- [x] push 완료 (`eaa1a24`)

---

## 다음 태스크

- T85: 추천서/동료 평가 (M10)
- T86: 성장 타임라인 (M10)
