# M5 Preview 배포 체크리스트 (Feedback)

완료일: 2026-02-11

## 1) 사전 게이트
- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] `.env.local` 로드 후 `npx jest --runInBand` 통과
- [x] `npm run vercel-build` 로컬 통과

## 2) 마이그레이션/DB
- [x] Preview DB에서 `prisma migrate status`가 `Database schema is up to date!`
- [x] `DATABASE_URL` / `DATABASE_URL_UNPOOLED`가 Preview용 DB 브랜치를 가리킴
- [x] `DATABASE_URL_TEST`는 테스트 전용 DB를 가리킴

## 3) 기능 스모크 (Preview URL)
- [x] `/app/feedback` 목록 진입
- [x] `/app/feedback/new`에서 대상 선택 후 요청 생성
- [x] `/app/feedback/[id]` 상세에서 항목/심각도 렌더링 확인
- [x] `Run` 실행 시 결과 재생성 확인
- [x] `Compare`에서 이전 실행 대비 diff 표시 확인

## 4) API/보안 스모크
- [x] 비인증 상태에서 `/api/app/feedback*` 접근 시 401
- [x] 타 오너 데이터 접근 시 403
- [x] 존재하지 않는 요청 조회 시 404
- [x] 잘못된 입력값 전송 시 422

## 5) 회귀 스모크
- [x] `/api/public/*` 정상 응답
- [x] `/app/projects`, `/app/experiences`, `/app/resumes`, `/app/notes`, `/app/blog` 주요 동작 회귀 없음
- [x] 로그인 리다이렉트(`/login?next=...`) 회귀 없음

## 6) 완료 판정
- [x] Preview 체크 항목 100% 통과
- [x] `results/pr_m5_preview.md` 작성/갱신
- [x] PR 리뷰 요청 완료

## 7) Auth 전환 회귀 (2026-02-18)
- [x] 비로그인 사용자가 `/app/*` 접근 시 `/login?next=...`로 리다이렉트
- [x] 로그인 사용자 CRUD 정상 동작(`/app/projects`, `/app/resumes`, `/app/notes`, `/app/blog`)
- [x] 사용자 간 ownerId 스코프 격리 유지(타 사용자 데이터 접근 불가)
- [x] 운영성 API(`/api/app/revalidate`, `/api/app/db-test`, `/api/app/test/owner`) 비오너 403 유지
- [x] canonical 공개 경로(`/u/[publicSlug]`, `/u/[publicSlug]/projects`, `/u/[publicSlug]/projects/[slug]`) 정상 동작
- [x] 레거시 경로(`/projects/[slug]`)가 canonical 경로로 리다이렉트


