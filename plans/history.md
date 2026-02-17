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

### 완료일: 2026-02-17
- 기능 ID(Gx): G9 (관측성) - T27
- 핵심 변경:
  - `src/lib/monitoring.ts` 추가 (Sentry Envelope 전송 + 운영 알림 Webhook 폴백)
  - 운영성 라우트 에러 처리 지점에 관측 리포팅 연동
    - `/api/app/revalidate`
    - `/api/app/blog/posts/[id]/lint`
    - `/api/app/feedback/[id]/run`
    - `/api/app/db-test`
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - Sentry DSN/운영 알림 Webhook 실환경 값 주입 후 실제 이벤트 수신 확인 필요

### 완료일: 2026-02-17
- 기능 ID(Gx): G10 (Cross-domain 링크) - T28
- 핵심 변경:
  - `DomainLinkEntityType` enum, `DomainLink` 모델 추가
  - `User.domainLinks` 관계 추가
  - 마이그레이션 `20260217112000_m10_domain_links` 추가
  - 중복 링크 방지 unique 인덱스와 source/target 동일 금지 CHECK 제약 추가
  - 스키마 통합 테스트(`src/modules/domain-links/tests/schema.integration.test.ts`) 추가
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 폴리모픽 링크 구조 특성상 실제 엔티티 존재 검증은 T29 API 계층에서 owner scope 기반으로 보강 필요

### 완료일: 2026-02-17
- 기능 ID(Gx): G10 (Cross-domain 링크) - T29
- 핵심 변경:
  - DomainLink 서비스 계층(`src/modules/domain-links`) 구현
    - 링크 조회(`listLinksForOwner`)
    - 링크 생성(`createLinkForOwner`)
    - 링크 삭제(`deleteLinkForOwner`)
  - owner scope 엔티티 존재 검증(프로젝트/경력/이력서/노트/블로그) 추가
  - API 라우트 추가
    - `GET|POST /api/app/domain-links`
    - `DELETE /api/app/domain-links/[id]`
  - 검증/통합 테스트 추가
    - `src/modules/domain-links/tests/validation.test.ts`
    - `src/modules/domain-links/tests/implementation.integration.test.ts`
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 교차 링크 시각화/편집 UI(T30) 미구현

### 완료일: 2026-02-17
- 기능 ID(Gx): G10 (Cross-domain 링크) - T30
- 핵심 변경:
  - `/app/domain-links` 교차 링크 관리 UI 추가
    - source/target 타입/엔티티 선택 기반 링크 생성
    - 기존 링크 목록 조회 및 삭제
  - 대시보드 빠른 이동에 `/app/domain-links` 경로 추가
  - 라우팅/API 문서에 Domain Links 페이지/엔드포인트 반영
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 현재 UI는 단일 관리 페이지 방식이며, 각 도메인 상세 화면 내 인라인 편집 UX는 추후 고도화 대상

### 완료일: 2026-02-17
- 기능 ID(Gx): G11 (pgvector 임베딩) - T31
- 핵심 변경:
  - `NoteEmbeddingStatus` enum 및 `NoteEmbedding` 운영 필드(`status`, `lastEmbeddedAt`, `error`, `updatedAt`) 추가
  - 마이그레이션 `20260217130000_m11_note_embedding_pipeline_fields` 추가
  - 임베딩 재빌드 준비 파이프라인 모듈(`src/modules/note-embeddings`) 추가
    - deterministic 벡터 생성 함수
    - owner scope 기반 재빌드 큐잉(`prepareRebuildForOwner`)
  - 검증/통합 테스트 추가
    - `src/modules/note-embeddings/tests/validation.test.ts`
    - `src/modules/note-embeddings/tests/implementation.integration.test.ts`
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 실제 임베딩 벡터 저장/재빌드 실행 API(T32)와 검색 고도화(T33)가 후속 필수

