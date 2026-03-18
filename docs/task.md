# PoReSt 작업 상세 계획서

기준일: 2026-03-18
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T90 — 프론트엔드 성능 최적화 + P1 코드 품질 정리

### 진단 결과 (2026-03-18 코드 분석 기반)

#### 성능 병목

| 병목 | 현재 | 영향 |
|---|---|---|
| 포트폴리오 홈 쿼리 | 4개 그룹 순차 실행 (~180ms) | TTFB 지연 |
| 아바타 이미지 | `<img>` 직접 사용, 최적화 없음 | LCP 저하 |
| 스킬 아이콘 | `<img>` width/height 미명시 | CLS 유발 |
| next.config | 이미지 remotePatterns 미설정 | next/image 사용 불가 |
| loading.tsx | 전무 | 페이지 전환 시 빈 화면 (체감 느림) |
| 하위 페이지 쿼리 | 경력/프로젝트 목록도 순차 | TTFB 지연 |

#### T89 코드 품질 (P1 리뷰 지적)

| 지적 | 위치 | 문제 |
|---|---|---|
| 중복 파서 3개 | `edit/page.tsx` L128,158,163 | `safeParseBullets`/`safeParseMetrics` ≈ `format-resume-data.ts` 중복 |
| fetch 중복 | `edit/page.tsx` L362,373 | `loadLinks()` / `fetchLinks()` 동일 로직, mounted 보호 불균형 |
| 크로스 바운더리 | `share/page.tsx` L6 | `(public)` → `(private)` import |

### 핵심 원칙

- **측정 기반**: 감이 아닌 실제 데이터(Lighthouse, 쿼리 시간)로 판단
- **기존 기능 보호**: 65 suites, 429 tests 기준선 유지
- **체감 개선 우선**: 사용자가 "빨라졌다"고 느끼는 변경 우선 (loading UI, 이미지)
- **P1 정리 동시 수행**: 기술 부채가 쌓이기 전에 즉시 해소

---

### 핵심 변경 (11개 항목)

#### A. P1 코드 품질 정리 (4개)

1. **`format-resume-data.ts` 공용 위치 이동**
   - `src/app/(private)/app/resumes/_lib/format-resume-data.ts` → `src/lib/format-resume-data.ts`
   - import 경로 일괄 수정: `edit/page.tsx`, `share/[token]/page.tsx`, `_lib/pdf.ts`
   - 테스트 파일 import 경로 수정
   - 원본 파일 삭제 (이동 완료 후)
   - → P2 크로스 바운더리 import 문제 동시 해결

2. **편집 페이지 중복 파서 제거**
   - `safeParseBullets()` 제거 → `parseBullets()` import로 교체
   - `safeParseMetrics()` 제거 → `parseMetrics()` import로 교체
   - `FormattedBullets`/`FormattedMetrics` 컴포넌트에서 공용 함수 사용

3. **`parseBulletsFromJson` 리팩토링**
   - 현재: 독립 파서 (문자열만 허용, 빈 문자열 필터)
   - 변경: `parseBullets()` 호출 → `BulletEntry[]` 매핑
   - 빈 문자열 필터는 매핑 단계에서 처리
   - `parseMetricsFromJson` 동일 패턴으로 정리

4. **ShareLinksSection fetch 중복 통합**
   - `loadLinks()` (L362) + `fetchLinks()` (L373) → 단일 `loadLinks()` 함수
   - useEffect에서 `loadLinks()` 호출 + cleanup 패턴 유지
   - `handleCreate`/`handleRevoke` 후 `loadLinks()` 재사용
   - mounted 가드 패턴 통일

#### B. 포트폴리오 성능 최적화 (7개)

5. **포트폴리오 홈 데이터 페칭 병렬화**
   - 현재: skills → settings+entityLinks → testimonials 순차 실행
   - 변경: `Promise.all([getPublicPortfolio(), skills, testimonials, entityLinks])` 최상위 병렬화
   - 이미 내부 병렬화된 `buildPublicPortfolioBySettings()`와 결합
   - 예상 개선: ~180ms → ~120ms (30% 단축)

6. **아바타 `next/image` 전환**
   - 포트폴리오 홈 `page.tsx`: `<img>` → `<Image>` + `priority` (LCP 요소)
   - 설정 미리보기 `PublicPortfolioPreview.tsx`: 동일 전환
   - `width={112} height={112}` (h-28 w-28 = 7rem = 112px)
   - 자동 AVIF/WebP 포맷 + srcset 생성

7. **`next.config.ts` 이미지 설정**
   - `images.remotePatterns` 추가:
     - Vercel Blob: `*.public.blob.vercel-storage.com`
     - (필요 시 Google 프로필: `lh3.googleusercontent.com`)
   - `images.formats`: `['image/avif', 'image/webp']` (이미 Next.js 기본값이지만 명시)

