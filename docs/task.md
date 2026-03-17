# PoReSt 작업 상세 계획서

기준일: 2026-03-17
문서 정의: `plan.md`에서 할당된 현재 기능 단위의 작업 상세 설계. 완료 시 `history.md`로 이동.
관련 문서: `plan.md`(전체 계획), `checklist.md`(검증 체크리스트), `history.md`(완료 이력)

---

## T88 — 포트폴리오 프로덕션 폴리시

### 진단 결과 (2026-03-17 프로덕션 스크린샷 기반)

현재 포트폴리오는 **기능은 동작하지만 와이어프레임 수준**의 디자인이다.
"HR이 10초 안에 인상 받는" 수준이 목표.

### 현재 → 목표

| 항목 | 현재 | 목표 |
|---|---|---|
| 카드 디자인 | 테두리만 있는 flat 카드 | shadow + hover + depth |
| 프로필 헤더 | 작은 아바타 + 평면 텍스트 | 시각적 계층, 브랜딩 느낌 |
| 섹션 구분 | mt-14 간격만 | 시각적 분리 (그라데이션/구분선) |
| 인터랙션 | 없음 (정적) | hover, transition, 마이크로 애니메이션 |
| 프로젝트 카드 | 텍스트만 나열 | 기술 태그 pill + hover 효과 |
| 경력 카드 | 기본 정보만 | 타임라인 연결선 + 시각 보강 |
| 기술 스택 | 텍스트 pill만 | 브랜드 아이콘 크기 확대 + 카테고리 색상 |
| 모바일 헤더 | 인쇄/PDF 텍스트 깨짐 | 아이콘만 표시 (375px) |
| 페이지 하단 | 콘텐츠 끝나면 빈 공간 | footer 또는 CTA |
| 프로젝트 상세 | 5개 섹션 동일 카드 | 빈 섹션 숨기기 + 섹션별 아이콘 |
| 페이지 전환 | 즉시 전환 (깜빡임) | loading skeleton 또는 fade |

### 핵심 변경 (17개 항목)

#### A. 프로필 헤더 개선 (3개)

1. **아바타 크기 확대 + 데코레이션**
   - `h-20 w-20` → `h-28 w-28` + ring/shadow
   - 다크모드 ring 색상 조정

2. **프로필 정보 시각 계층 강화**
   - 이름: font-weight + letter-spacing 조정
   - 헤드라인: text-lg → text-xl, 색상 대비 강화
   - 가용성 배지/위치/이메일: 아이콘 크기 통일 + gap 조정

3. **소셜 링크 스타일 개선**
   - 아이콘 버튼화 (hover 효과 + 라운드 배경)

#### B. 카드 시스템 개선 (4개)

4. **공통 카드 스타일 업그레이드**
   - `shadow-sm` 추가 (라이트모드)
   - `hover:shadow-md transition-shadow duration-200`
   - 다크모드: `dark:shadow-none` 유지, border 강조

5. **프로젝트 카드 개선**
   - 기술 스택 태그 pill 표시
   - hover 시 scale 또는 translateY 미세 변형
   - 상세 보기 링크 → 카드 전체 클릭 영역

6. **경력 카드 개선**
   - 좌측 타임라인 연결선 (세로 라인 + 도트)
   - 기간 포맷 시각 보강

7. **프로젝트 상세 섹션 개선**
   - 빈 섹션 숨기기 (placeholder 텍스트 제거)
   - 섹션 제목에 아이콘 추가 (Problem: 🎯, Approach: 💡 등)

#### C. 섹션/레이아웃 개선 (4개)

8. **섹션 간 시각 분리**
   - 구분선 또는 여백 + 배경색 교대
   - 섹션 제목 스타일 통일 (underline 또는 좌측 accent bar)

9. **기술 스택 섹션 개선**
   - pill 크기 확대 + 아이콘 크기 조정
   - 카테고리별 색상 구분 (Frontend: blue, Backend: green 등)

10. **페이지 하단 footer/CTA**
    - 공유/연락 유도 영역
    - "이 포트폴리오는 PoReSt로 만들어졌습니다" 크레딧

11. **추천서 섹션 개선**
    - 별점 시각화 (SVG 별)
    - 카드 디자인 + 인용 부호 장식

#### D. 반응형/모바일 (2개)

