# PoReSt 전체 작업 계획서

기준일: 2026-03-15
문서 정의: 프로젝트 비전·마일스톤·로드맵·아키텍처 결정·게이트를 관리하는 단일 기준 문서
관련 문서: `task.md`(현재 태스크 상세), `checklist.md`(검증 체크리스트), `history.md`(완료 이력·맥락)

---

## 1) 비전과 전략

### 1.1 비전

PoReSt는 공개 포트폴리오(`/portfolio/[publicSlug]`)와 개인 워크스페이스(`/app`)를 통합한 **개인 개발자 OS**다.

- Public/Private 경계를 라우팅과 API에서 동시에 강제
- AI 기반 지식 관리 + 채용 지원 + 커리어 관리 기능 포함
- 노트 → AI 평가 → 임베딩 → 경력/프로젝트 연결 → 포트폴리오 자동 풍성화 → JD 맞춤 이력서 파이프라인

### 1.2 제품 전략

**Dogfooding → 확장** 전략을 채택한다.

1. **현재**: 본인이 직접 사용하며 기능 완성 + 실사용 검증
2. **M8 완료 시점**: 멀티유저 확장 여부 판단 (AI 파이프라인 완성 = 판단 가능한 최소 제품)
3. **확장 결정 시**: M11(커스텀 도메인 + 멀티유저 인프라) 진입

### 1.3 성공 기준 (KPI)

- 신규 사용자 5분 내 공유 URL 발행
- owner scope 격리 위반 0건
- 릴리스 게이트 4종(`lint`, `build`, `jest`, `vercel-build`) 연속 통과
- 운영 장애 시 `x-request-id` 기반 역추적 가능
- AI 기능: 환경변수 미설정 시 graceful fallback
- 포트폴리오 방문 분석 데이터 수집 가능 (M9 이후)

---

## 2) 마일스톤 체계

### M6. 안정화 완결 ✅

- Audit API/Notes/Projects 이벤트 표준화, writeAuditLog 관측성 개선

### M7. 포트폴리오 채용 가치 고도화 — T76~T79

- T76~T77 ✅: HR 직결 기능 + SEO
- T78 ✅: 경력 전용 공개 페이지 + 기술 스택 섹션
- T79 ✅: 포트폴리오 커스텀 레이아웃

### M8. AI 기능 고도화 — T80

- Gemini API 연동 (임베딩 자동화 + 노트 AI 평가 + HR 피드백 + 이력서 초안)
- pgvector 기반 자동 후보 엣지 생성

### M9. 데이터·인사이트 — T82, T83

- T82 ✅: 포트폴리오 방문 분석 (PageView 모델 + 대시보드)
- T83: 엔티티 연결 (Experience ↔ Project ↔ Skill 관계)

### M10. 커리어 관리 — T84, T85, T86

- T84: 지원 이력 트래커 (칸반 + JD 매칭)
- T85: 추천서/동료 평가 (공유 링크 → 비로그인 작성 → 승인 후 공개)
- T86: 성장 타임라인 (자동 수집 + 히트맵)

### M11. 확장 준비 — T87, T81

- T87: 커스텀 도메인 (유료화 경계)
- T81: 블로그 외부 연동 (우선순위 하향 — OAuth 유지보수 비용 대비 가치 낮음)

---

## 3) 실행 로드맵

### Wave5 — Productization (M7)

| Phase | 태스크 | 상태 |
|---|---|---|
| Phase 1 | T76 (HR 직결), T77 (SEO) | ✅ 완료 |
| Phase 2 | T78 (경력+기술 스택) | ✅ 완료 |
| Phase 2 | T79 (커스텀 레이아웃) | ✅ 완료 |

**T78 병렬 실행 구조**:

```
Session A (Skill 트랙)     Session B (Experience 트랙)
─────────────────────      ──────────────────────────
G2: Skill 모듈+API         G6: bullets/metrics 편집 UI
        ↓                  G1: 경력 공개 페이지
G3: Skills 워크스페이스 UI          ↓
G4: 포트폴리오 Skills 섹션  G5: 포트폴리오 경력 개선
                           G7: Sitemap 업데이트
─────────────────────      ──────────────────────────
        ↘          통합 게이트          ↙
```

---

### Wave5→6 Bridge

**T79 ∥ T82 병렬 완료** ✅

| Session A | Session B |
|---|---|
| T79: 커스텀 레이아웃 ✅ | T82: 방문 분석 ✅ |
| layoutJson 활성화 + 섹션 순서 UI | PageView 모델 + 대시보드 |

---

### Wave6 — AI Growth (M8)

**T80 내부 병렬 구조**:

