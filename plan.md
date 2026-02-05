# M0 Foundation Test Plan (TDD)

## Unit Tests (Auth Guard)
- [x] `requireAuth`는 세션이 없으면 401을 반환해야 한다
- [x] `requireOwner`는 오너가 아니면 403을 반환해야 한다
- [x] `requireOwner`는 오너이면 세션을 반환해야 한다

## Manual Checks
- [ ] 비인증 상태에서 `/app` 접근 시 `/auth/signin`으로 리다이렉트된다
- [ ] 비인증 상태에서 `/api/app/*` 호출 시 401 JSON이 반환된다
- [ ] 오너 로그인 후 `/app` 접근 및 로그아웃이 정상 동작한다
