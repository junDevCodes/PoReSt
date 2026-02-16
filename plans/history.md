# PoReSt 완료 이력

기준일: 2026-02-16

## 기록 규칙
완료 시점마다 아래 포맷으로 누적한다.
1. 완료일
2. 기능 ID(Gx)
3. 핵심 변경
4. 테스트/배포 결과
5. 리스크/후속 항목

## 누적 이력

### 완료일: 2026-02-16
- 기능 ID(Gx): M0~M5 기준선 정리
- 핵심 변경: M0~M5 기능/배포 완료 상태를 기준선으로 확정
- 테스트/배포 결과: Preview/Production 배포 완료, 기본 게이트 통과 이력 보유
- 리스크/후속 항목: Post-M5 갭(G1~G12) 계획 수립 필요

### 완료일: 2026-02-16
- 기능 ID(Gx): G1~G12 백로그 등록
- 핵심 변경: `plans/plan.md`, `plans/task.md`, `plans/checklist.md`에 신규 트랙/태스크/게이트 등록
- 테스트/배포 결과: 문서 등록 단계(코드 게이트 대상 아님)
- 리스크/후속 항목: P0(G1~G5) 구현 결과를 다음 이력으로 누적 예정

### 완료일: 2026-02-16
- 기능 ID(Gx): G1~G5 (P0 1차 구현)
- 핵심 변경:
  - G1 `/api/app/me` 추가 및 대시보드 워크스페이스 상태 노출
  - G2 Notebook CRUD API/서비스/테스트 보강 및 Notes 작성 파이프라인 정리
  - G3 Public Projects 검색/필터/cursor API + `/projects` 필터 UI 반영
  - G4 `/api/app/feedback/targets` 추가 및 Feedback 생성 UX 자동화
  - G5 Blog Lint Rule10(`HEADING_LEVEL_JUMP`) 추가
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과 (104 tests)
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 실제 Preview/Production 배포 후 P0 항목별 스모크 체크 필요
  - P1(G6~G9) 스키마 설계 착수 필요

### 완료일: 2026-02-16
- 기능 ID(Gx): G6 (Resume 공유 링크 API 1차)
- 핵심 변경:
  - `ResumeShareLink` 모델/마이그레이션 추가
  - `POST|GET|DELETE /api/app/resumes/[id]/share-links` 구현
  - `GET /api/public/resume/share/[token]` 구현
  - Resumes 서비스 공유 링크 생성/회수/토큰 조회 로직 및 테스트 보강
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과 (108 tests)
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 공유 링크 UI 관리 화면(T21) 추가 필요
  - 만료 정책 preset(예: 7일/30일) UX는 후속에서 정리