12. **모바일 헤더 최적화**
    - 375px에서 "인쇄", "PDF 저장" 텍스트 숨기기 → 아이콘만
    - 버튼 간격 조정

13. **모바일 프로필 레이아웃**
    - 아바타 + 이름 수직 정렬 (현재도 동작하지만 여백 최적화)

#### E. 워크스페이스 경력 편집 UX (1개)

16. **경력 날짜 필드 보완**
    - 생성 폼: `endDate` input 추가 (isCurrent 체크 시 disabled)
    - 편집 폼: `startDate`, `endDate` 수정 필드 추가
    - 스키마/API는 이미 지원 — UI만 누락

#### F. 마이크로 인터랙션 (2개)

17. **페이지 진입 애니메이션**
    - 섹션별 fade-in + slide-up (CSS animation, 라이브러리 없이)

18. **링크/버튼 hover 개선**
    - CTA 버튼: hover scale + 색상 전환
    - 텍스트 링크: underline offset 애니메이션
    - 뒤로가기 링크: 화살표 이동 애니메이션

### 병렬 실행 구조

파일 충돌 기준으로 3개 세션 동시 실행 가능.

```
Session A (포트폴리오 홈 + 공통)     Session B (하위 페이지)          Session C (워크스페이스)
───────────────────────────        ──────────────────────        ──────────────────────
A1. 아바타 데코레이션               B5. 프로젝트 카드 개선           E16. 경력 날짜 필드 보완
A2. 프로필 시각 계층                B6. 경력 카드 타임라인
A3. 소셜 링크 스타일                B7. 프로젝트 상세 빈 섹션
C8. 섹션 간 시각 분리
C9. 기술 스택 섹션
C10. footer/CTA
C11. 추천서 섹션
D12. 모바일 헤더 최적화
D13. 모바일 프로필 여백
F17. 진입 애니메이션
F18. hover 개선
        ↘               통합 게이트 (lint/build/jest/vercel-build)              ↙
```

#### 세션별 수정 파일 (충돌 없음)

| 세션 | 수정 파일 | 항목 수 |
|---|---|---|
| **Session A** | `page.tsx`(홈), `ThemeWrapper.tsx`, `globals.css` | 11개 |
| **Session B** | `experiences/page.tsx`, `projects/page.tsx`, `projects/[slug]/page.tsx` | 3개 |
| **Session C** | `ExperiencesPageClient.tsx` | 1개 (+ 생성폼 endDate, 편집폼 날짜) |

#### 의존성

- **A → B**: Session B의 카드 스타일은 Tailwind 유틸리티 클래스 직접 적용 (globals.css 의존 없음)
- **A ∥ B ∥ C**: 3개 세션 완전 독립 실행 가능
- **통합**: 3개 세션 모두 완료 후 게이트 4종 재실행

#### B4 (공통 카드 스타일) 처리

공통 카드 스타일 업그레이드(shadow/hover/transition)는 각 세션에서 **Tailwind 유틸리티 클래스를 직접 적용**하는 방식으로 처리.
globals.css에 공통 클래스 추가 불필요 → 세션 간 의존성 제거.

### 변경 파일 목록

**Session A (포트폴리오 홈 + 공통):**
- `src/app/(public)/portfolio/[publicSlug]/page.tsx` — 프로필, 섹션, footer, 추천서
- `src/components/portfolio/ThemeWrapper.tsx` — 모바일 헤더
- `src/app/(public)/globals.css` — 애니메이션 keyframes + 다크모드

**Session B (하위 페이지):**
- `src/app/(public)/portfolio/[publicSlug]/experiences/page.tsx` — 경력 타임라인
- `src/app/(public)/portfolio/[publicSlug]/projects/page.tsx` — 프로젝트 카드
- `src/app/(public)/portfolio/[publicSlug]/projects/[slug]/page.tsx` — 상세 빈 섹션

**Session C (워크스페이스):**
- `src/app/(private)/app/experiences/ExperiencesPageClient.tsx` — 날짜 필드

### 제약 사항

- 외부 CSS/JS 라이브러리 추가 금지 (Tailwind CSS만 사용)
- 기존 데이터 모델/API 변경 없음
- 기존 테스트 깨뜨리지 않음
- 다크모드 일관성 유지
- 공통 카드 스타일은 Tailwind 유틸리티 직접 적용 (globals.css 공유 클래스 금지 → 세션 독립성 보장)
