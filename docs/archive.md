# PoReSt 아카이브

기준일: 2026-03-22
문서 정의: 차후 계획에 편입할 아이디어, 현재 기술적 해결이 불가능한 이슈, 우선순위 하향된 기능을 기록하는 보관 문서.
관련 문서: `plan.md`(전체 계획), `task.md`(현재 태스크), `history.md`(완료 이력)

---

## 기록 원칙

1. 보관 사유를 반드시 기재 (왜 지금 안 하는가)
2. 복귀 조건을 명시 (어떤 상황이 되면 다시 꺼내는가)
3. 관련 태스크 ID 연결

---

## 확장 관련 (M11 보류)

### T87: 커스텀 도메인

- **내용**: 사용자별 커스텀 도메인 연결 (유료화 경계)
- **보관 사유**: 확장 판단 결과 보류 — 유지보수 비용 감당 불가, 외부 조회 트래픽 부재, 포트폴리오 미완성
- **복귀 조건**: 포트폴리오 프로덕션 레벨 완성 + 외부 트래픽 월 50회 이상 + 비용 구조 개선
- **관련**: M11, 멀티유저 온보딩, Stripe 과금

### 멀티유저 확장 인프라

- **내용**: 멀티유저 온보딩 위저드, 과금(Stripe/토스페이먼츠), 개인정보처리방침, Rate limiting
- **보관 사유**: 싱글유저 dogfooding 단계에서 불필요
- **복귀 조건**: T87 복귀와 동시

---

## 기능 보류

### T81: 블로그 외부 연동

- **내용**: Medium, Dev.to, Velog, Tistory OAuth 연동 + 자동 크로스포스팅
- **보관 사유**: OAuth 유지보수 비용 > 기능 가치, 포트폴리오/이력서 우선
- **복귀 조건**: 포트폴리오 프로덕션 완성 후 블로그 활용 수요 발생 시

### 노트 지식그래프 고도화

- **내용**: 지식그래프 시각화 개선, 엣지 자동 확정 로직, 그래프 기반 추천
- **보관 사유**: 포트폴리오/이력서 우선. 노트 기능 자체는 동작하지만 현재 우선순위 아님
- **복귀 조건**: 포트폴리오 완성 후 일상 사용 빈도가 높아질 때

### 블로그 포트폴리오 통합

- **내용**: 포트폴리오 레이아웃에 blog 섹션 추가, 공개 블로그 페이지
- **보관 사유**: 블로그 콘텐츠 미작성 상태, 포트폴리오/이력서 우선
- **복귀 조건**: 블로그 글 5개 이상 작성 후

### 기업 분석 (Job Tracker) 고도화 — 복귀 조건 충족, Sprint 5 후보

- **내용**: JD 매칭 정밀화, 기업 리서치 자동화, 면접 준비 기능
- **보관 사유**: 기본 칸반 + JD 매칭은 동작. Sprint 4 성능+자소서 우선
- **복귀 조건**: 실제 구직 활동 시작 시 → **✅ 충족 (2026-03-19)**
- **비고**: Sprint 4 범위 과다로 보류. Sprint 5 1순위 후보

---

## T96 코드 리뷰 보류 항목 (2026-03-19)

### AppShellWrapper 다크모드 FOUC (P2)

- **내용**: `useState(false)` → `useEffect`에서 `localStorage` 읽기 패턴으로 인해 다크모드 사용자에게 light→dark 깜빡임(FOUC) 발생
- **위치**: `src/components/app/AppShellWrapper.tsx:14-18`
- **보관 사유**: SSR 초기값 결정 구조를 바꿔야 함 (cookie 기반 또는 `<script>` inline). 체감 속도에는 영향 있지만 기능 정상 동작. T96 범위 초과
- **복귀 조건**: 체감 속도 2차 최적화 시 또는 사용자 불만 접수 시
- **대응 방향**: (1) cookie에 theme 저장 → SSR에서 읽기, (2) `<head>` inline script로 `data-theme` 사전 적용
- **관련**: T95 진단, T96 코드 리뷰

