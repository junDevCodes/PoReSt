# M5 Production 배포 체크리스트 (Feedback)

완료일: 2026-02-11

## 1) 배포 전 확인
- [x] M5 Preview 체크리스트 100% 통과
- [x] PR 승인/머지 완료
- [x] Production 환경변수 확인 (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_*`, `NEXT_PUBLIC_SITE_URL`)

## 2) Production 배포
- [x] Vercel Production 배포 시작
- [x] Build 로그에서 `prisma migrate deploy` 성공 확인
- [x] Build 로그에서 `next build` 성공 확인

## 3) Production 스모크
- [x] `/app/feedback` 목록 로드
- [x] `/app/feedback/new` 요청 생성
- [x] `/app/feedback/[id]` 결과 상세 및 심각도 렌더링
- [x] `Run` 재실행 동작 확인
- [x] `Compare` diff 동작 확인
- [x] 비인증 API 접근 401 확인
- [x] 권한 없는 접근 403 확인

## 4) 전체 회귀
- [x] Public 페이지(`/`, `/projects`, `/projects/[slug]`) 정상
- [x] Private 주요 화면(`/app/projects`, `/app/experiences`, `/app/resumes`, `/app/notes`, `/app/blog`) 정상
- [x] API 에러 매핑(401/403/404/409/422) 유지

## 5) 배포 후 정리
- [x] `plans/task.md`, `plans/checklist.md` 상태 최종 반영
- [x] `results/progress_YYYY-MM-DD.md` 배포 결과 기록
- [x] M1.1 Deferred 및 UI/UX 개선 백로그 착수

## 6) Auth 전환 회귀 (2026-02-18)
- [x] 비로그인 `/app/*` 접근 시 `/login?next=...` 리다이렉트 확인
- [x] 일반 로그인 사용자 도메인 CRUD 정상 동작 확인
- [x] ownerId 데이터 격리 유지 확인(타 사용자 데이터 접근 차단)
- [x] 운영성 API 비오너 접근 시 403 유지 확인
- [x] canonical 공개 경로(`/u/[publicSlug]/*`) 정상 응답 확인
- [x] 레거시 `/projects/[slug]` 접근 시 canonical 경로 리다이렉트 확인


