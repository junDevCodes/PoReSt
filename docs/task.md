# PoReSt 작업 상세 계획서

기준일: 2026-03-15
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## 현재 태스크: T82 — 포트폴리오 방문 분석 ✅ 완료

### 배경

T78 완료로 포트폴리오 공개 페이지(홈, 경력, 프로젝트, 기술 스택)가 완성되었다.
포트폴리오의 실효성을 측정하려면 **방문 데이터 수집 + 분석 대시보드**가 필요하다.

T79(커스텀 레이아웃)와 병렬 실행 — 서로 의존성 없음.

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| PageView 모델 | 없음 | Prisma `PageView` 모델 + 인덱스 |
| 방문 기록 API | 없음 | `POST /api/public/pageviews` (비인증) |
| 분석 조회 API | 없음 | `GET /api/app/analytics` (인증) |
| 자동 트래킹 | 없음 | 공개 포트폴리오 레이아웃에 PageViewTracker |
| 대시보드 | 없음 | `/app/analytics` (요약/차트/분포/유입경로/최근 방문) |

### PageView 스키마

```prisma
model PageView {
  id        String   @id @default(cuid())
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  pageType  String   // "home" | "experiences" | "projects" | "project_detail"
  pageSlug  String?
  referrer  String?  @db.Text
  createdAt DateTime @default(now())

  @@index([ownerId, createdAt])
  @@index([ownerId, pageType])
  @@map("page_views")
}
```

### 모듈 구조

```
src/modules/pageviews/
├── interface.ts       — DTO + Service interface + Error class
├── implementation.ts  — recordPageView, getAnalytics 구현
├── http.ts           — 에러 응답 헬퍼
└── index.ts          — 모듈 export
```

### API 설계

**POST /api/public/pageviews** (비인증):
- Input: `{ publicSlug, pageType, pageSlug?, referrer? }`
- publicSlug → PortfolioSettings 조회 → ownerId 결정
- PageView 레코드 생성
- `201 Created`

**GET /api/app/analytics** (인증):
- Query: `?days=30` (기본 30일, 최대 90일)
- 응답: `{ summary, dailyViews, pageTypeBreakdown, topReferrers, recentViews }`

### 대시보드 UI 구성

1. **요약 카드** (4칸): 전체/오늘/이번 주/이번 달 조회수
2. **일별 차트**: CSS 바 차트 (30일), 호버 툴팁
3. **페이지별 분포**: 가로 프로그레스 바 + 퍼센트
4. **유입 경로**: 도메인별 카운트
5. **최근 방문**: 테이블 (최대 20건)

### 변경 파일 목록

**스키마**:
- `prisma/schema.prisma` — PageView 모델 + User 관계 추가

**모듈**:
- `src/modules/pageviews/interface.ts` — 신규
- `src/modules/pageviews/implementation.ts` — 신규
- `src/modules/pageviews/http.ts` — 신규
- `src/modules/pageviews/index.ts` — 신규

**API**:
- `src/app/api/public/pageviews/route.ts` — POST 기록
- `src/app/api/app/analytics/route.ts` — GET 분석

**클라이언트 트래킹**:
- `src/components/portfolio/PageViewTracker.tsx` — 신규
- `src/app/(public)/portfolio/[publicSlug]/layout.tsx` — 트래커 삽입

**대시보드**:
- `src/app/(private)/app/analytics/page.tsx` — 서버 컴포넌트
- `src/app/(private)/app/analytics/AnalyticsPageClient.tsx` — 클라이언트 컴포넌트

**사이드바**:
- `src/components/app/AppSidebar.tsx` — "방문 분석" 메뉴 추가

---

## T82 완료 기준

- PageView 모델이 DB에 생성됨
- 공개 포트폴리오 페이지 방문 시 PageView 자동 기록
- `/app/analytics` 대시보드에서 방문 통계 확인 가능
- 요약(전체/오늘/주/월), 일별 차트, 페이지 분포, 유입 경로, 최근 방문 표시
- 게이트 4종 통과

## T82 게이트

- [x] `npm run lint` 통과 (0 errors, 6 warnings)
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (54 suites, 203 tests)
- [x] `npm run vercel-build` 통과 (Zod enum 호환성 수정 포함)
- [ ] push 후 Vercel 배포 성공

---

## 다음 태스크: T80-1 — Gemini 클라이언트 모듈 (대기)

T79 ✅ + T82 ✅ 완료. plan.md Wave6 참조.
