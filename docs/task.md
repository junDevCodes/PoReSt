# PoReSt 작업 상세 계획서

기준일: 2026-03-23
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## Sprint 5 (T99~T103) ✅ 완료

> history.md 참조. 최종 기준선: 74 suites, 540 tests + E2E 17 tests.

---

## 병렬 실행 구조

### 파일 충돌 분석 결과: 0건 — 14개 페이지 완전 독립

각 페이지는 자기 디렉토리의 `page.tsx` 수정 + `XxxPageClient.tsx` 신규 생성만 해당.
공유 파일(`server-serializers.ts`, `server-auth.ts`, `admin-api.ts`) 수정 없음.
서비스 모듈(`modules/`)은 import만, 수정 없음.

### Phase 1 — T104 (직렬 필수, 단일 세션)

Before 측정 + 패턴 확립. 모든 후속 세션의 전환 패턴이 여기서 확정되므로 반드시 먼저 완료.

### Phase 2 — T105 + T106 (병렬 3세션)

> T104 완료 후 동시 진입. 10개 페이지를 3세션으로 균등 분배.

| 세션 | 페이지 | 총 줄수 | 작업 내용 |
|---|---|---|---|
| **Session A** ✅ | testimonials (447), feedback/[id] (334), feedback/new (239), job-tracker (314) | ~1,334줄 | 목록 CRUD + 칸반 보드 |
| **Session B** ✅ | projects/edit (192), notes/edit (285), company-targets (596), experience-stories (603) | ~1,676줄 | 편집 폼 + 인라인 편집 Record 패턴 |
| **Session C** ✅ | domain-links (369), blog/edit (615) | ~984줄 | 다중 엔티티 fetch + 편집 |

**세션 내 순서**: 줄수 적은 것부터 → 패턴 반복으로 속도 가속
**세션 간**: 완전 독립 — 동시 실행 가능, merge conflict 없음

### Phase 2 통합 게이트 ✅ (2026-03-23)

3세션 전부 완료 후 병합 → 통합 게이트 실행:

```
1. 3세션 변경사항 main에 병합 ✅
2. npm run lint (0 errors, 9 warnings) ✅
3. npm run build (73 routes, Turbopack 4.7s) ✅
4. npx jest --runInBand (74 suites, 540 tests) ✅
5. E2E 17/17 passed ✅
6. 전환된 10개 페이지 CRUD 스모크 — 프로덕션 배포 후 수동 확인 필요
```

### Phase 3 — T107 (병렬 2세션)

> 통합 게이트 후 진입. 2개 거대 페이지는 독립 디렉토리이므로 병렬 가능.

| 세션 | 페이지 | 줄수 | 작업 내용 |
|---|---|---|---|
| **Session D** | portfolio/settings | 969줄 | 설정 폼 + 아바타 업로드 + 미리보기 모달 |
| **Session E** | resumes/[id]/edit | 1,331줄 | 항목 CRUD + BulletsEditor/MetricsEditor + PDF |

### Phase 4 — 최종 측정 + 배포 (직렬 필수, 단일 세션)

After 측정 + 통합 게이트 최종 + 프로덕션 배포. 모든 전환이 반영된 상태에서 실행.

### 실행 흐름도

```
Phase 1 (직렬)     Phase 2 (병렬 3세션)              Phase 3 (병렬 2세션)   Phase 4
──────────────  ────────────────────────────────  ──────────────────────  ──────────
T104
Before 측정
+ 패턴 확립 2개
      ↓
                ┌─ Session A: testimonials +
                │  feedback/[id] + feedback/new
                │  + job-tracker
                │
                ├─ Session B: projects/edit +     → 통합  ┌─ Session D:     → After 측정
                │  notes/edit + company-targets      게이트 │  settings (969)  + 최종 게이트
                │  + experience-stories              │     │                  + 프로덕션 배포
                │                                    │     └─ Session E:
                └─ Session C: domain-links +         │        resumes/edit
                   blog/edit                         │        (1,331)
```

---

## 전환 패턴 레퍼런스

프로젝트 내 이미 검증된 Server+PageClient 하이브리드 패턴:

```tsx
// ① page.tsx — Server Component (데이터 조회)
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { listForOwner } from "@/modules/cover-letters";
import { serializeOwnerCoverLetterList } from "@/app/(private)/app/_lib/server-serializers";
import { CoverLettersPageClient } from "./CoverLettersPageClient";

export default async function CoverLettersPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/cover-letters");
  const coverLetters = await listForOwner(ownerId);
  return <CoverLettersPageClient initialCoverLetters={serializeOwnerCoverLetterList(coverLetters)} />;
}

// ② PageClient.tsx — Client Component (인터랙션)
"use client";
export function CoverLettersPageClient({ initialCoverLetters }) {
  const [coverLetters, setCoverLetters] = useState(initialCoverLetters);
  // useEffect 초기 fetch 제거됨
  // CRUD 핸들러(reloadCoverLetters, handleDelete 등)는 그대로 유지
}
```

**핵심 규칙**:
- Server Component: `getRequiredOwnerSession` → 서비스 직접 호출 → props 전달
- Client Component: `useState(initialData)` — useEffect 초기 fetch 제거
- CRUD(생성/수정/삭제) 핸들러는 기존 `fetch('/api/...')` 그대로 유지
- Date/BigInt 등 직렬화 필요 시 `server-serializers.ts`에 추가
- 동적 reload(필터 변경 등)는 client에서 기존 fetch 유지

---

## T104 — 기준선 측정 + 읽기 전용 2개 전환 (패턴 확립) ✅

### 배경

가장 단순한 2개 페이지로 전환 패턴을 확립하고, Before/After 측정 기반을 만든다.

### Before 측정 — 스켈레톤 체류시간 (ms)

프로덕션 빌드(`npm run build && npm run start`) 기준, 대표 5개 페이지.

**측정 지표**: 사이드바 메뉴 클릭 → 첫 실제 데이터 DOM 노드 렌더까지 ms (스켈레톤이 데이터로 교체되는 시점)

**측정 규약**:
- 환경: 프로덕션 빌드(`npm run build && npm run start`), Chrome DevTools Performance 탭, Disable cache, 로그인 상태
- 횟수: **cold 3회 + warm 3회**, 각 **중앙값(median)** 기준
- cold: 서버 재시작 직후 첫 접근 / warm: 동일 페이지 2회째 이후 접근
- pass/fail 판정은 **warm 중앙값** 기준, cold는 참고 기록

| 페이지 | cold 중앙값 (ms) | warm 중앙값 (ms) | 비고 |
|---|---|---|---|
| `/app/audit` | — | — | 읽기 전용, 가장 단순 |
| `/app/feedback` | — | — | 읽기 전용, 링크만 |
| `/app/job-tracker` | — | — | 칸반 보드 |
| `/app/portfolio/settings` | — | — | 969줄 거대 폼 |
| `/app/resumes/[id]/edit` | — | — | 1,331줄 최대 파일 |

### 전환 대상 1: feedback/page.tsx (120줄)

**현재 구조**:
```
"use client" → useEffect → fetch('/api/app/feedback') → setState → 렌더
```

**전환 후**:
```
page.tsx (Server): getRequiredOwnerSession → listFeedbackRequestsForOwner → FeedbackPageClient
FeedbackPageClient.tsx ("use client"): useState(initialRequests) — useEffect 제거
```

**작업 절차**:
1. 현재 page.tsx 읽기 → 데이터 로딩 로직과 렌더링 로직 분리 지점 확인
2. page.tsx → Server Component로 전환 (getRequiredOwnerSession + 서비스 호출)
3. 기존 코드를 FeedbackPageClient.tsx로 이동
4. initialRequests props 추가, useEffect 초기 fetch 제거
5. 빌드 확인 + 페이지 동작 스모크
6. 커밋

### 전환 대상 2: audit/page.tsx (160줄)

**현재 구조**:
```
"use client" → useEffect → fetch('/api/app/audit?limit=20') → setState → 커서 페이지네이션
```

**전환 후**:
```
page.tsx (Server): getRequiredOwnerSession → listAuditLogsForOwner(ownerId, {limit: 20}) → AuditPageClient
AuditPageClient.tsx ("use client"): useState(initialLogs) — useEffect 제거, handleLoadMore는 client fetch 유지
```

**특이사항**: 커서 페이지네이션의 `handleLoadMore`는 client fetch 유지 (추가 로드는 인터랙션)

### 제약 사항

- 기능 동작 100% 보존
- 게이트 4종 + E2E 17개 통과 유지
- 페이지 단위 커밋

---

## T105 — 단일 fetch 페이지 5개 전환 ✅

### 배경

T104에서 확립한 패턴을 단일/이중 fetch + CRUD 페이지에 적용한다.

### 전환 대상

#### 1. testimonials/page.tsx (447줄)

