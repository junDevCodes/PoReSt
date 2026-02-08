# M1 요구사항 일치도 매트릭스 (2026-02-07)

## 평가 기준
- 기준 문서: `docs/05_Requirements_Spec.md`
- 평가 범위: M1 관련 `FR-PUB-*`, `FR-AUTH-*`, `FR-PORT-*`, `AC-01~03`
- 판정 값: `Pass` / `Partial` / `Fail` / `Deferred`

## 게이트 결과
- `npm run lint` 통과
- `npm run build` 통과
- `.env.local` 로드 후 `npx jest --runInBand` 통과 (9/9 suite, 34/34 test)

## FR 매트릭스
| ID | 판정 | 근거 |
|---|---|---|
| FR-PUB-01 | Pass | 홈에서 featured 프로젝트 렌더: `src/app/(public)/page.tsx` |
| FR-PUB-02 | Pass | 프로젝트 목록 페이지 렌더: `src/app/(public)/projects/page.tsx` |
| FR-PUB-03 | Pass | slug 상세 페이지 렌더/404 처리: `src/app/(public)/projects/[slug]/page.tsx` |
| FR-PUB-04 | Pass | 상세 템플릿(Problem/Approach/Architecture/Results/Links) 렌더: `src/app/(public)/projects/[slug]/page.tsx` |
| FR-PUB-05 | Partial | metadata/sitemap/robots 구현 완료(`src/app/sitemap.ts`, `src/app/robots.ts`), OG/canonical 보강 필요 |
| FR-PUB-06 | Pass | Public index + Private noindex: `src/app/(private)/layout.tsx` |
| FR-AUTH-01 | Pass | `/app/*` 비인증 접근 시 `/login?next=...` 리다이렉트: `middleware.ts`, `src/lib/__tests__/middleware-auth-flow.test.ts` |
| FR-AUTH-02 | Pass | 로그인 시 `next` 우선 callback 적용: `src/components/auth/OwnerSignInView.tsx` |
| FR-AUTH-03 | Pass | 오너 전용 접근 제어(`isOwner`) 적용: `middleware.ts` |
| FR-AUTH-04 | Pass | 세션 부재/만료 시 보호 경로 재로그인 플로우 동작: `middleware.ts`, `src/lib/__tests__/middleware-auth-flow.test.ts` |
| FR-PORT-01 | Pass | Project CRUD API + 관리 UI 구현: `src/app/api/app/projects/`, `src/app/(private)/app/projects/page.tsx` |
| FR-PORT-02 | Pass | Experience CRUD API + 관리 UI 구현: `src/app/api/app/experiences/`, `src/app/(private)/app/experiences/page.tsx` |
| FR-PORT-03 | Pass | slug 기반 Public 상세 제공: `src/app/api/public/projects/[slug]/route.ts` |
| FR-PORT-04 | Pass | `isFeatured` 규칙/토글 반영(API+UI): `src/modules/projects/implementation.ts`, `src/app/(private)/app/projects/page.tsx` |
| FR-PORT-05 | Pass | Public DTO select 제한 적용: `src/modules/projects/implementation.ts` |

## AC 매트릭스
| ID | 판정 | 근거 |
|---|---|---|
| AC-01 | Pass | Public 3페이지 구현 및 빌드 통과: `src/app/(public)/page.tsx`, `src/app/(public)/projects/page.tsx`, `src/app/(public)/projects/[slug]/page.tsx` |
| AC-02 | Pass | `/app/*`, `/api/app/*` 차단/401/403 검증: `middleware.ts`, `src/lib/__tests__/middleware-auth-flow.test.ts` |
| AC-03 | Partial | CRUD 반영은 충족하나 Public ISR(`revalidate=60`)로 최대 60초 지연 가능, 즉시 반영 보장은 on-demand revalidate 필요 |

## 배포 증거
- Preview URL: `미등록 (로컬 검증 완료, 배포 미실행)`
- Production URL: `미등록 (Preview 승인 후 진행)`

## 보류(Deferred)
- OG 이미지/Canonical 정책 강화 (FR-PUB-05 잔여)
- Public 즉시 반영(on-demand revalidate) (AC-03 잔여)
