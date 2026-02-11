# M4 Production 배포 체크리스트 (Blog)

## 1) 배포 전 확인
- [ ] M4 Preview 체크리스트 100% 통과
- [ ] PR 승인/머지 완료
- [ ] Production 환경변수 스코프 확인 (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_*`, `NEXT_PUBLIC_SITE_URL`)

## 2) Production 배포
- [ ] Vercel Production 배포 시작
- [ ] Build 로그에서 `prisma migrate deploy` 성공 확인
- [ ] Build 로그에서 `next build` 성공 확인

## 3) Production 스모크
- [ ] `/app/blog` 목록 로드
- [ ] 새 글 생성/수정/삭제 동작
- [ ] Lint 실행 결과 저장 확인
- [ ] Export 다운로드 동작(HTML/MD/ZIP)
- [ ] 비인증 API 접근 401 확인
- [ ] 권한 없는 접근 403 확인

## 4) 회귀 스모크
- [ ] Public 페이지(`/`, `/projects`, `/projects/[slug]`) 정상
- [ ] Private 핵심 화면(`/app/projects`, `/app/experiences`, `/app/resumes`, `/app/notes`) 정상
- [ ] 주요 API 에러 매핑(401/403/404/409/422) 유지

## 5) 배포 후 정리
- [ ] `plans/task.md`, `plans/checklist.md` 상태 최종 확인
- [ ] 운영 이슈/에러 로그 확인
- [ ] M5 착수 브랜치 분기
