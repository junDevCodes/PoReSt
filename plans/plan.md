# PoReSt 추가 기능개발 통합 계획 (Post M5 Gap Closure)

기준일: 2026-02-16

## 목표
- 서비스 방향성(다중 사용자 워크스페이스/운영 품질/확장성) 대비 남은 갭(G1~G12)을 단계적으로 해소한다.
- 구현과 문서를 동시에 동기화한다.
- 섹션 단위 게이트(`lint`, `build`, `jest`, `vercel-build`) 통과를 완료 기준으로 관리한다.

## 우선순위 트랙

### P0 (즉시 구현)
상태: 구현 완료(2026-02-16), 배포 체크만 잔여

1. G1 워크스페이스 기본 API 완성 (`GET /api/app/me`)
2. G2 Notebook CRUD + Notes 작성 파이프라인 완성
3. G3 Public Projects 검색/필터/페이지네이션
4. G4 Feedback 대상 선택 UX/API 자동화
5. G5 Blog Lint Rule10 고도화

### P1 (운영성/완성도)
6. G6 Resume 공유 링크(토큰/만료)
7. G7 Blog Export 이력화
8. G8 Audit Log
9. G9 관측성(Sentry/Request ID/구조화 로그)

### P2 (차별화)
10. G10 Cross-domain 링크(프로젝트/이력/노트/블로그 연결)
11. G11 pgvector 임베딩 파이프라인 실전 적용
12. G12 공개 사용자 탐색(디렉토리) 페이지

## 트랙별 완료 기준
- API 완료
- UI 완료
- 테스트 통과
- 문서 반영
- Preview/Production 배포 확인

## 실행 Wave

### Wave A (P0, 1주)
1. G1 구현 → 게이트 → docs 동기화
2. G2 구현 → 게이트 → docs 동기화
3. G3 구현 → 게이트 → docs 동기화
4. G4 구현 → 게이트 → docs 동기화
5. G5 구현 → 게이트 → docs 동기화

### Wave B (P1, 1~1.5주)
1. G6 → G7 → G8 → G9 순서로 동일 루프 수행

### Wave C (P2, 1.5~2주)
1. G10 → G11 → G12 순서로 동일 루프 수행
2. 성능/비용/운영성 검증 병행

## 섹션 고정 루프
1. 스키마/인터페이스 확정
2. 테스트 케이스 작성
3. 최소 구현
4. `npm run lint`
5. `npm run build`
6. `npx jest --runInBand`
7. `npm run vercel-build`
8. docs 동기화
9. `git add` + 한국어 커밋

## 문서 동기화 대상
- `docs/00_README.md`
- `docs/03_IA_Routing_Map.md`
- `docs/05_Requirements_Spec.md`
- `docs/06_Functional_Spec.md`
- `docs/07_Data_Model_ERD.md`
- `docs/09_API_Spec.md`
- `docs/10_Technical_Design_Architecture.md`
- `docs/11_Development_Plan_Sprint_Backlog.md`
- `docs/12_QA_Technical_Details.md`
- `docs/DEPLOYMENT_GUIDE.md`

## 후속 트랙: UX Wave 1 (공개 포트폴리오 발행 완성)
목표: 신규 사용자가 5분 내에 `/u/[publicSlug]` 공유 링크를 얻는다.

### 범위
1. Public 랜딩(`/`)
   - 서비스 소개 + 로그인 CTA
   - `/users`, `/projects` 탐색 CTA 제공
2. Private 대시보드(`/app`)
   - 첫 진입 시 “발행 체크리스트(진행률)” 위젯 제공
     - 프로필 설정(`/app/portfolio/settings`)
     - 첫 프로젝트 생성(`/app/projects/new`)
     - 프로젝트 공개 전환(visibility=PUBLIC)
     - `/u/[publicSlug]` 이동/복사 버튼
3. 빈 상태/에러 상태 통일
   - Projects/Resumes/Notes/Blog 공통 메시지/CTA 정리

### 완료 기준(수용 기준)
- 신규 사용자가 5분 내에 `/u/[publicSlug]` 공유 링크를 얻는다.
- `publicSlug` 변경 시 “기존 링크가 깨질 수 있음(리다이렉트 없음)” 경고가 명확히 표시된다.
- `/users` 디렉토리는 `isPublic=true` + 공개 프로젝트 1개 이상 사용자만 노출된다.
