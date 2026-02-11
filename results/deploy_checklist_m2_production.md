# M2 Production 배포 체크리스트

## 1) 배포 전 설정 확인
- [ ] Vercel `Production` 환경에 `DATABASE_URL`가 Production pooled URL로 설정되어 있다.
- [ ] Vercel `Production` 환경에 `DATABASE_URL_UNPOOLED`가 Production direct URL로 설정되어 있다.
- [ ] Vercel `Production` 환경에 `AUTH_SECRET`, `AUTH_URL`(또는 동등 설정), `NEXT_PUBLIC_SITE_URL`이 올바르게 설정되어 있다.
- [ ] Production 환경에 Preview/Test DB URL이 남아 있지 않다.
- [ ] `ep-divine-cherry` 등 과거 폐기 endpoint 값이 남아 있지 않다.

## 2) 배포 실행
- [ ] `main` 기준으로 Production 배포를 실행한다.
- [ ] 배포 로그에서 `prisma migrate deploy` 성공을 확인한다.
- [ ] 배포 로그에서 `No pending migrations to apply` 또는 마이그레이션 적용 성공 로그를 확인한다.
- [ ] 배포 로그에서 `next build` 완료를 확인한다.

## 3) Production 스모크 테스트
- [ ] `/` 페이지가 정상 렌더링된다.
- [ ] `/projects` 목록 페이지가 정상 렌더링된다.
- [ ] `/projects/[slug]` 상세 페이지가 정상 렌더링된다.
- [ ] 잘못된 slug 접근 시 404 동작이 정상이다.
- [ ] 비로그인 상태에서 `/app/*` 접근 시 `/login?next=...`로 리다이렉트된다.
- [ ] 로그인 후 `next` 경로로 복귀한다.
- [ ] `/app/projects`에서 생성/수정/삭제가 동작한다.
- [ ] `/app/experiences`에서 생성/수정/삭제가 동작한다.
- [ ] `/app/resumes`에서 생성/수정/삭제가 동작한다.
- [ ] `/app/resumes/[id]/edit`의 PDF 다운로드가 동작한다.
- [ ] `/app/resumes/[id]/edit`의 동기화 배지/알림이 동작한다.

## 4) API 정책 회귀 확인
- [ ] 비인증 요청에 대해 401이 반환된다.
- [ ] 권한 없는 요청에 대해 403이 반환된다.
- [ ] 없는 리소스 요청에 대해 404가 반환된다.
- [ ] 중복 생성 충돌에 대해 409가 반환된다.
- [ ] 검증 실패에 대해 422가 반환된다.

## 5) 배포 후 마감
- [ ] `plans/task.md`와 `plans/checklist.md` 상태를 최종 반영한다.
- [ ] `results/progress_2026-02-07.md`에 Production 배포 검증 결과를 기록한다.
- [ ] 문제 발생 시 직전 정상 배포로 롤백할 수 있는 커밋/배포 번호를 기록한다.

## 승인 기준
- [ ] 위 항목이 모두 체크되면 M2 Production 배포를 승인한다.
