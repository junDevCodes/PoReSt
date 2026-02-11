# M2 배포 체크리스트

## 1) 배포 전 환경 확인
- [ ] 현재 브랜치가 `m1-preview` 또는 배포 대상 브랜치인지 확인
- [ ] 로컬 `.env.local`에서 아래 값이 유효한지 확인
  - [ ] `DATABASE_URL`
  - [ ] `DATABASE_URL_UNPOOLED`
  - [ ] `DATABASE_URL_TEST`
  - [ ] `AUTH_SECRET`
  - [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `DATABASE_URL_TEST`가 운영 DB와 분리된 테스트 DB인지 확인

## 2) 로컬 게이트
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `npx jest --runInBand` 통과

## 3) DB 연결/마이그레이션 확인
- [ ] 테스트 DB 연결 확인
  - [ ] `printf 'SELECT 1;' | DATABASE_URL_UNPOOLED="$DATABASE_URL_TEST" npx prisma db execute --stdin`
  - [ ] `DATABASE_URL_UNPOOLED="$DATABASE_URL_TEST" npx prisma migrate status`
- [ ] 배포 환경에서 `DATABASE_URL_UNPOOLED`가 direct URL인지 확인

## 4) Preview 검증
- [ ] Preview 배포 성공 (`prisma migrate deploy` + `next build`)
- [ ] Public 스모크
  - [ ] `/`
  - [ ] `/projects`
  - [ ] `/projects/[slug]`
- [ ] Private 스모크
  - [ ] 비로그인 `/app/*` 접근 시 `/login?next=...` 리다이렉트
  - [ ] 로그인 후 `next` 경로 복귀
  - [ ] `/app/projects` CRUD
  - [ ] `/app/experiences` CRUD
  - [ ] `/app/resumes` CRUD
  - [ ] PDF 다운로드 버튼 동작
  - [ ] 동기화 배지/알림 노출 확인

## 5) Production 검증
- [ ] Production 환경변수 스코프 확인
  - [ ] `DATABASE_URL` = production pooled
  - [ ] `DATABASE_URL_UNPOOLED` = production direct
- [ ] Production 배포 성공
- [ ] Preview와 동일 스모크 재검증

## 6) 완료 조건
- [ ] API/화면 회귀 없음
- [ ] 401/403/404/409/422 정책 유지
- [ ] 문서 최신화 완료 (`plans/*`, `results/progress_*`)
