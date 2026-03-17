# PoReSt 작업 검증 체크리스트

기준일: 2026-03-17
문서 정의: `task.md`의 현재 태스크에 대한 상세 검증 항목. 완료 이력은 `history.md` 참조.
관련 문서: `task.md`(작업 상세), `plan.md`(전체 계획), `history.md`(완료 이력)

---

## T88 — 포트폴리오 프로덕션 폴리시

---

### Session A — 포트폴리오 홈 + 공통 (11개)

**수정 파일:** `page.tsx`(홈), `ThemeWrapper.tsx`, `globals.css`

#### A. 프로필 헤더

- [x] 아바타 크기 확대 (h-28 w-28) + ring/shadow 데코레이션
- [x] 이름/헤드라인 타이포그래피 개선 (weight, size, spacing)
- [x] 소셜 링크 아이콘 버튼화 (hover 효과 + 라운드 배경)

#### C. 섹션/레이아웃

- [x] 섹션 간 시각 분리 (구분선 또는 accent bar)
- [x] 기술 스택: pill 크기 + 카테고리별 색상 구분
- [x] 페이지 하단 footer (크레딧 + 공유 유도)
- [x] 추천서: 별점 SVG + 인용 부호 장식

#### D. 반응형/모바일

- [x] 모바일 헤더: 375px에서 텍스트 숨기기 → 아이콘만
- [x] 모바일 프로필 여백 최적화

#### F. 마이크로 인터랙션

- [x] 섹션별 fade-in 진입 애니메이션 (CSS only, globals.css keyframes)
- [x] 버튼/링크 hover 개선 (scale, underline offset, 화살표 이동)

#### Session A 다크모드

- [x] Session A 변경 사항 다크모드 대응 확인

---

### Session B — 하위 페이지 (3개) ✅

**수정 파일:** `experiences/page.tsx`, `projects/page.tsx`, `projects/[slug]/page.tsx`

#### B. 카드 시스템 (하위 페이지)

- [x] 프로젝트 카드: shadow + 기술 태그 pill + hover 변형 + 전체 클릭 영역
- [x] 경력 카드: shadow + 좌측 타임라인 연결선 (세로 라인 + 도트)
- [x] 프로젝트 상세: shadow + 빈 섹션 숨기기 + 섹션 제목 아이콘

#### Session B 다크모드

- [x] Session B 변경 사항 다크모드 대응 확인

---

### Session C — 워크스페이스 (2개)

**수정 파일:** `ExperiencesPageClient.tsx`

#### E. 경력 편집 UX

- [x] 경력 생성 폼: endDate 입력 추가 (isCurrent 체크 시 비활성)
- [x] 경력 편집 폼: startDate/endDate 수정 필드 추가

---

### 세션별 개별 게이트

각 세션은 독립적으로 lint/build 통과 확인 후 커밋.

**Session A 게이트:**
- [x] `npm run lint` 통과
- [x] `npm run build` 통과

**Session B 게이트:**
- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과

**Session C 게이트:**
- [x] `npm run lint` 통과
- [x] `npm run build` 통과

### 통합 게이트 4종 (전 세션 완료 후)

- [x] `npm run lint` 통과 (0 errors, 8 warnings)
- [x] `npm run build` 통과 (Next.js 16.1.6 Turbopack)
- [x] `npx jest --runInBand` 통과 (64 suites, 413 tests)
- [x] `npm run vercel-build` 통과

### Playwright 시각 검증 (통합 후)

- [ ] 포트폴리오 홈 데스크톱 (라이트/다크)
- [ ] 포트폴리오 홈 모바일 375px (라이트/다크)
- [ ] 경력 페이지 데스크톱
- [ ] 프로젝트 목록 데스크톱
- [ ] 프로젝트 상세 데스크톱

---

### 매 태스크 종료 시 공통

- [x] 통합 게이트 4종 통과
- [ ] Playwright 시각 검증 5개 통과
- [x] `task.md`, `checklist.md`, `history.md`, `plan.md` 문서 동기화
