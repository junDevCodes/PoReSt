# PoReSt 작업 검증 체크리스트

기준일: 2026-03-18
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T90 — 프론트엔드 성능 최적화 + P1 코드 품질 정리

---

### Session A — P1 코드 품질 정리 (4개)

**수정 파일:** `src/lib/format-resume-data.ts`(이동), `edit/page.tsx`, `share/page.tsx`, `pdf.ts`, 테스트

#### A1. format-resume-data 공용 위치 이동

- [x] `src/app/(private)/app/resumes/_lib/format-resume-data.ts` → `src/lib/format-resume-data.ts` 이동
- [x] `edit/page.tsx` import 경로 `@/lib/format-resume-data`로 수정
- [x] `share/[token]/page.tsx` import 경로 수정 (P2 크로스 바운더리 해결)
- [x] `_lib/pdf.ts` import 경로 수정
- [x] 테스트 파일 이동 + import 수정
- [x] 원본 파일 삭제 확인

#### A2. 중복 파서 제거

- [x] `safeParseBullets()` 제거 → `parseBullets()` from `@/lib/format-resume-data` import
- [x] `safeParseMetrics()` 제거 → `parseMetrics()` from `@/lib/format-resume-data` import
- [x] `FormattedBullets`/`FormattedMetrics` 컴포넌트 정상 동작 확인

#### A3. parseBulletsFromJson 리팩토링

- [x] `parseBulletsFromJson()` → `parseBullets()` + `.filter().map()` 패턴으로 단순화
- [x] `parseMetricsFromJson()` → `parseMetrics()` 위임으로 단순화
- [x] 빈 문자열 필터 로직 보존 (편집기에서 빈 행 제외)

#### A4. ShareLinksSection fetch 통합

- [x] `fetchLinks()` (useEffect 내) 제거
- [x] `loadLinks()` 에 signal 가드 패턴 적용
- [x] useEffect에서 `loadLinks()` 직접 호출
- [x] `handleCreate`/`handleRevoke` 후 `loadLinks()` 재사용 유지

---

### Session B — 포트폴리오 성능 최적화 (7개)

**수정 파일:** `portfolio/*/page.tsx`, `loading.tsx`(신규 3개), `next.config.ts`

#### B5. 포트폴리오 홈 데이터 페칭 병렬화

- [x] 최상위 쿼리 `Promise.all` 병렬화 (skills + testimonials + entityLinks 동시)
- [x] 기존 데이터 흐름 보존 (viewModel 구성 변경 없음)
- [x] ISR revalidate = 60 유지

#### B6. 아바타 next/image 전환

- [x] 포트폴리오 홈 `<img>` → `<Image>` + `priority` (LCP 대응)
- [x] `width`/`height` 명시 (112x112)
- [x] className 유지 (ring, shadow 등)
- [x] avatarUrl 없는 경우 fallback 유지

#### B7. next.config.ts 이미지 설정

- [x] `images.remotePatterns` 추가 (Vercel Blob + Google 프로필)
- [x] 빌드 성공 확인

#### B8. loading.tsx 추가

- [x] `/portfolio/[publicSlug]/loading.tsx` — 프로필 스켈레톤
- [x] `/portfolio/[publicSlug]/experiences/loading.tsx` — 타임라인 스켈레톤
- [x] `/portfolio/[publicSlug]/projects/loading.tsx` — 카드 그리드 스켈레톤
- [x] `animate-pulse` Tailwind 기반 (외부 라이브러리 없이)

#### B9. 하위 페이지 데이터 페칭 병렬화

- [x] 경력 목록: settings 후 experiences + entityLinks + publicProjects → `Promise.all`
- [x] 프로젝트 목록: 단일 쿼리 (병렬화 대상 없음)
- [x] 프로젝트 상세: 단일 쿼리 (병렬화 대상 없음)

#### B10. 스킬 아이콘 CLS 방지

- [x] `<img>` 태그 `width={16} height={16}` 명시 (CLS 방지)
- [x] `loading="lazy"` 기존 적용 확인

#### B11. Lighthouse 기준선 측정

- [ ] 프로덕션 배포 후 Lighthouse 모바일 측정
- [ ] LCP / FCP / CLS / TBT 수치 기록
- [ ] history.md에 성능 기준선 문서화

---

### 세션별 개별 게이트

**Session A 게이트:**
- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과
- [x] 기존 format-resume-data 테스트 통과 (16개)
- [x] 전체 Jest 통과 (65 suites, 429 tests)

**Session B 게이트:**
- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과

### 통합 게이트 4종 (전 세션 완료 후)

- [x] `npm run lint` 통과 (0 errors, 8 warnings) ✅ 2026-03-18 최종 확인
- [x] `npm run build` 통과 ✅
- [x] `npx jest --runInBand` 통과 (65 suites, 429 tests) ✅
- [x] `npm run vercel-build` 통과 ✅

### Playwright 시각 검증 (프로덕션) ✅ 2026-03-18

- [x] 포트폴리오 홈 정상 렌더링 (next/image 아바타, 섹션 순서, 다크/라이트 전환)
- [x] 포트폴리오 하위 페이지 정상 (경력 타임라인, 프로젝트 목록, 프로젝트 상세)
- [x] 이력서 생성 페이지 정상 (DRAFT 고정 배지 + 안내 문구)
- [x] 이력서 공유 페이지 에러 처리 정상 (잘못된 토큰 → "찾을 수 없습니다")
- [x] 모바일 뷰포트 (390x844) 라이트/다크 모두 정상 렌더링

---

### 매 태스크 종료 시 공통

- [x] 통합 게이트 4종 통과 ✅ 2026-03-18
- [x] Playwright 시각 검증 통과 ✅ 2026-03-18
- [ ] Lighthouse 기준선 기록 (수동 측정 필요)
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화 ✅
