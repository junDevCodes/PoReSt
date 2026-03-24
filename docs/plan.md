# PoReSt 전체 작업 계획서 — Sprint 6

기준일: 2026-03-23
문서 정의: 프로젝트 비전·마일스톤·로드맵·게이트를 관리하는 단일 기준 문서
관련 문서: `task.md`(현재 태스크 상세), `checklist.md`(검증 체크리스트), `history.md`(완료 이력·맥락), `archive.md`(보류 항목·아이디어)

---

## 1) 비전과 전략

### 1.1 비전

PoReSt는 공개 포트폴리오(`/portfolio/[publicSlug]`)와 개인 워크스페이스(`/app`)를 통합한 **개인 개발자 OS**다.

### 1.2 제품 전략

**Dogfooding → 폴리시 → 품질 보증 → 실전 최적화 → Lazy 로딩 → 데이터 로딩 아키텍처 전환**

1. **Sprint 1 (M6~M10)**: 기능 구현 완료 ✅
2. **Sprint 2 (M11-P)**: 포트폴리오/이력서 프로덕션 폴리시 ✅
3. **Sprint 3 (M12)**: 품질 보증 — 테스트 + E2E + 접근성 + 성능 기준선 ✅
4. **Sprint 4 (M13)**: 실전 최적화 — 화면 전환 속도 + AI 자기소개서 RAG ✅
5. **Sprint 5 (M14)**: UI 레벨 next/dynamic Lazy 로딩 리팩토링 ✅
6. **Sprint 6 (M15, 현재)**: Server/Client 하이브리드 전환 — useEffect 워터폴 제거

### 1.3 Sprint 6 핵심 원칙

- **서버에서 데이터, 클라이언트에서 인터랙션** — useEffect fetch 워터폴을 서버 쿼리 1단계로 단축
- **이미 있는 패턴 확장** — cover-letters, resumes 목록에서 검증된 Server+PageClient 패턴을 14개 페이지에 적용
- **기능 변경 ZERO** — 사용자가 볼 수 있는 동작은 바꾸지 않는다
- **한 번에 하나씩** — 페이지 단위 커밋, 실패 시 해당 페이지만 revert
- **측정 → 변경 → 검증** — Before/After 체감 속도 수치로 판단

---

## 2) Sprint 1~5 완료 요약

> 상세 이력은 `history.md` 참조

| Sprint      | 마일스톤        | 핵심                                  | 상태 |
| ----------- | --------------- | ------------------------------------- | ---- |
| S1 (M6~M10) | 기능 구현       | 17개 모듈, 72+ API                    | ✅   |
| S2 (M11-P)  | 프로덕션 폴리시 | T88~T90, 디자인/성능/코드품질         | ✅   |
| S3 (M12)    | 품질 보증       | T91~T94, 테스트/E2E/접근성/Lighthouse | ✅   |
| S4 (M13)    | 실전 최적화     | T95~T98, loading.tsx + RAG 파이프라인 | ✅   |
| S5 (M14)    | Lazy 로딩       | T99~T103, dynamic 분리 + prefetch     | ✅   |

**Sprint 5 최종 기준선**: 74 suites, 540 tests + E2E 17 tests / lint 0 errors, 9 warnings

---

## 3) Sprint 6 마일스톤 — M15: Server/Client 하이브리드 전환

### 배경

Private workspace 29개 페이지 중 **17개가 `"use client"` 전체 클라이언트 렌더링**이다.
이 중 14개가 useEffect로 API를 fetch하는 3단계 워터폴 패턴:

```
JS 다운로드 → 하이드레이션 → useEffect 발동 → fetch('/api/app/...') → setState → 렌더
```

반면 이미 Server Component로 전환된 12개 페이지(projects, resumes, cover-letters 등)는:

```
서버에서 인증+DB쿼리 → HTML 스트리밍 → 즉시 렌더 (데이터 포함)
```

**체감 차이: 400~600ms vs 150~250ms**

3개 생성 폼(blog/new, projects/new, resumes/new)은 초기 데이터 fetch가 없어 전환 대상에서 제외.

### 전환 패턴 (프로젝트 내 검증 완료)

