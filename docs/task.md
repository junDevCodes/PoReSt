# PoReSt 작업 상세 계획서

기준일: 2026-03-18
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T91 — TDD 미완료 보충 ✅ 완료

> history.md 참조. 69 suites, 482 tests 달성.

---

## T92 — Playwright E2E 회귀 테스트 자동화

### 배경

Sprint 2~3에서 매 태스크마다 수동 Playwright MCP 검증을 반복해옴.
수동 검증 항목: 포트폴리오 홈(라이트/다크), 모바일(라이트/다크), 경력, 프로젝트 목록/상세, 이력서 공유.
이를 자동 E2E 스크립트로 전환하여 **회귀 방지를 자동화**해야 한다.

### 설계 판단

| 판단 항목 | 결정 | 근거 |
|---|---|---|
| 테스트 대상 | **프로덕션 URL** (smoke test) | 로컬 dev 서버 설정 불필요, 실배포 상태 검증 |
| CI 워크플로우 | **별도 `e2e.yml`** (기존 ci.yml 분리) | E2E는 배포 후 검증 — 빌드/배포 실패와 분리 |
| 트리거 | `workflow_dispatch` + `schedule(daily)` | 수동 실행 + 매일 자동 1회 |
| 브라우저 | **Chromium only** (시작) | 단일 브라우저로 시작, 필요 시 확장 |
| 선택자 전략 | **텍스트 기반 + data-theme** | `getByText`, `getByRole` 우선 — 클래스명 의존 최소화 |
| 리포트 | HTML 리포트 + GitHub Artifacts | 실패 시 스크린샷 포함 |
| 타임아웃 | 30초/테스트 | 프로덕션 cold start 대응 |
| 재시도 | 1회 | 네트워크 일시 불안정 대응 |

### 현황 진단

| 항목 | 현재 | 변경 |
|---|---|---|
| Playwright | ✅ `@playwright/test ^1.58.2` | Session A 완료 |
| E2E 스크립트 | ✅ `e2e/` 3개 스펙 | Session B에서 4개 추가 |
| CI E2E | ❌ 없음 | `.github/workflows/e2e.yml` 신규 (Session B) |
| package.json | ✅ `test:e2e`, `test:e2e:headed`, `test:e2e:report` 추가 | 완료 |
| .gitignore | ✅ `playwright-report/`, `test-results/`, `blob-report/` 추가 | 완료 |
| jest.config.js | ✅ `testPathIgnorePatterns: e2e/` 추가 | 완료 |

---

### 핵심 변경 (12개 항목)

#### S. 환경 설정 (3개)

1. **S1: Playwright 설치 + config**
   - `npm install -D @playwright/test`
   - `npx playwright install chromium` (브라우저 바이너리)
   - `playwright.config.ts` 생성:
     - `baseURL`: `process.env.E2E_BASE_URL || 'https://www.jundevcodes.info'`
     - `projects`: `[{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`
     - `reporter`: `[['html', { open: 'never' }], ['list']]`
     - `timeout`: 30000, `retries`: 1
     - `testDir`: `./e2e`

2. **S2: package.json scripts**
   - `"test:e2e": "playwright test"`
   - `"test:e2e:headed": "playwright test --headed"`
   - `"test:e2e:report": "playwright show-report"`

3. **S3: .gitignore 업데이트**
   - `playwright-report/`, `test-results/`, `blob-report/`

#### E. E2E 시나리오 (7개 파일, 10+ 테스트)

4. **E1: `e2e/portfolio-home.spec.ts`** — 홈 페이지 (3 tests)
   - 페이지 200 로드 + 프로필 이름/헤드라인 존재
   - 주요 섹션 제목 존재 ("대표 프로젝트", "경력", "기술 스택")
   - 푸터 CTA + "PoReSt로 만들어졌습니다" 텍스트
   - 선택자: `getByText()`, `getByRole('heading')`

5. **E2: `e2e/portfolio-experiences.spec.ts`** — 경력 페이지 (2 tests)
   - 페이지 200 로드 + "경력" h1 제목
   - 타임라인 경력 카드 1개 이상 존재 (회사명 + 직책)
   - 선택자: `getByText('경력')`, 카드 내 텍스트 검증

6. **E3: `e2e/portfolio-projects.spec.ts`** — 프로젝트 (3 tests)
   - 목록 페이지 200 로드 + "프로젝트" h1 + 카드 1개 이상
   - 카드 클릭 → 상세 페이지 이동 (URL 변경 확인)
   - 상세 페이지: "Case Study" 라벨 + 제목 + 기술 스택 태그
   - 선택자: `getByRole('link')`, URL 패턴 매칭

7. **E4: `e2e/portfolio-dark-mode.spec.ts`** — 다크모드 (2 tests)
   - 초기 상태: `data-theme="light"` (기본값)
   - 토글 버튼 클릭 → `data-theme="dark"` 전환 + 배경색 변경
   - 다시 클릭 → `data-theme="light"` 복귀
   - 선택자: `[data-theme]` attribute, `getByRole('button', { name: /모드로 전환/ })`

8. **E5: `e2e/portfolio-mobile.spec.ts`** — 모바일 반응형 (1 test)
   - 뷰포트 390×844 (iPhone 14 기준)
   - 홈 페이지 로드 + 프로필 존재 + 섹션 제목 존재
   - 스크롤 가능 (페이지 높이 > 뷰포트)
   - 선택자: `page.setViewportSize({ width: 390, height: 844 })`

9. **E6: `e2e/resume-share.spec.ts`** — 이력서 공유 (1 test)
   - 무효 토큰 `/resume/share/invalid-token-xxx` → 에러 메시지 표시
   - "찾을 수 없습니다" 또는 에러 UI 요소 존재 확인
   - 선택자: `getByText()` 에러 메시지, rose 배경 요소

