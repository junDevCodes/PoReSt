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

### 완료일: 2026-02-16
- 기능 ID(Gx): G7 (Blog Export 이력화)
- 핵심 변경:
  - `BlogExportArtifact` 모델/마이그레이션 추가
  - Blog 서비스에 export 생성/목록/재다운로드 메서드 추가
  - `GET /api/app/blog/posts/[id]/exports` 목록 API 추가
  - `GET /api/app/blog/posts/[id]/exports/[exportId]` 재다운로드 API 추가
  - 기존 `GET /api/app/blog/posts/[id]/export`를 이력 적재 + 다운로드 방식으로 확장
  - `/app/blog/[id]/edit`에 Export 이력 목록/재다운로드 UI 반영
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과 (27 suites 중 19 passed, 8 skipped)
  - `npm run vercel-build` 통과 (migration `20260216123000_m7_blog_export_history` 적용)
- 리스크/후속 항목:
  - Export payload를 DB(bytea)에 저장하므로 저장소 증가량 모니터링 필요
  - 장기적으로 Object Storage 분리 또는 retention 정책(G8/G9와 연계) 필요

### 완료일: 2026-02-16
- 기능 ID(Gx): G6 (공유 조회 UI 마무리)
- 핵심 변경:
  - 공개 공유 페이지 `GET /resume/share/[token]` UI 추가
  - 기존 `GET /api/public/resume/share/[token]` 응답을 화면 렌더링에 연결
  - 공유 링크 접근 시 이력서 요약/항목 표시 흐름 제공
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과 (27 suites 중 19 passed, 8 skipped)
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 대시보드에서 공유 링크 생성/회수 UI는 후속 고도화 대상

### 완료일: 2026-02-16
- 기능 ID(Gx): G8 (Audit Log)
- 핵심 변경:
  - `AuditLog` 모델/마이그레이션 추가
  - `writeAuditLog` 유틸 추가 및 Blog 주요 액션(create/update/delete/lint/export) 수집 반영
  - `GET /api/app/audit` 조회 API 구현(커서 기반 페이징)
  - `/app/audit` 최소 관리자 UI 구현
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과 (27 suites 중 19 passed, 8 skipped)
  - `npm run vercel-build` 통과 (migration `20260216142000_m8_audit_log` 적용)
- 리스크/후속 항목:
  - 수집 범위를 Blog 중심으로 먼저 적용했으므로, 다른 도메인 CRUD까지 확장 필요
  - 로그 보존 기간/정리 정책은 G9 운영성 작업과 함께 확정 필요

### 완료일: 2026-02-17
- 기능 ID(Gx): G9 (관측성) - T26
- 핵심 변경:
  - `x-request-id` 기반 요청 추적 ID 생성/전달을 middleware에 적용
  - middleware 인증 흐름에 구조화 로그(JSON) 이벤트 표준(`request.received`, `auth.authorized`, `auth.unauthorized`) 적용
  - 관측성 유틸(`src/lib/observability.ts`) 및 단위 테스트 추가
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - Sentry 연동과 운영 알림(Webhook) 경로는 T27에서 마무리 예정