```tsx
// Before: "use client" 전체 — 3단계 워터폴
"use client";
export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { fetch('/api/app/audit')... }, []);
  return <div>...</div>;
}

// After: Server + Client 하이브리드 — 1단계
// page.tsx (Server Component)
export default async function AuditPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/audit");
  const logs = await listAuditLogsForOwner(ownerId);
  return <AuditPageClient initialLogs={logs} />;
}

// AuditPageClient.tsx ("use client" — 인터랙션만)
"use client";
export function AuditPageClient({ initialLogs }) {
  const [logs, setLogs] = useState(initialLogs);
  // useEffect 초기 fetch 제거, CRUD 핸들러만 유지
}
```

### 성공 기준 (KPI)

| KPI | 측정 대상 | 성공 기준 | 구분 |
|---|---|---|---|
| 스켈레톤 체류시간 | 대표 5페이지 (audit, feedback, job-tracker, settings, resumes/edit) | 사이드바 클릭 → 첫 데이터 표시까지 ms 단축 (Before/After 수치 비교) | **pass/fail 주지표** |
| useEffect 초기 fetch 제거 | 전환 대상 14개 페이지 | 서버 쿼리로 전환 완료 (useEffect 초기 fetch 코드 삭제) | **pass/fail** |
| 기존 기능 회귀 | 14개 페이지 전체 CRUD 동작 | 전부 정상 | **필수** |
| 게이트 | lint/build/jest/E2E | 540 tests + 17 E2E 기존 통과 유지 | **필수** |

> **측정 규약**:
> - 환경: 프로덕션 빌드(`npm run build && npm run start`), Chrome DevTools Performance 탭, Disable cache, 로그인 상태
> - 지표: 사이드바 메뉴 클릭 → 첫 실제 데이터 DOM 노드 렌더 시점까지의 ms
> - 횟수: **cold 3회 + warm 3회**, 각 중앙값(median) 기준 — 편차 제거
> - cold: 서버 재시작 직후 첫 접근 / warm: 동일 페이지 2회째 이후 접근
> - Before/After 비교는 **warm 중앙값** 기준 pass/fail 판정, cold는 참고 기록

### 전환 대상 14개 분류

| Tier | 페이지 | 줄수 | fetch 패턴 | 난이도 |
|---|---|---|---|---|
| **1 (읽기 전용)** | feedback/page (120), audit/page (160) | 소 | 단일 fetch, CRUD 없거나 최소 | 낮음 |
| **2 (단일 fetch+CRUD)** | testimonials (447), projects/edit (192), notes/edit (285), feedback/[id] (334), feedback/new (239) | 소~중 | 단일~이중 fetch + CRUD | 중간 |
| **3 (복합 fetch+CRUD)** | job-tracker (314), company-targets (596), experience-stories (603), domain-links (369), blog/edit (615) | 중~대 | 다중 fetch + 인라인 편집 | 중간~높음 |
| **4 (거대 편집)** | settings (969), resumes/edit (1,331) | 대 | 복합 fetch + 15+ useState | 높음 |

### Phase 1: 기준선 + 패턴 확립 (Tier 1)

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T104 | Before 측정 + feedback/page, audit/page 전환 (패턴 확립) | ✅ |

### Phase 2: 단일 fetch 페이지 전환 (Tier 2)

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T105 | testimonials, projects/edit, notes/edit, feedback/[id], feedback/new — 5개 전환 | ✅ |

### Phase 3: 복합 fetch 페이지 전환 (Tier 3)

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T106 | job-tracker, company-targets, experience-stories, domain-links, blog/edit — 5개 전환 | ✅ |

### Phase 4: 거대 페이지 + 최종 검증 (Tier 4)

| ID | 핵심 내용 | 상태 |
|---|---|---|
| T107 | portfolio/settings (969줄), resumes/edit (1,331줄) 전환 + After 측정 + 배포 | ✅ 전환 완료 + 최종 게이트 통과 (2026-03-24) |

### 실행 순서 (병렬 세션 구조)

```
Phase 1 (직렬)     Phase 2 (병렬 3세션)              Phase 3 (병렬 2세션)   Phase 4
──────────────  ────────────────────────────────  ──────────────────────  ──────────
T104
Before 측정
+ 패턴 확립 2개
      ↓
                ┌─ Session A: testimonials +
                │  feedback/[id] + feedback/new
                │  + job-tracker (T105+T106 혼합)
                │
                ├─ Session B: projects/edit +     → 통합  ┌─ Session D:     → After 측정
                │  notes/edit + company-targets      게이트 │  settings (969)  + 최종 게이트
                │  + experience-stories              │     │                  + 배포
                │                                    │     └─ Session E:
                └─ Session C: domain-links +         │        resumes/edit
                   blog/edit                         │        (1,331)
```

