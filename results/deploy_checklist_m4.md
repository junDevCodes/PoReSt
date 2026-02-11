# M4 Preview 배포 체크리스트 (Blog)

## 1) 사전 게이트
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] `.env.local` 로드 후 `npx jest --runInBand` 통과
- [ ] `npm run vercel-build` 로컬 통과

## 2) 마이그레이션/DB
- [ ] Preview DB에서 `prisma migrate status`가 `up to date`
- [ ] `DATABASE_URL` / `DATABASE_URL_UNPOOLED`가 Preview 전용 브랜치를 가리킴
- [ ] `DATABASE_URL_TEST`는 테스트 전용 DB를 가리킴

## 3) 기능 스모크 (Preview URL)
- [ ] `/app/blog` 목록 조회
- [ ] `/app/blog/new` 글 생성
- [ ] `/app/blog/[id]/edit` 수정 저장
- [ ] Lint 실행 버튼 동작 (`/api/app/blog/posts/[id]/lint`)
- [ ] Export 다운로드 동작
- [ ] HTML 다운로드
- [ ] MD 다운로드
- [ ] ZIP 다운로드

## 4) API/보안 스모크
- [ ] 비인증 상태에서 `/api/app/blog/*` 접근 시 401
- [ ] 타 오너 리소스 수정/삭제/린트 시 403
- [ ] 존재하지 않는 글 조회/수정/삭제 시 404
- [ ] 입력 검증 실패 시 422

## 5) 회귀 확인
- [ ] `/api/public/*` 정상 응답
- [ ] `/app/projects`, `/app/experiences`, `/app/resumes`, `/app/notes` 주요 화면 회귀 없음
- [ ] 로그인 리다이렉트(`/login?next=...`) 회귀 없음

## 6) 완료 판정
- [ ] Preview 체크 항목 100% 통과
- [ ] `results/pr_m4_preview.md` 내용 최신화
- [ ] PR 리뷰 요청 완료
