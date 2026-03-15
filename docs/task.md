# PoReSt 작업 상세 계획서

기준일: 2026-03-16
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T80-5 — AI 이력서 초안 ✅ 완료

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 이력서 생성 | 수동 생성 + 경력 항목 수동 추가 | Gemini LLM이 경력/스킬 분석 → 맞춤 초안 자동 생성 |
| 경력 선별 | 사용자가 수동 선택 | AI가 직무 관련도 기반 자동 선별 (2~5개) |
| 성과 커스터마이즈 | 수동 override 작성 | LLM이 직무 맞춤 STAR 기법 성과 재구성 |
| 요약문 | 사용자가 직접 작성 | AI가 직무 맞춤 자기소개 자동 생성 |
| Fallback | 없음 | GEMINI_API_KEY 미설정 → 공개 경력 자동 포함 |

### 핵심 변경

1. **시스템 프롬프트** — `RESUME_DRAFT_SYSTEM_PROMPT` (이력서 작성 전문 컨설턴트 페르소나)

2. **프롬프트 빌더** — `buildResumeDraftPrompt()`
   - 보유 경력 전체 (인덱스 번호 부여)
   - 보유 기술 (카테고리별 그룹)
   - 지원 정보 (회사/직무/레벨)
   - 채용 공고 (JD) 선택적 포함
   - JSON 출력 형식 지시 (summaryMd + selectedExperiences)

3. **LLM 응답 파서** — `parseResumeDraftResponse()`
   - 코드 블록/앞뒤 텍스트 자동 추출
   - 경력 인덱스 매핑 (1-based → experienceId)
   - 중복 경력 방지, 유효하지 않은 인덱스 필터링
   - overrideBullets/Metrics/TechTags/notes 파싱

4. **Fallback** — `buildFallbackResumeDraft()`
   - PUBLIC 경력만 선택, featured → current → 최신 순 정렬
   - 최대 5개, override 없이 원본 경력 참조

5. **서비스 로직** — `generateResumeDraft()`
   - 경력/스킬 조회 → 프롬프트 빌드 → LLM 호출 → 파싱
   - Resume + ResumeItems 순차 생성
   - `withGeminiFallback()` 패턴 적용

6. **API 엔드포인트** — `POST /api/app/resumes/draft`
   - 인증 필수, targetCompany/targetRole/level/jobDescription 입력
   - 201 Created → OwnerResumeDetailDto 반환

7. **워크스페이스 UI** — "AI 초안 생성" 버튼 + 입력 모달
   - 지원 회사/직무/레벨/채용 공고 입력 폼
   - 생성 완료 시 편집 페이지로 자동 리다이렉트

### 변경 파일 목록

**수정:**
- `src/modules/resumes/interface.ts` — `ResumeDraftInput`, `ResumeDraftPrismaClient` 타입 추가
- `src/modules/resumes/implementation.ts` — AI 이력서 초안 생성 전체 로직
- `src/app/(private)/app/resumes/ResumesPageClient.tsx` — AI 초안 버튼 + 모달 UI
- `src/app/(private)/app/resumes/__tests__/resumes-page-client.test.tsx` — useRouter mock
- `src/app/(private)/app/projects/__tests__/light-theme-contrast.test.tsx` — useRouter mock

**신규:**
- `src/app/api/app/resumes/draft/route.ts` — AI 초안 API 엔드포인트
- `src/modules/resumes/tests/resume-draft.test.ts` — 32개 테스트

### 완료 기준

- [x] `generateResumeDraft()` — Gemini LLM 호출 + fallback 패턴
- [x] `RESUME_DRAFT_SYSTEM_PROMPT` — 이력서 작성 전문가 페르소나
- [x] `buildResumeDraftPrompt()` — 경력/스킬/JD 프롬프트 빌더
- [x] `parseResumeDraftResponse()` — JSON 파서 (인덱스 매핑 + 검증)
- [x] `buildFallbackResumeDraft()` — 공개 경력 기반 기본 초안
- [x] `generateDraftTitle()` — 자동 제목 생성
- [x] GEMINI_API_KEY 미설정 → fallback 즉시 실행
- [x] LLM retryable 에러 → fallback 자동 전환
- [x] JD 포함 시 직무 맞춤 최적화
- [x] POST `/api/app/resumes/draft` API 엔드포인트
- [x] 이력서 목록 페이지 "AI 초안 생성" 버튼 + 모달
- [x] 테스트 32개 통과
- [x] 게이트 4종 통과

### 게이트

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (60 suites, 324 tests)
- [x] `npm run vercel-build` 통과
- [x] push 완료 (`4059e70`)

---

## T80-6 — 자동 후보 엣지 ✅ 완료

(병렬 세션에서 완료, 커밋 `976317b`)

---

## 다음 태스크: M8 종결 → T83/T84

M8 (AI 기능 고도화) 완료:
- T80-1~6 전체 완료
- T83: 엔티티 연결 (Experience ↔ Project ↔ Skill)
- T84: 지원 이력 트래커 (칸반 + JD 매칭)