- **Phase 1 직렬 필수**: 패턴 확립 + Before 측정. 후속 세션의 기준.
- **Phase 2 병렬 근거**: 10개 페이지 전부 파일 충돌 0건 (각 디렉토리 독립, 공유 파일 수정 없음)
- **Phase 3 병렬 근거**: settings와 resumes/edit는 완전 다른 디렉토리
- **Phase 내**: 페이지 단위 커밋 → 빌드 확인 → 다음 페이지
- **롤백 단위**: 페이지 1개 (커밋 단위 revert 가능)
- **통합 게이트**: Phase 2 완료 후 3세션 병합 → lint/build/jest/E2E

---

## 4) 태스크 상세

> 각 태스크의 작업 절차와 세부 항목은 `task.md` 참조

### T104 — 기준선 측정 + 읽기 전용 2개 전환 (패턴 확립)

**범위**: Before 체감 속도 측정 + feedback/page (120줄), audit/page (160줄) 전환

**산출물**:
1. Before 측정: 전환 대상 14개 중 대표 5개 페이지 네트워크 지연 측정
2. feedback/page → Server Component + FeedbackPageClient 분리
3. audit/page → Server Component + AuditPageClient 분리
4. 전환 패턴 문서화 (후속 태스크 참조용)

**위험도**: 최저 — 가장 단순한 읽기 전용 페이지, 패턴 검증용

### T105 — 단일 fetch 페이지 5개 전환

**범위**: testimonials (447줄), projects/edit (192줄), notes/edit (285줄), feedback/[id] (334줄), feedback/new (239줄)

**특이사항**:
- testimonials: 인라인 CRUD(생성/상태변경/공개토글/삭제) → Client에 유지
- projects/edit: ProjectForm 컴포넌트 위임 구조 → 가장 짧은 편집 페이지
- notes/edit: 이중 fetch (note + notebooks) → 서버에서 `Promise.all`
- feedback/new: targetType 변경 시 동적 reload → initialTargets만 서버, 이후 client reload
- feedback/[id]: 복합 fetch + 비교 기능 → initialDetail만 서버 전달

**위험도**: 낮음~중간 — CRUD 핸들러는 client에 유지, 초기 데이터만 서버 전환

### T106 — 복합 fetch 페이지 5개 전환

**범위**: job-tracker (314줄), company-targets (596줄), experience-stories (603줄), domain-links (369줄), blog/edit (615줄)

**특이사항**:
- domain-links: 6개 엔티티 병렬 fetch → 서버에서 `Promise.all` 6개
- company-targets/experience-stories: 인라인 편집 Record 패턴 → client 유지, 초기 목록만 서버
- job-tracker: 칸반 보드 + 동적 모달(Sprint 5 dynamic) → initialBoard만 서버
- blog/edit: lint/export 부가 기능 → client 유지

**위험도**: 중간 — 다중 fetch 병렬화 + 인라인 편집 상태 보존 필요

### T107 — 거대 페이지 2개 + 최종 측정 + 배포

**범위**: portfolio/settings (969줄), resumes/edit (1,331줄) 전환 + After 측정 + 프로덕션 배포

**특이사항**:
- settings: 15+ useState, 아바타/이력서 업로드, 미리보기 모달 → 초기 설정 데이터만 서버, 업로드/폼 상태는 client
- resumes/edit: 프로젝트 내 최대 파일, BulletsEditor/MetricsEditor 인라인 → 이력서+경력 데이터만 서버, 편집 로직 전체 client

**T107 중단 기준 (stop-loss)**:
- settings 또는 resumes/edit의 warm 중앙값 개선폭이 **50ms 미만**이면, 해당 페이지는 RSC 전환만으로는 효과 부족으로 판정
- 이 경우 해당 페이지의 추가 분해(ShareLinksSection lazy mount, 폼 영역 분할 등)를 **Sprint 7로 이관** — Sprint 6 안에서 2차 분해를 시도하지 않음
- 나머지 12개 페이지 전환 성과는 유지 (revert 대상 아님)

**산출물**:
1. After 측정: 동일 5개 페이지 Before/After 비교표
2. 게이트 4종 최종 통과
3. 프로덕션 배포 + 스모크
4. history.md Sprint 6 완료 기록