10. **E7: `e2e/seo.spec.ts`** — SEO 메타 + sitemap (2 tests)
    - 홈 페이지 `<title>` 태그 비어있지 않음
    - `og:title`, `og:image` meta 태그 존재
    - `/sitemap.xml` 200 응답 + XML 콘텐츠 포함
    - 선택자: `page.locator('meta[property="og:title"]')`, fetch API

#### C. CI 연동 (2개)

11. **C1: `.github/workflows/e2e.yml` 신규**
    - 트리거: `workflow_dispatch` (수동) + `schedule` (매일 09:00 KST = 00:00 UTC)
    - steps: checkout → Node.js 22 → npm ci → Playwright install chromium → `npm run test:e2e`
    - env: `E2E_BASE_URL` (GitHub Variables/Secrets)
    - timeout: 10분

12. **C2: 리포트 아티팩트**
    - `actions/upload-artifact@v4` — `playwright-report/` 업로드
    - 실패 시에만 업로드 (`if: failure()`)
    - retention: 7일

---

### 디렉토리 구조

```
PoReSt/
├── e2e/                              # 신규 디렉토리
│   ├── portfolio-home.spec.ts        # E1
│   ├── portfolio-experiences.spec.ts # E2
│   ├── portfolio-projects.spec.ts    # E3
│   ├── portfolio-dark-mode.spec.ts   # E4
│   ├── portfolio-mobile.spec.ts      # E5
│   ├── resume-share.spec.ts          # E6
│   └── seo.spec.ts                   # E7
├── playwright.config.ts              # S1
├── .github/workflows/
│   ├── ci.yml                        # 기존 (변경 없음)
│   └── e2e.yml                       # C1 (신규)
└── package.json                      # S2 (scripts 추가)
```

### 환경 변수

| 변수 | 용도 | 기본값 |
|---|---|---|
| `E2E_BASE_URL` | 테스트 대상 URL | `https://www.jundevcodes.info` |

### 병렬 실행 구조

파일 충돌 기준으로 2개 세션 동시 실행 가능.
**단, Session A의 S1~S3 커밋 완료 후 Session B 시작** (Playwright config 의존).

```
Session A (설정 + 페이지 스펙) ✅      Session B (기능 스펙 + CI)
────────────────────────            ────────────────────────
S1. Playwright 설치 + config ✅
S2. package.json scripts ✅
S3. .gitignore 업데이트 ✅
  ↓ [커밋 완료: bc583c3]
E1. portfolio-home ✅ (3 tests)       E4. portfolio-dark-mode ✅/❌
E2. portfolio-experiences ✅ (2)      E5. portfolio-mobile ✅/❌
E3. portfolio-projects ✅ (3)         E6. resume-share ✅/❌
                                      E7. seo ✅/❌
                                      C1. e2e.yml 워크플로우 ✅/❌
                                      C2. 리포트 아티팩트 ✅/❌
       ↘      통합: 로컬 E2E 14개 전체 통과 + lint/build/jest       ↙
```

### 세션별 수정 파일 (충돌 없음)

| 세션 | 수정/신규 파일 | 항목 수 |
|---|---|---|
| **Session A** | `playwright.config.ts`(신규), `package.json`(수정), `.gitignore`(수정), `e2e/portfolio-home.spec.ts`, `e2e/portfolio-experiences.spec.ts`, `e2e/portfolio-projects.spec.ts` | 6개 |
| **Session B** | `e2e/portfolio-dark-mode.spec.ts`, `e2e/portfolio-mobile.spec.ts`, `e2e/resume-share.spec.ts`, `e2e/seo.spec.ts`, `.github/workflows/e2e.yml` | 5개 |

### 의존성

- **S1 → S2 → S3**: 설정 순차 (Session A 내부)
- **S1~S3 → Session B**: Session A의 설정 커밋 완료 후 Session B 시작
- **A ∥ B (스펙 작성)**: E1~E3 ∥ E4~E7 완전 독립 (파일 겹침 없음)
- **통합**: 양 세션 완료 후 E2E 14개 전체 실행 + 게이트 4종

### 제약 사항

- **인증 페이지 테스트 제외**: Google OAuth 로그인 자동화 불가 → `/app/*` 페이지는 E2E 대상 아님
- **PDF 다운로드 테스트 제외**: headless에서 파일 다운로드 검증 복잡 → 향후 별도
- **Jest 기존 테스트 영향 없음**: Playwright는 `e2e/` 디렉토리, Jest는 `src/` — testDir 분리
- **데이터 의존**: 프로덕션에 실제 포트폴리오 데이터가 있어야 테스트 통과
  - 데이터 없는 경우 graceful skip 처리 (test.skip 조건)

### 예상 테스트 수

| 세션 | 파일 | 테스트 수 |
|---|---|---|
| A | portfolio-home.spec.ts | 3 |
| A | portfolio-experiences.spec.ts | 2 |
| A | portfolio-projects.spec.ts | 3 |
| B | portfolio-dark-mode.spec.ts | 2 |
| B | portfolio-mobile.spec.ts | 1 |
| B | resume-share.spec.ts | 1 |
| B | seo.spec.ts | 2 |
| | **합계** | **14** |

---

## T93 — WCAG 접근성 기본 점검 + 핵심 수정 ⬜ 대기

> T92 완료 후 진행. plan.md 참조.

## T94 — Lighthouse 성능 기준선 + 문서화 ⬜ 대기

> T92 완료 후 T93과 병렬 가능. plan.md 참조.