### dark: 접두사 이중 적용 방침 (P3)

- **내용**: loading.tsx에서 `bg-black/10 dark:bg-white/10`처럼 명시적 `dark:` 접두사를 사용하는데, `globals.css`에서 `[data-theme="dark"] .bg-black\/10`으로 동일 오버라이드가 이미 존재. 두 접근 방식이 혼재
- **보관 사유**: 기능적 충돌 없음 (동일 값). 코드 컨벤션 정리 수준의 이슈
- **복귀 조건**: 신규 개발자 온보딩 시 또는 다크모드 관련 버그 발생 시
- **대응 방향**: 문서화 — "globals.css 글로벌 오버라이드에 의존하되, skeleton pulse 색상은 방어적으로 `dark:` 명시" 규칙 확정
- **관련**: T96 코드 리뷰

---

## T97 코드 리뷰 보류 항목 (2026-03-19)

### 프롬프트 내 합격 자소서 본문 길이 상수화 (P2, C3)

- **내용**: `buildCoverLetterPrompt()`에서 합격 자소서 본문을 `slice(0, 3000)`으로 포함. 5개 × 3000 = 15000자. Gemini 토큰 한도 대비 프롬프트가 커질 수 있음. `MAX_REF_CONTENT_LENGTH` 상수화 + 총량 제한 필요
- **보관 사유**: 현재 합격 자소서 0개 상태이므로 실질 영향 없음
- **복귀 조건**: 합격 자소서 5개 이상 축적 시 또는 Gemini 토큰 초과 에러 발생 시
- **관련**: T97 코드 리뷰 C3

### `$executeRawUnsafe` → `Prisma.sql` 전환 (P2, E1)

- **내용**: `cover-letter-embeddings`와 `note-embeddings` 모두 벡터 UPDATE에 `$executeRawUnsafe` + 문자열 보간 사용. `Prisma.sql` 템플릿으로 전환 권장
- **보관 사유**: 벡터는 `number[].join(",")` 결과이므로 현재 안전. pgvector 파라미터화 제약
- **복귀 조건**: Prisma에서 pgvector 파라미터 지원 추가 시 또는 보안 감사 시
- **관련**: T97 코드 리뷰 E1, note-embeddings 동일 패턴

### rebuildForOwner 직렬 → 병렬 배치 처리 (P3, E3)

- **내용**: `rebuildForOwner`에서 `for...of` 직렬 실행. 합격 자소서 100개면 Gemini API 100회 직렬 호출
- **보관 사유**: 현재 합격본 수 소규모 예상 (10개 미만). 병렬화 시 rate-limit 위험
- **복귀 조건**: 합격본 20개 이상 축적 시
- **관련**: T97 코드 리뷰 E3

### CRUD findFirst+update 2쿼리 → 1쿼리 최적화 (P3, C2)

- **내용**: update/delete/toggleReference에서 findFirst(소유권 확인) + update 2회 쿼리. `updateMany({ where: { id, ownerId } })` + rowCount 체크로 1회 가능
- **보관 사유**: 성능 영향 미미 (단건 조회). 기존 모듈 패턴과 일관성 유지
- **복귀 조건**: DB 쿼리 병목 프로파일링 시
- **관련**: T97 코드 리뷰 C2

### resumeId/experienceId FK 관계 미선언 (P3, S1)

- **내용**: CoverLetter 모델의 `resumeId`, `experienceId`에 `@relation` 없음. DB 레벨 참조 무결성 없이 String만 존재
- **보관 사유**: 의도적 loose coupling — 이력서/경력 삭제 시 자소서까지 cascade 삭제되는 것 방지
- **복귀 조건**: 데이터 정합성 이슈 발생 시
- **관련**: T97 코드 리뷰 S1

### generateCoverLetter 통합 테스트 부재 (P3, T1)