8. **포트폴리오 `loading.tsx` 추가**
   - `/portfolio/[publicSlug]/loading.tsx` — 프로필 헤더 스켈레톤 + 섹션 placeholder
   - `/portfolio/[publicSlug]/experiences/loading.tsx` — 타임라인 스켈레톤
   - `/portfolio/[publicSlug]/projects/loading.tsx` — 카드 그리드 스켈레톤
   - Tailwind `animate-pulse` 활용 (외부 라이브러리 없이)

9. **하위 페이지 데이터 페칭 병렬화**
   - 경력 목록 (`experiences/page.tsx`): settings + experiences + entityLinks → `Promise.all`
   - 프로젝트 목록 (`projects/page.tsx`): settings + projects → `Promise.all`
   - 프로젝트 상세 (`projects/[slug]/page.tsx`): settings + project → `Promise.all`

10. **스킬 아이콘 로딩 최적화**
    - `<img>` 태그에 `width`/`height` 명시적 설정 (CLS 방지)
    - `loading="lazy"` 추가 (뷰포트 밖 아이콘 지연 로드)
    - 스킬 아이콘은 CDN SVG이므로 `next/image` 전환 불필요 (오히려 역효과)

11. **Lighthouse 기준선 측정 + 기록**
    - 프로덕션 배포 후 Lighthouse 측정 (모바일 + 데스크톱)
    - LCP / FCP / CLS / TBT 수치 기록
    - `history.md`에 성능 기준선 문서화

---

### 병렬 실행 구조

파일 충돌 기준으로 2개 세션 동시 실행 가능.

```
Session A (P1 코드 품질) ✅            Session B (포트폴리오 성능) ✅
──────────────────────                ──────────────────────
A1. format-resume-data 이동 ✅        B5. 홈 데이터 병렬화 ✅
A2. 중복 파서 제거 ✅                 B6. 아바타 next/image ✅
A3. parseBulletsFromJson 리팩토링 ✅  B7. next.config 이미지 설정 ✅
A4. ShareLinksSection 통합 ✅         B8. loading.tsx 추가 ✅
                                      B9. 하위 페이지 병렬화 ✅
                                      B10. 스킬 아이콘 CLS 방지 ✅
                                      B11. Lighthouse 기준선 (배포 후)
         ↘      통합 게이트 ✅ (lint/build/jest/vercel-build) 2026-03-18       ↙
```

### 세션별 수정 파일 (충돌 없음)

| 세션 | 수정 파일 | 항목 수 |
|---|---|---|
| **Session A** | `src/lib/format-resume-data.ts`(이동), `edit/page.tsx`, `share/[token]/page.tsx`, `_lib/pdf.ts`, 테스트 | 4개 |
| **Session B** | `portfolio/*/page.tsx`(홈+하위 4개), `loading.tsx`(신규 3개), `next.config.ts` | 7개 |

### 의존성

- **A ∥ B**: 완전 독립 실행 가능 (파일 겹침 없음)
- **B7 → B6**: `next.config.ts` remotePatterns 설정이 `next/image` 사용 전제
  - 같은 세션 내에서 순서 보장 (B7 먼저 → B6 적용)
- **B11**: B5~B10 모두 완료 + 배포 후 실행
- **통합**: 양 세션 완료 후 게이트 4종 재실행

### 변경 파일 목록

**Session A (P1 정리):**
- `src/lib/format-resume-data.ts` — 이동 대상 (기존 `_lib/` 에서)
- `src/lib/__tests__/format-resume-data.test.ts` — 테스트 이동
- `src/app/(private)/app/resumes/[id]/edit/page.tsx` — 중복 제거 + import 수정
- `src/app/(public)/resume/share/[token]/page.tsx` — import 경로 수정
- `src/app/(private)/app/resumes/_lib/pdf.ts` — import 경로 수정

**Session B (성능 최적화):**
- `src/app/(public)/portfolio/[publicSlug]/page.tsx` — 병렬화 + next/image + 스킬 아이콘
- `src/app/(public)/portfolio/[publicSlug]/loading.tsx` — 신규
- `src/app/(public)/portfolio/[publicSlug]/experiences/page.tsx` — 병렬화
- `src/app/(public)/portfolio/[publicSlug]/experiences/loading.tsx` — 신규
- `src/app/(public)/portfolio/[publicSlug]/projects/page.tsx` — 병렬화
- `src/app/(public)/portfolio/[publicSlug]/projects/loading.tsx` — 신규
- `src/app/(public)/portfolio/[publicSlug]/projects/[slug]/page.tsx` — 병렬화
- `next.config.ts` — 이미지 설정

### 제약 사항

- 외부 라이브러리 추가 금지 (기존 스택만)
- 기존 API/Prisma 스키마 변경 없음
- 기존 테스트 깨뜨리지 않음 (65 suites, 429 tests 기준선)
- ISR 60초 revalidate 설정 유지
- 포트폴리오 다크모드/라이트모드 동작 유지