### 완료일: 2026-02-17
- 기능 ID(Gx): G11 (pgvector 임베딩) - T32
- 핵심 변경:
  - 임베딩 재빌드 실행 서비스(`rebuildForOwner`) 추가
    - PENDING 큐잉 후 deterministic 벡터 생성
    - pgvector 컬럼 업데이트 + 상태 전환(`SUCCEEDED`/`FAILED`)
  - 실행 API 추가: `POST /api/app/notes/embeddings/rebuild`
  - 에러 응답/모니터링 연동(`src/modules/note-embeddings/http.ts`, `reportServerError`) 추가
  - 통합 테스트 케이스 확장(재빌드 실행 시 status 전환 검증)
- 테스트/배포 결과:
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 유사도 검색 품질/인덱스 튜닝(T33) 미완료

### 완료일: 2026-02-17
- 기능 ID(Gx): G11 (pgvector 임베딩) - T33
- 핵심 변경:
  - 임베딩 유사도 검색 서비스(`searchSimilarNotesForOwner`) 추가
    - owner scope 기준 노트 검증
    - pgvector cosine distance 기반 Top-N 검색
    - `limit`, `minScore` 필터 지원
  - 신규 API 추가: `GET /api/app/notes/[id]/similar`
  - 인덱스 튜닝 마이그레이션 추가
    - `20260217143000_m11_embedding_similarity_index_tuning`
    - `note_embeddings_status_chunk_updatedAt_idx`
    - `note_embeddings_embedding_cosine_idx` (ivfflat, vector_cosine_ops)
  - 임베딩 검증/통합 테스트 보강
    - 입력 검증 케이스(`minScore`) 추가
    - 유사도 검색 정렬/owner 격리 케이스 추가
- 테스트/배포 결과:
  - `npx jest src/modules/note-embeddings/tests/validation.test.ts --runInBand` 통과
  - `npx jest src/modules/note-embeddings/tests/implementation.integration.test.ts --runInBand` 실행(테스트 DB 미설정 환경에서 skip)
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과 (신규 마이그레이션 적용 확인)
- 리스크/후속 항목:
  - 현재 유사도 API는 조회 전용이며 NoteEdge 후보 생성과의 자동 동기화는 후속 고도화 대상

### 완료일: 2026-02-17
- 기능 ID(Gx): G12 (공개 사용자 디렉토리) - T34
- 핵심 변경:
  - 공개 사용자 디렉토리 조회 서비스(`searchPublicUsersDirectory`) 추가
    - 검색 조건: `q`, `limit`, `cursor`
    - 공개 포트폴리오(`isPublic=true`) + 공개 프로젝트 보유 사용자만 노출
    - 커서 페이지네이션(`updatedAt`, `id`) 지원
  - 신규 Public API 추가: `GET /api/public/users`
  - 통합 테스트 추가: `src/modules/projects/tests/public-users-directory.integration.test.ts`
- 테스트/배포 결과:
  - `npx jest src/modules/projects/tests/validation.test.ts --runInBand` 통과
  - `npx jest src/modules/projects/tests/public-users-directory.integration.test.ts --runInBand` 실행(테스트 DB 미설정 환경에서 skip)
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - G12 UI(`/users` 목록/상세 탐색 화면)와 운영 체크(T35/T36)는 후속 작업

### 완료일: 2026-02-17
- 기능 ID(Gx): G12 (공개 사용자 디렉토리) - T35
- 핵심 변경:
  - 공개 사용자 디렉토리 페이지 추가: `/users`
    - 검색(`q`), 페이지 크기(`limit`), 커서 페이지네이션(`cursor`) 지원
    - 프로필/프로젝트 진입 링크(`/u/[publicSlug]`, `/u/[publicSlug]/projects`) 제공
  - UI 보조 유틸 추가:
    - `parsePublicUsersSearchParams`
    - `buildUsersPageHref`
  - UI 유틸 단위 테스트 추가:
    - `src/app/(public)/users/_lib/__tests__/directory.test.ts`
  - sitemap에 `/users` 경로 반영
- 테스트/배포 결과:
  - `npx jest directory.test.ts --runInBand` 통과
  - `npm run lint` 통과
  - `npm run build` 통과
  - `npx jest --runInBand` 통과
  - `npm run vercel-build` 통과
- 리스크/후속 항목:
  - 디렉토리 카드 디자인 고도화 및 추천/정렬 전략은 UI/UX 개선 라운드에서 추가 검토