**현재**: useEffect → `fetch('/api/app/testimonials')` + 인라인 CRUD(생성/상태변경/공개토글/삭제)
**전환**: Server에서 `listForOwner` → TestimonialsPageClient에 `initialTestimonials` 전달
**CRUD 유지**: handleCreate, handleStatusChange, handleTogglePublic, handleDelete → client fetch 유지

#### 2. projects/[id]/edit/page.tsx (192줄, 최단 편집)

**현재**: useEffect → `fetch('/api/app/projects/{id}')` + ProjectForm 위임
**전환**: Server에서 `getForOwner(ownerId, id)` → ProjectEditPageClient에 `initialProject` 전달
**CRUD 유지**: handleUpdate, handleDelete → client fetch 유지

#### 3. notes/[id]/edit/page.tsx (285줄)

**현재**: useEffect → `Promise.all([note, notebooks])` 이중 fetch
**전환**: Server에서 `Promise.all([getNote, listNotebooks])` → NoteEditPageClient에 `initialNote, initialNotebooks` 전달
**CRUD 유지**: handleSave, handleDelete → client fetch 유지

#### 4. feedback/[id]/page.tsx (334줄)

**현재**: useEffect → `fetch('/api/app/feedback/{id}')` + 비교 기능
**전환**: Server에서 `getFeedbackDetail(ownerId, id)` → FeedbackDetailPageClient에 `initialDetail` 전달
**CRUD 유지**: handleRun, handleCompare, handleDelete → client fetch 유지

#### 5. feedback/new/page.tsx (239줄)

**현재**: useEffect → `fetch('/api/app/feedback/targets?type=')` 동적 reload
**전환**: Server에서 기본 targetType의 initialTargets 전달 → FeedbackNewPageClient
**특이사항**: targetType 변경 시 재조회는 client fetch 유지 (동적 reload)

### 작업 절차 (5개 공통)

```
1. 현재 page.tsx 읽기 → useEffect fetch 대상 식별
2. 서비스 모듈에서 해당 함수 import 경로 확인
3. page.tsx → Server Component 전환 (getRequiredOwnerSession + 서비스 호출)
4. 기존 코드를 XxxPageClient.tsx로 이동
5. initialData props 추가, useEffect 초기 fetch 제거
6. 직렬화 필요 여부 확인 (Date → ISO string 등)
7. 빌드 확인 + 기능 스모크 (CRUD 동작)
8. 커밋
```

### 제약 사항

- 동일: 기능 보존, 게이트 통과, 페이지 단위 커밋

---

## T106 — 복합 fetch 페이지 5개 전환 ✅

### 배경

다중 fetch + 인라인 편집 패턴의 복잡한 페이지들. 서버에서 병렬 쿼리로 전환하면 API 라운드트립 제거 + DB 직접 쿼리로 더 빠름.

### 전환 대상

#### 1. job-tracker/page.tsx (314줄)

**현재**: useEffect → `fetch('/api/app/job-tracker')` → 칸반 보드
**전환**: Server에서 `getBoardForOwner(ownerId)` → JobTrackerPageClient에 `initialBoard` 전달
**Sprint 5 연계**: JobCardDetailModal dynamic 유지, types.ts import 유지
**CRUD 유지**: handleStatusChange, handleJdMatch, loadEvents → client fetch

#### 2. company-targets/page.tsx (596줄)

**현재**: useEffect → `fetch('/api/app/company-targets?status=&q=')` + 인라인 편집 Record 패턴
**전환**: Server에서 `listForOwner(ownerId)` → CompanyTargetsPageClient에 `initialTargets` 전달
**특이사항**: 필터(status, q) 변경 시 재조회는 client fetch 유지

#### 3. experience-stories/page.tsx (603줄)

**현재**: useEffect → `Promise.all([experiences, stories])` + 인라인 STAR 편집
**전환**: Server에서 `Promise.all([listExperiences, listStories])` → ExperienceStoriesPageClient
**특이사항**: selectedExperienceId 변경 시 스토리 재조회는 client fetch 유지

#### 4. domain-links/page.tsx (369줄) ✅ Session C

**현재**: useEffect → **6개 엔티티 병렬 fetch** (projects, experiences, skills, resumes, notes, blogs) + domain-links
**전환**: Server에서 `Promise.all` 7개 병렬 쿼리 → DomainLinksPageClient에 전부 전달
**기대 효과**: 가장 큰 개선 — 6개 API 라운드트립이 서버 내 DB 직접 쿼리 1회로