- **내용**: Gemini 호출 → RAG 검색 → 저장까지의 E2E 흐름이 단위 테스트에 포함되지 않음
- **보관 사유**: 서비스 단위 테스트 37개로 각 함수별 커버리지 충분. 통합 테스트는 mock 복잡도 높음
- **복귀 조건**: 커버리지 목표 80% 미달 시 또는 AI 생성 관련 리그레션 발생 시
- **관련**: T97 코드 리뷰 T1

---

## 기술적 이슈

### Gemini API 비용 최적화

- **내용**: 임베딩/피드백 호출 debounce, 캐싱, 배치 처리
- **현재 상태**: 기본 fire-and-forget으로 동작. 비용 모니터링 미구축
- **보관 사유**: 현재 호출 빈도가 낮아 비용 이슈 미발생
- **복귀 조건**: Gemini API 비용이 월 $5 초과 시

### TDD 미완료 항목 (부분 복귀)

- **복귀 완료 (T91 ✅)**: Test-M7-01~07 (Skills 통합 테스트), Test-M9-01 (PageViews 통합 테스트)
  - 복귀 조건 충족: M11-P 완료 (2026-03-18)
  - T91 완료: 2026-03-18 — Skills 27개 + PageViews 26개 = 53개 신규 테스트
  - 최종 기준선: 69 suites, 482 tests

- **잔여 (부분 테스트 존재, 보류)**:
  - gemini: client.test.ts 존재 → implementation.integration.test.ts 미작성
  - growth-timeline: growth-timeline.test.ts 존재 → implementation.integration.test.ts 미작성
  - job-tracker: job-tracker.test.ts 존재 → implementation.integration.test.ts 미작성
  - testimonials: testimonials.test.ts 존재 → implementation.integration.test.ts 미작성
- **보관 사유**: 부분 테스트로 기본 커버리지 확보됨. T91 완료로 핵심 빈틈 해소
- **복귀 조건**: 커버리지 목표 80% 미달 시

---

## 아이디어 (미검증)

### 포트폴리오 A/B 테스트

- 레이아웃/색상 변형 → 방문 분석과 연동하여 전환율 비교
- 복귀 조건: 방문 트래픽 충분할 때

### AI 자기소개서 생성 — **복귀 완료 (T97~T98)**

- 경력/프로젝트 데이터 기반 자기소개서 자동 초안
- 복귀 조건 충족: 이력서 AI 초안 (T80-5) 안정화 완료 (2026-03-16)
- → Sprint 4 T97(RAG 파이프라인) + T98(생성 API+UI)로 이관 (2026-03-19)
- **확장**: 단순 생성 → 합격 자소서 RAG 기반 프롬프팅으로 고도화

### 포트폴리오 PDF CSS 직렬화 개선

- **내용**: ThemeWrapper의 PDF 다운로드 시 `document.styleSheets` → `cssRules` 직렬화 방식이 cross-origin 스타일시트에서 실패. 현재 Vercel 동일 도메인이라 동작하지만, CDN 분리 시 Tailwind CSS 규칙 누락 가능
- **보관 사유**: 현재 Vercel 배포 환경에서는 정상 동작. 즉시 수정 불필요
- **복귀 조건**: CDN 설정 변경 또는 PDF 출력 스타일 누락 리포트 발생 시
- **대응 방향**: 인라인 CSS fallback 추가 또는 서버사이드 PDF 생성(Puppeteer) 전환 검토
- **관련**: ThemeWrapper.tsx:34-41, T76-G (PDF 다운로드 수정)

### 포트폴리오 템플릿 시스템

- 디자인 템플릿 선택 (현재는 단일 디자인)
- 복귀 조건: 멀티유저 확장 결정 시

---

## Sprint 5 제외 항목 (M14 — 코드 스플리팅, 2026-03-22)

### 서버/클라이언트 경계 재설계

- **내용**: GrowthTimeline, CoverLetters 등 혼합 컴포넌트의 서버/클라이언트 분리
- **보관 사유**: 아키텍처 변경 — 리팩토링 Sprint에서 부적합 (상태 흐름 재설계 필요)
- **복귀 조건**: Sprint 5 완료 후 추가 최적화 필요 시
- **관련**: T100, T101