**위험도**: 높음 — 가장 큰 2개 파일, 상태 복잡도 최고. 전환 실패 시 해당 페이지만 revert.

---

## 5) 게이트 규칙

### 5.1 고정 게이트 (매 태스크 완료 시)

1. `npm run lint` — 0 errors
2. `npm run build` — 성공
3. `npx jest --runInBand` — 74 suites, 540 tests 이상
4. `npm run vercel-build` — 성공

### 5.2 Sprint 6 추가 게이트

- **기능 회귀 ZERO** — 14개 전환 페이지의 CRUD 전부 동작
- **E2E 17개** 기존 통과 유지
- **useEffect 초기 fetch 제거 확인** — 전환된 페이지에서 초기 데이터용 useEffect 삭제
- **서버 컴포넌트 인증 확인** — `getRequiredOwnerSession` 호출 확인
- **롤백 규칙** — 빌드 실패 또는 CRUD 회귀 시 해당 페이지 커밋 revert

### 5.3 기준선

- jest: 74 suites, 540 tests
- E2E: 8 specs, 17 tests
- lint: 0 errors, 9 warnings

---

## 6) 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| 서버 컴포넌트에서 직접 서비스 호출 시 import 오류 | 기존 cover-letters/resumes 패턴 참조 — 이미 검증된 import 경로 |
| Serialization 문제 (Date, BigInt 등) | 기존 `server-serializers.ts` 패턴 활용 — 필요 시 serializer 추가 |
| CRUD 핸들러 이관 시 상태 누락 | initialData를 useState 초기값으로 전달, mutation은 기존 fetch 유지 |
| 거대 파일(settings 969줄, edit 1331줄) 전환 실패 | Phase 4에 배치 — Phase 1~3 패턴 완전 숙달 후 시도. 실패 시 revert. |
| 동적 reload 페이지(company-targets, feedback/new) 패턴 불일치 | 초기 데이터만 서버, 필터/타입 변경 후 재조회는 기존 client fetch 유지 |
| domain-links 6개 병렬 fetch 서버 전환 시 성능 | 서버에서 `Promise.all` — DB 직접 쿼리이므로 API 라운드트립 제거로 오히려 빨라짐 |

---

## 7) 의도적 제외

| 항목 | 제외 사유 | 복귀 조건 (backlog trigger) |
|---|---|---|
| **Server Actions + optimistic UI** | mutation 패턴 전면 교체 — "한 번에 하나만" 원칙 | **Sprint 7 1순위** — Sprint 6 RSC 전환 완료 즉시 진입 |
| settings/resumes-edit 2차 분해 | T107 After 측정으로 판단 | T107 warm 중앙값 개선폭 < 50ms인 페이지만 Sprint 7 대상 |
| 모달 접근성 (role="dialog", focus trap) | 데이터 로딩 아키텍처 집중 | 접근성 Sprint 진입 시 또는 WCAG 감사 요청 시 |
| 모달 다크모드 | 동일 | 다크모드 디자인 시스템 정비 Sprint 진입 시 |
| Private E2E | 동일 | Sprint 7에서 Server Actions + E2E 병행 검토 |
| blog/new, projects/new, resumes/new | 초기 데이터 fetch 없음 | 해당 없음 (전환 효과 없음) |
| API 라우트 제거/통합 | 기존 API 유지 (외부 클라이언트 대비) | 해당 없음 |
| TanStack Query 도입 | 기술스택 추가, 현 패턴 충분 | 동적 재조회 페이지에서 캐시 무효화 버그 빈발 시 |
| 인증 중복 (layout+page) | Sprint 4 P2 기분류, JWT만 | 프로파일링에서 getServerSession이 100ms+ 측정 시 |
| 다크모드 FOUC | cookie/script 전환 필요 | 사용자 불만 또는 체감 이슈 재발 시 |

---

## 8) 아키텍처 현황 메모

- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **스타일**: Tailwind CSS 4
- **ORM**: Prisma 7.3 + NeonDB (PostgreSQL)
- **인증**: NextAuth 4.x (Google OAuth)
- **배포**: Vercel
- **테스트**: Jest (74 suites, 539 tests) + Playwright E2E (17 tests, 8 specs)
- **번들**: UI 레벨 next/dynamic 4개 모달 분리, native import() pdf-download.ts, prefetch 전략 적용
- **데이터 로딩**: Server Component 26개 / Client Component 3개 (14개 RSC 전환 완료, Sprint 6)
