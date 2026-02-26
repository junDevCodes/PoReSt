# PoReSt 작업 확인서 (통합 체크리스트)

기준일: 2026-02-26
문서 목적: 진행/완료 판단을 위한 검수 항목을 단계별로 관리한다.

## A) 기준선 완료 확인 (완료)

- [x] M0~M5 기준선 기능 완료
- [x] G1~G12 기능 구현/문서/배포 확인 완료
- [x] Auth 정책 전환(`requireAuth` 기본 + 운영성 `requireOwner`) 반영
- [x] 공개 canonical 경로(`/u/[publicSlug]/*`) 정착
- [x] Wave2 Server-first 전환 완료
- [x] Wave3 기능 구현(T37~T41) 반영

## B) Wave3 마감 체크 (M6-1)

### B-1. 기능/테스트 마감

- [x] `PortfolioSettingsPage` 미리보기 테스트(jsdom) 실패 0건
- [x] Wave3 관련 테스트(랜딩/인증/설정 미리보기) 모두 통과
- [ ] 클라이언트 에러 처리 시 로딩 해제/오류 메시지 표시 확인

### B-2. 게이트 실행

- [x] `npm run lint` 통과
- [ ] `npm run build` 통과
- [x] `npx jest --runInBand` 통과
- [ ] `npm run vercel-build` 통과

### B-3. 문서/배포

- [x] `plans/plan.md` 업데이트 완료
- [x] `plans/task.md` 업데이트 완료
- [x] `plans/history.md` 업데이트 완료
- [x] `plans/checklist.md` 업데이트 완료
- [ ] 관련 `docs/*` 동기화 완료
- [ ] Preview 배포 확인
- [ ] Production 배포 확인

### B-4. 사용자 실행 검증 (커밋/푸시 기반)

- [ ] Commit #1(T44) push 후 Preview 배포에서 `build`/`vercel-build` 성공 로그 확인
- [ ] Preview URL에서 Wave3 핵심 동선(`/`, `/login`, `/app`, `/app/portfolio/settings`) 스모크 테스트
- [ ] Commit #2(T48) push 후 API 실패 시 로딩 해제/오류 배너 노출 동작 확인

## C) 안정화 체크 (M6-2)

### C-1. 설치/환경

- [ ] `npm install` 진입 가이드가 환경변수 요구사항을 명확히 설명한다.
- [ ] `DATABASE_URL`/`DATABASE_URL_UNPOOLED` 미설정 시 대응 절차가 문서화되어 있다.

### C-2. 구현 품질

- [ ] Private 주요 페이지의 UI 톤(라이트 기준) 일관성 확보
- [ ] 클라이언트 `fetch` 예외 처리 공통 패턴 적용
- [ ] Auth 후처리 실패 시 관측 로그 추적 가능
- [ ] owner 권한 반영 지연 완화 전략 반영
- [ ] 요청 본문 제한 처리 메모리 안정성 개선

### C-3. 운영/보안

- [ ] owner scope 위반 회귀 테스트 보강
- [ ] 운영성 API 에러 응답 표준 유지(401/403/500)
- [ ] Audit 수집 범위 확대(핵심 CRUD)

## D) 제품화 체크 (M7)

- [ ] 발행 퍼널(설정→프로젝트 공개→공유 URL) 계측 적용
- [ ] Resume 공유 링크 관리 UX 확장
- [ ] Blog Export 보존 정책 적용(retention/object storage)
- [ ] Public 추천/정렬 전략 v2 반영
- [ ] Cross-domain 링크 인라인 편집 UX 반영

## E) 성장 체크 (M8)

- [ ] 임베딩 유사도 결과와 NoteEdge 후보 자동 동기화
- [ ] 개인화 추천 실험 기반 도입
- [ ] 성능/비용/SLO 대시보드 운영
- [ ] 릴리스 자동화 및 릴리스 노트 표준화

## F) 릴리스 승인 최종 체크

- [ ] 필수 env 설정 확인(`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, OAuth)
- [ ] 마이그레이션 적용 상태 확인
- [ ] 게이트 4종 2회 연속 통과
- [ ] 주요 동선 스모크 테스트 통과(`/`, `/login`, `/app`, `/u/[publicSlug]`, `/projects`, `/users`)
- [ ] 회귀 이슈/Known Issue 갱신 완료
- [ ] `plans/history.md` 완료 기록 누적