#### 5. blog/[id]/edit/page.tsx (615줄) ✅ Session C

**현재**: useEffect → `fetch('/api/app/blog/posts/{id}')` + lint/export 부가 기능
**전환**: Server에서 `getForOwner(ownerId, id)` → BlogEditPageClient에 `initialPost` 전달
**CRUD 유지**: handleSave, handleDelete, handleLint, handleExport → client fetch

### 제약 사항

- 인라인 편집 Record 패턴(company-targets, experience-stories)은 client 상태 유지
- 필터/정렬 변경 후 재조회는 client fetch 유지
- Sprint 5 dynamic import(job-tracker 모달) 구조 보존

---

## T107 — 거대 페이지 2개 + 최종 측정 + 프로덕션 배포

### 배경

프로젝트 내 가장 큰 2개 파일. Phase 1~3에서 숙달한 패턴으로 도전.

### 전환 대상

#### 1. portfolio/settings/page.tsx (969줄)

**현재**: useEffect → `fetch('/api/app/portfolio/settings')` + `fetch('/api/app/resumes')` + 아바타 업로드 + 미리보기
**전환**: Server에서 `getSettingsForOwner(ownerId)` + `listResumesForOwner(ownerId)` → PortfolioSettingsPageClient
**전달 데이터**: initialSettings, initialResumes
**client 유지**: 폼 상태 15+ useState, 아바타 업로드, 미리보기 모달(dynamic), handleSave
**Sprint 5 연계**: PortfolioPreviewOverlay dynamic import 유지

#### 2. resumes/[id]/edit/page.tsx (1,331줄)

**현재**: useEffect → `fetch('/api/app/resumes/{id}')` + `fetch('/api/app/experiences')` + 복합 편집 UI
**전환**: Server에서 `getResumeForOwner(ownerId, id)` + `listExperiencesForOwner(ownerId)` → ResumeEditPageClient
**전달 데이터**: initialResume, initialExperiences
**client 유지**: 항목 CRUD, BulletsEditor, MetricsEditor, 순서 변경, 프리뷰, PDF, 공유 링크
**Sprint 5 연계**: PDF `await import()` 동적 전환 유지

### After 측정 — 스켈레톤 체류시간 (ms)

T104 Before와 동일 조건(프로덕션 빌드, warm, Chrome Performance 탭)으로 재측정.

| 페이지 | Before (ms) | After (ms) | 단축 (ms) | 단축 (%) |
|---|---|---|---|---|
| `/app/audit` | — | — | — | — |
| `/app/feedback` | — | — | — | — |
| `/app/job-tracker` | — | — | — | — |
| `/app/portfolio/settings` | — | — | — | — |
| `/app/resumes/[id]/edit` | — | — | — | — |

### T107 중단 기준 (stop-loss)

settings 또는 resumes/edit의 **warm 중앙값 개선폭이 50ms 미만**이면:
- 해당 페이지는 RSC 전환만으로는 효과 부족으로 판정
- Sprint 6 안에서 2차 분해를 시도하지 않음 — **Sprint 7로 이관**
- 나머지 12개 페이지 전환 성과는 유지 (revert 대상 아님)

### 후속 판단 (Sprint 7 우선순위)

1. **Server Actions + optimistic UI** — Sprint 6 RSC 전환 완료 즉시 진입 (mutation 체감 속도)
2. **settings/resumes-edit 2차 분해** — T107 stop-loss 해당 페이지만 (ShareLinksSection lazy mount 등)

### 프로덕션 배포 + 스모크

| # | 내용 |
|---|---|
| 1 | 게이트 4종 최종 통과 |
| 2 | E2E 17개 최종 통과 |
| 3 | 프로덕션 배포 + HTTP 200 확인 |
| 4 | 스모크: audit 로그 로드 + 페이지네이션 |
| 5 | 스모크: testimonials CRUD (생성/상태변경/삭제) |
| 6 | 스모크: job-tracker 칸반 + 상세 모달 |
| 7 | 스모크: settings 폼 + 미리보기 |
| 8 | 스모크: resumes/edit 항목 추가/편집/순서변경/PDF |
| 9 | history.md Sprint 6 완료 기록 |
| 10 | plan.md Phase 체크 |

### 제약 사항

- 거대 파일 전환 실패 시 해당 페이지만 revert (나머지 12개 전환은 유지)
- 프로덕션 코드 기능 변경 ZERO
