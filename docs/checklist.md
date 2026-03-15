# PoReSt 작업 검증 체크리스트

기준일: 2026-03-16
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T84 — 지원 이력 트래커 (칸반 + JD 매칭) ✅

---

### 스키마

- [x] CompanyTarget에 `jobDescriptionMd` (Text, nullable) 추가
- [x] CompanyTarget에 `appliedAt` (DateTime, nullable) 추가
- [x] CompanyTarget에 `matchScoreJson` (Json, nullable) 추가
- [x] CompanyTarget에 `events` relation 추가
- [x] `ApplicationEvent` 모델 신규 (companyTargetId, fromStatus, toStatus, note)
- [x] `@@index([companyTargetId, createdAt])` 인덱스
- [x] `prisma db push` 정상 반영
- [x] `prisma generate` 클라이언트 생성

### job-tracker 모듈

- [x] `interface.ts` — BoardCardDto, BoardColumnDto, BoardDto, ApplicationEventDto, JdMatchResult 타입
- [x] `interface.ts` — JobTrackerServiceError + isJobTrackerServiceError 타입 가드
- [x] `implementation.ts` — STATUS_ORDER 6개 상태, STATUS_LABELS 한국어
- [x] `implementation.ts` — statusChangeSchema Zod 검증
- [x] `implementation.ts` — jdMatchInputSchema Zod 검증 (1~50000자)
- [x] `getBoardForOwner()` — ownerId 필터 + 우선순위/수정일 정렬 + 상태별 그룹핑
- [x] `changeStatus()` — 소유권 검증 + 상태 업데이트 + ApplicationEvent 생성
- [x] `changeStatus()` — APPLIED 전이 시 appliedAt 자동 설정
- [x] `runJdMatch()` — input JD 저장 + 기존 JD 사용 분기
- [x] `runJdMatch()` — skill + experience 조회 + Gemini LLM 호출
- [x] `runJdMatch()` — matchScoreJson 결과 저장
- [x] `runJdMatch()` — JD 미등록 시 NO_JD(422) 에러
- [x] `getEventsForTarget()` — 소유권 검증 + createdAt desc 정렬
- [x] `withGeminiFallback()` — GEMINI_API_KEY 미설정 시 fallback
- [x] `buildFallbackMatch()` — 키워드 기반 기본 매칭

### JD 매칭 AI

- [x] `JD_MATCH_SYSTEM_PROMPT` — 한국어 커리어 컨설턴트 페르소나
- [x] `buildJdMatchPrompt()` — JD + 기술(카테고리) + 경력(재직중/techTags/summary)
- [x] `parseJdMatchResponse()` — JSON 추출 (코드블록/일반)
- [x] `parseJdMatchResponse()` — score 0~100 범위 보정
- [x] `parseJdMatchResponse()` — matchedSkills 최대 10개, gaps 최대 5개
- [x] `parseJdMatchResponse()` — summary 500자 제한
- [x] `parseJdMatchResponse()` — 파싱 실패 시 안전 기본값 반환

### API

- [x] `GET /api/app/job-tracker` — 인증 필수, Board 반환
- [x] `PATCH /api/app/job-tracker/[id]/status` — 인증 + JSON 검증 + 상태 변경
- [x] `POST /api/app/job-tracker/[id]/match` — 인증 + JD 입력 + 매칭 결과
- [x] `GET /api/app/job-tracker/[id]/events` — 인증 + 타임라인 반환

### company-targets 모듈 확장

- [x] `OwnerCompanyTargetDto` — jobDescriptionMd, appliedAt, matchScoreJson 추가
- [x] `CompanyTargetCreateInput` — jobDescriptionMd, appliedAt 추가
- [x] Zod create/update 스키마 — 새 필드 검증 추가
- [x] ownerCompanyTargetSelect — 새 필드 포함
- [x] mapOwnerDto — 새 필드 매핑
- [x] create/update 데이터 — 새 필드 Prisma 반영

### 칸반 보드 UI

- [x] `/app/job-tracker` 페이지 정상 렌더링
- [x] 상태별 6컬럼 칸반 레이아웃 (가로 스크롤)
- [x] 카드 표시: 회사, 직무, 우선순위, 태그(3개+), 매칭 점수, 지원일
- [x] 빈 보드 시 안내 메시지 + 기업 분석 링크
- [x] 카드 클릭 → 상세 모달
- [x] 모달: 상태 변경 버튼 + 메모 입력
- [x] 모달: JD 입력 + AI 매칭 분석 버튼
- [x] 모달: 매칭 결과 (점수, 일치 기술, 보완 필요, 요약)
- [x] 모달: 이벤트 타임라인 (상태 변경 이력)
- [x] 모달: 배경 클릭 닫기
- [x] AppSidebar "지원 트래커" 메뉴 추가

### 테스트 (22개)

- [x] parseJdMatchResponse 정상 JSON (1)
- [x] parseJdMatchResponse 코드블록 추출 (1)
- [x] parseJdMatchResponse score 100 초과 보정 (1)
- [x] parseJdMatchResponse score 음수 보정 (1)
- [x] parseJdMatchResponse matchedSkills 10개 제한 (1)
- [x] parseJdMatchResponse gaps 5개 제한 (1)
- [x] parseJdMatchResponse JSON 실패 기본값 (1)
- [x] parseJdMatchResponse 빈 문자열 기본값 (1)
- [x] parseJdMatchResponse 잘못된 구조 안전 처리 (1)
- [x] parseJdMatchResponse summary 500자 절삭 (1)
- [x] buildJdMatchPrompt 기술+경력 포함 (1)
- [x] buildJdMatchPrompt 기술/경력 없음 (1)
- [x] buildJdMatchPrompt JD 10000자 절삭 (1)
- [x] buildJdMatchPrompt 카테고리 없음 (1)
- [x] buildJdMatchPrompt 경력 techTags (1)
- [x] JD_MATCH_SYSTEM_PROMPT 한국어 (1)
- [x] JD_MATCH_SYSTEM_PROMPT 커리어 컨설턴트 (1)
- [x] JD_MATCH_SYSTEM_PROMPT JSON 형식 (1)
- [x] JobTrackerServiceError 생성 (1)
- [x] JobTrackerServiceError 필드 에러 (1)
- [x] isJobTrackerServiceError 타입 가드 (1)
- [x] CompanyTargetStatus 6개 정의 (1)

### T84 게이트 4종

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (62 suites, 359 tests)
- [x] `npm run vercel-build` 통과

---

### 매 태스크 종료 시 공통

- [x] 게이트 4종 통과
- [x] Jest 테스트 22개 통과 (job-tracker.test.ts)
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