### next/Image 일관 적용

- **내용**: 포트폴리오 아바타 등 일반 `<img>` 태그를 next/Image로 전환
- **보관 사유**: 이미지 사용 적음, 체감 영향 미미
- **복귀 조건**: 이미지 콘텐츠 증가 또는 Lighthouse 이미지 점수 저하 시

### blog edit 컴포넌트 분할 (615줄)

- **내용**: `blog/[id]/edit/page.tsx` 615줄 단일 파일 분할
- **보관 사유**: T101에서 상위 2개(resume edit 1,330줄, settings 980줄)만 대상, 범위 제한
- **복귀 조건**: T101 완료 후 추가 분할 효과 확인 시

### ShareLinksSection lazy mount

- **내용**: `resumes/[id]/edit/page.tsx:336`의 ShareLinksSection을 "공유 링크 펼치기" 같은 명시적 사용자 액션 뒤에 lazy mount 전환
- **보관 사유**: 현재 mount 시 useEffect로 즉시 fetch하는 구조. 단순 dynamic만 하면 hydration 직후 import+fetch가 이어져 지연 로딩 효과 제한적. "펼치기" UI 전환이 필요하여 아키텍처 변경 동반.
- **복귀 조건**: T101 1차 완료 후 수치 부족 시 2차 분해로 검토
- **관련**: T101, resume edit 페이지

### @google/generative-ai 동적 import

- **내용**: `modules/gemini/implementation.ts`에서 정적 import 중
- **보관 사유**: 서버 전용 모듈 — 클라이언트 번들에 포함되지 않음
- **복귀 조건**: 서버 번들 크기 문제 또는 cold start 최적화 필요 시

### CoverLetter.resumeId / experienceId FK relation 미정의

- **내용**: `cover_letters` 테이블의 `resumeId`, `experienceId` 필드가 plain String으로만 선언되어 @relation 없음. Resume/Experience 삭제 시 orphaned ID 잔존 가능. 같은 스키마의 ResumeShareLink.resumeId는 relation이 있어 패턴 불일치.
- **보관 사유**: 마이그레이션 필요 + FK 추가 시 기존 데이터 정합성 사전 점검 필요. Sprint 5는 기능 변경 ZERO 원칙.
- **복귀 조건**: DB 스키마 정비 Sprint 진입 시. `@relation(onDelete: SetNull)` 추가 + 마이그레이션.
- **관련**: T98, 코드 리뷰 [H-1]

### 모달 접근성 기본기 부재 (Sprint 5 코드 리뷰 [INFO])

- **내용**: 추출된 4개 모달(GenerateCoverLetterModal, RegisterCoverLetterModal, PortfolioPreviewOverlay, JobCardDetailModal) + 기존 모달 전부에서 `role="dialog"`, `aria-modal="true"` 미적용, focus trap 없음, Escape 키 닫기 미구현, `aria-labelledby` 연결 없음
- **보관 사유**: Sprint 5 신규 도입 문제가 아닌 pre-existing 이슈. 기능 변경 ZERO 원칙에 따라 접근성 Sprint에서 일괄 처리 권장
- **복귀 조건**: 접근성 Sprint 진입 시. WCAG 2.2 dialog 패턴 일괄 적용
- **관련**: Sprint 5 코드 리뷰, T100

### 모달 다크모드 미지원 (Sprint 5 코드 리뷰 [INFO])

- **내용**: 추출된 4개 모달 전부 `bg-white`, `text-black/60` 등 라이트 테마 하드코딩. AppSidebar는 `dark:bg-white/15` 사용 중이라 패턴 불일치
- **보관 사유**: pre-existing 이슈. 모달별 다크모드 토큰은 디자인 시스템 정비와 함께 처리해야 효율적
- **복귀 조건**: 다크모드 디자인 시스템 정비 Sprint 진입 시
- **관련**: Sprint 5 코드 리뷰, T100