```
T80-1: Gemini 클라이언트 모듈 (직렬, 기반)
           ↓
    ┌──────┼──────┐
    ↓      ↓      ↓
  T80-2  T80-3  T80-4    ← 3개 병렬 가능
  임베딩  노트AI  HR피드백
    ↓             ↓
  T80-6         T80-5
  후보엣지      이력서초안
```

---

### Wave7 — Data & Insights (M9)

**T83 ∥ T84 병렬 가능**

| Session A | Session B |
|---|---|
| T83: 엔티티 연결 | T84: 지원 이력 트래커 |
| Experience↔Project↔Skill 관계 모델 | JobApplication 모델 + 칸반 UI |

---

### Wave8 — Career Management (M10)

**T85 ∥ T86 병렬 가능**

| Session A | Session B |
|---|---|
| T85: 추천서/동료 평가 | T86: 성장 타임라인 |
| Testimonial 모델 + 공유 링크 | GrowthEvent 자동 수집 + 히트맵 |

---

### 🔶 확장 판단 시점 (M10 완료 후)

> "이 제품을 남도 쓰게 할 만한가?"

판단 기준: 본인 실사용 만족도, 기능 완성도, 유지보수 비용 감당 가능 여부

---

### Wave9 — Expansion (M11)

| 태스크 | 내용 | 비고 |
|---|---|---|
| T87 | 커스텀 도메인 | 유료화 자연스러운 경계 |
| T81 | 블로그 외부 연동 | Optional — OAuth 유지보수 부담 |

확장 결정 시 추가 필요: 멀티유저 온보딩, 과금(Stripe), 개인정보처리방침, Rate limiting

---

## 4) 태스크 실행 큐

### 전체 의존성 그래프

```
T52 ✅ → T76~G ✅ → T77 ✅ → T78 ✅
                                   ↓
                              T79 ─┬─ T82    ← 병렬 가능
                                   ↓
                              T80-1
                           ┌───┼───┐
                         T80-2 T80-3 T80-4   ← 병렬 가능
                           ↓         ↓
                         T80-6     T80-5
                                   ↓
                              T83 ─┬─ T84    ← 병렬 가능
                                   ↓
                              T85 ─┬─ T86    ← 병렬 가능
                                   ↓
                            [확장 판단]
                                   ↓
                              T87, T81
```

### 태스크 상세 목록

| ID | 핵심 내용 | 선결 조건 | 병렬 대상 |
|---|---|---|---|
| T78 | 경력 페이지 + 기술 스택 ✅ | T77 ✅ | 내부 G1~G7 병렬 |
| T79 | 커스텀 레이아웃 ✅ | T78 ✅ | T82 |
| T82 | 포트폴리오 방문 분석 ✅ | T78 ✅ | T79 |
| T80-1 | Gemini 클라이언트 ✅ | T79+T82 ✅ | — |
| T80-2 | 임베딩 자동화 ✅ | T80-1 ✅ | T80-3, T80-4 |
| T80-3 | 노트 AI 평가 ✅ | T80-1 ✅ | T80-2, T80-4 |
| T80-4 | HR 피드백 LLM ✅ | T80-1 ✅ | T80-2, T80-3 |
| T80-5 | AI 이력서 초안 | T80-4 | — |
| T80-6 | 자동 후보 엣지 ✅ | T80-2 ✅ | — |
| T83 | 엔티티 연결 | M8 완료 | T84 |
| T84 | 지원 이력 트래커 | M8 완료 | T83 |
| T85 | 추천서/동료 평가 | M9 완료 | T86 |
| T86 | 성장 타임라인 | M9 완료 | T85 |
| T87 | 커스텀 도메인 | 확장 판단 | — |
| T81 | 블로그 외부 연동 | 확장 판단 | Optional |

---

## 5) AI 아키텍처 결정 사항

### 5.1 모델 선택

| 용도 | 모델 | 비고 |
|---|---|---|
| 임베딩 생성 | Gemini `text-embedding-004` | 1536차원 — NoteEmbedding 호환 |
| 노트 AI 평가 | Gemini `gemini-2.0-flash` | 한국어, 비용 효율 |
| HR 피드백 | Gemini `gemini-2.0-flash` | HR 10년차 페르소나 |
| 이력서 초안 | Gemini `gemini-2.0-flash` | JD 매칭 최적화 |
| Fallback | deterministic 벡터 / regex | GEMINI_API_KEY 미설정 시 |

### 5.2 환경변수

- `GEMINI_API_KEY`: Google AI Studio 발급, Vercel Preview+Production 등록

### 5.3 노트 AI 평가 아키텍처

```
POST /api/app/feedback/:id/run
  → FeedbackService.runFeedbackRequestForOwner()
  → buildNoteFeedbackItems()  ← regex → Gemini LLM 교체
  → Gemini gemini-2.0-flash 호출
  → FeedbackItem[] 저장
```

### 5.4 임베딩 자동화 아키텍처

```
createNote/updateNote() 완료 후
  → queueEmbeddingForNote(noteId) [비동기 fire-and-forget]
    → Gemini text-embedding-004
    → NoteEmbedding UPSERT
    → findSimilarNotes() (pgvector)
    → NoteEdge CANDIDATE 자동 INSERT
```

---

## 6) 게이트 및 릴리스 규칙

### 6.1 고정 게이트 (매 태스크 완료 시)

1. `npm run lint`
2. `npm run build`
3. `npx jest --runInBand`
4. `npm run vercel-build`

### 6.2 환경변수

- 기본: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, OAuth env
- T80 이후: `GEMINI_API_KEY` (미설정 시 fallback)
- 테스트: `DATABASE_URL_TEST`

### 6.3 AI 기능 테스트 전략

- Jest: Gemini 클라이언트 mock
- CI: fallback 경로 자동 전환
- 실제 API: 수동 통합 테스트 (로컬)

### 6.4 병렬 세션 게이트 규칙

- 병렬 세션 각각은 독립적으로 lint/build 통과 확인
- 통합 시점에 전체 게이트 4종 재실행
- jest 기준선은 태스크 완료 시마다 갱신 (현재: 59 suites, 292 tests)

---

## 7) 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| Gemini API 비용 | T80 이후 | debounce, 최신 저장 시만 실행 |
| Gemini API 불안정 | T80 이후 | try/catch, status=FAILED, 재시도 버튼 |
| 환경변수 미설정 | T80 이후 | 기존 regex/deterministic fallback 유지 |
| 스키마 마이그레이션 | 전 구간 | Prisma migrate + 백업 확인 |
| 임베딩 벡터 drift | T80-2 이후 | PENDING 상태 + 수동 rebuild 버튼 |
| 외부 플랫폼 OAuth 정책 변경 | T81 | 우선순위 최하향, Optional 처리 |
| "완벽" 기준 상승 함정 | 전 구간 | M8 완료를 확장 판단 마감으로 고정 |

---

## 8) TDD 실행 큐

### 완료

- [x] Test-M6-01 ~ Test-M6-13

### M7 (T76~T79)

- [ ] Test-M7-01: PortfolioSettings email/location CRUD API
- [ ] Test-M7-02: PortfolioLink type 필드 저장/조회
- [ ] Test-M7-03: `/sitemap.xml` 공개 포트폴리오 URL 포함
- [ ] Test-M7-04: OG Image 이미지 콘텐츠 타입 반환
- [ ] Test-M7-05: `/portfolio/[slug]/experiences` 렌더링
- [ ] Test-M7-06: Skill CRUD API 소유권 격리
- [ ] Test-M7-07: layoutJson 섹션 순서 저장/조회

### M8 (T80)

- [x] Test-M8-01: Gemini mock 임베딩 성공/실패
- [x] Test-M8-02: NOTE FeedbackRequest → FeedbackItem 생성 (LLM mock)
- [x] Test-M8-03: GEMINI_API_KEY 미설정 → fallback 경로
- [x] Test-M8-04: PORTFOLIO/RESUME FeedbackRequest LLM mock
- [ ] Test-M8-05: AI 이력서 초안 API 입력 검증
- [x] Test-M8-06: NoteEdge CANDIDATE 자동 생성

### M9 (T82~T83)

- [ ] Test-M9-01: PageView 기록 API + 집계 쿼리
- [ ] Test-M9-02: 엔티티 연결 관계 CRUD + 포트폴리오 표시

### M10 (T84~T86)

- [ ] Test-M10-01: JobApplication CRUD + 상태 전이
- [ ] Test-M10-02: Testimonial 공유 링크 → 작성 → 승인 플로우
- [ ] Test-M10-03: GrowthEvent 자동 수집 + 조회

---

## 9) 확장 판단 기준 (M10 완료 시점)

### 판단 항목

| 질문 | 확장 진행 기준 |
|---|---|
| 본인이 매일 쓰고 있는가? | 주 5회 이상 접속 |
| 포트폴리오 외부 조회가 있는가? | 월 50회 이상 방문 (T82 데이터) |
| 타인이 쓰고 싶다고 요청했는가? | 1명 이상 자발적 요청 |
| 유지보수 비용 감당 가능한가? | Vercel + DB 비용 월 $20 이하 |

### 확장 시 추가 구현 필요

- 멀티유저 온보딩 위저드
- 과금 시스템 (Stripe/토스페이먼츠)
- 개인정보처리방침, 이용약관
- Rate limiting, 어뷰징 방지
- 성능 최적화 (DB 커넥션 풀)
