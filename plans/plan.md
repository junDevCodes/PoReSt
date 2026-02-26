# PoReSt 프로젝트 마스터 플랜

기준일: 2026-02-26
문서 성격: 프로젝트 전체 기획/전략/로드맵 단일 기준 문서
관련 문서: `PROJECT.md`, `plans/task.md`, `plans/history.md`, `plans/checklist.md`

## 1) 비전과 성공 기준

### 1.1 비전

- PoReSt는 공개 포트폴리오(`/u/[publicSlug]`)와 개인 워크스페이스(`/app`)를 하나의 안전한 제품으로 통합한다.
- Public/Private 경계를 라우팅과 API에서 동시에 강제하고, 운영/관측/확장 기능까지 포함한 "개인 개발자 OS"를 완성한다.

### 1.2 제품 성공 기준 (상위 KPI)

- 신규 사용자가 5분 내 공유 가능한 URL(`/u/[publicSlug]`)을 발행한다.
- 개인 데이터(owner scope) 격리 위반 0건을 유지한다.
- 릴리스 게이트(`lint`, `build`, `jest`, `vercel-build`) 2회 연속 통과를 배포 기준으로 고정한다.
- 운영 장애 시 `x-request-id` 기반 역추적이 가능해야 한다.

## 2) 현재 기준선 (As-Is)

### 2.1 완료된 기반

- M0~M5 기능군 기준선 완료.
- G1~G12(워크스페이스 API, Notes/Feedback, Resume 공유, Export, Audit, Observability, DomainLink, Embedding, Users 디렉토리) 완료.
- Wave2(Server-first + DTO 중복 제거) 완료.
- Auth 정책 전환(로그인 사용자 워크스페이스 허용) 및 공개 canonical 경로(`/u/[publicSlug]`) 확정 완료.

### 2.2 현재 미해결 갭

- Wave3 기능 구현(T37~T41)은 반영되었으나, 최종 게이트(T42)가 미완료.
- Wave3 테스트 런타임 정렬(T43)은 완료되었으나, 게이트 4종 완전 통과(T44)는 미완료.
- `npm install` 시 `postinstall(prisma generate)`가 `DATABASE_URL_UNPOOLED` 미설정 환경에서 실패 가능.
- Private 화면 일부가 라이트 레이아웃과 맞지 않는 다크 토큰을 유지.
- 클라이언트 `fetch` 예외 처리 패턴이 화면별로 상이.

## 3) 2026 상반기 목표 체계 (To-Be)

### M6. 안정화 및 품질 완결 (우선)

목표: Wave3 마감 + 코드 구현 레벨 오류 제거

- Wave3 게이트 완전 통과(T42 완료)
- 테스트/설치/빌드 안정화
- UI 톤 일관성 복구 및 네트워크 예외 처리 표준화

완료 기준:

- `plans/checklist.md` Wave3 항목 100% 체크
- 게이트 4종 2회 연속 통과
- 치명 이슈(P0) 0건

### M7. 제품 완성도 및 운영 내구성

목표: "사용성 + 운영성"을 제품 수준으로 끌어올림

- 발행 퍼널 계측/개선
- Resume 공유/Blog Export 운영 UX 고도화
- Audit 범위 확장 및 운영 정책 정착

완료 기준:

- 운영 API/핵심 화면 회귀 테스트 정례화
- 사용자 동선(발행/공유/편집) 이탈 포인트 측정 가능

### M8. 성장/차별화 라운드

목표: 추천 품질과 데이터 활용도를 실사용 단계로 전환

- 공개 추천/정렬 전략 고도화
- 임베딩 기반 자동 연계(Notes ↔ Edge) 강화
- 성능/비용/SLO 중심 운영 체계 정교화

완료 기준:

- 추천 품질 지표(CTR/체류) 관측 체계 확보
- 임베딩 파이프라인 운영 제어(재시도/오류 추적) 안정화

## 4) 실행 로드맵 (Wave)

### Wave3-Closure (M6-1)

범위:

1. Wave3 게이트 복구 및 재검증
2. 테스트 런타임 불일치 해결
3. 설치/환경변수 진입 장벽 완화
4. 문서 동기화 및 배포 확인

산출물:

- Wave3 완료 판정(체크리스트/이력 반영)
- 재현 가능한 로컬 실행 가이드

### Wave4-Reliability (M6-2)

범위:

1. 클라이언트 API 예외 처리 표준 유틸 정리
2. Auth 후처리/권한 반영 정합성 보강
3. 요청 본문 파서 메모리 안정성 개선
4. Private UI 톤 일관화

산출물:

- 공통 오류 처리 규약
- 인증/권한 정합성 리스크 축소

### Wave5-Productization (M7)

범위:

1. 발행 퍼널(설정→프로젝트 공개→URL 공유) 계측
2. Resume 공유 링크 운영 UX 확장
3. Blog Export 저장/보존 정책 적용
4. Audit 범위 확대

산출물:

- 운영자 관점 대시보드/로그 가시성 향상
- 사용자 관점 공유/관리 사용성 향상

### Wave6-Growth (M8)

범위:

1. 공개 추천/정렬 전략 v2
2. 임베딩-연관 후보 자동 동기화
3. 성능/비용 제어 자동화

산출물:

- 차별화 기능의 실사용 지표 기반 개선 루프 구축

## 5) 도메인별 추진 전략

### 5.1 Public 도메인

- `/`, `/users`, `/projects`, `/u/[publicSlug]` 동선 일관화
- 추천/최신 노출 로직의 가시성(설명 가능성) 확보

### 5.2 Private 도메인

- Server-first 패턴 유지
- CRUD 상호작용은 공통 예외 처리/상태 UI 사용

### 5.3 Auth/보안

- `requireAuth` 기본, 운영성 API `requireOwner` 고정
- owner scope 위반 방지 테스트 지속 추가

### 5.4 Data/AI

- 스키마/제약조건 우선
- 임베딩/연관 기능은 품질 지표와 함께 운영

### 5.5 운영/관측

- `x-request-id` 일관 전파
- 오류 리포팅(Sentry/Webhook)과 Audit를 결합해 추적성 강화

## 6) 게이트 및 릴리스 규칙

### 6.1 고정 게이트

1. `npm run lint`
2. `npm run build`
3. `npx jest --runInBand`
4. `npm run vercel-build`

### 6.2 실행 전 필수 조건

- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, OAuth 관련 env가 준비되어야 한다.
- 테스트 DB가 필요한 통합 테스트는 `DATABASE_URL_TEST` 별도 구성 후 수행한다.

### 6.3 릴리스 승인 규칙

- 게이트 4종 통과 + 문서 동기화 + 스모크 체크를 모두 만족해야 "완료"로 판정한다.
- 하나라도 미충족이면 `plans/checklist.md`에서 상태를 유지하고 보완 작업을 선행한다.

## 7) 리스크 및 대응

- 환경 의존성 리스크: 설치/빌드가 DB env에 민감하므로, 초기 부트스트랩 가이드를 강화한다.
- 테스트 런타임 리스크: Node/jsdom 전역 API 차이를 공통 셋업으로 흡수한다.
- 권한 정합성 리스크: 로그인 이벤트 후처리 실패/권한 반영 지연을 관측 지표와 함께 보강한다.
- 추천 품질 리스크: 휴리스틱 결과를 운영 지표 기반으로 튜닝한다.

## 8) 문서 동기화 범위

- `plans/plan.md`
- `plans/task.md`
- `plans/history.md`
- `plans/checklist.md`
- `docs/03_IA_Routing_Map.md`
- `docs/05_Requirements_Spec.md`
- `docs/06_Functional_Spec.md`
- `docs/07_Data_Model_ERD.md`
- `docs/09_API_Spec.md`
- `docs/10_Technical_Design_Architecture.md`
- `docs/12_QA_Technical_Details.md`
- `docs/DEPLOYMENT_GUIDE.md`

## 9) TDD 실행 큐 ("go" 호출 시 순차 수행)

- [x] Test-M6-01: `PortfolioSettingsPage` 미리보기 테스트가 jsdom 환경에서 안정적으로 통과해야 한다.
- [x] Test-M6-02: `parseApiResponse`가 네트워크 예외에서도 사용자 메시지를 반환해야 한다.
- [ ] Test-M6-03: Private 주요 화면에서 API 실패 시 로딩 상태가 해제되고 오류 배너가 표시되어야 한다.
- [ ] Test-M6-04: Wave3 관련 페이지의 UI 대비가 라이트 테마 기준 접근성 요구를 만족해야 한다.
- [ ] Test-M6-05: 로그인 후처리에서 User/PortfolioSettings 보장이 실패하면 관측 이벤트가 기록되어야 한다.
- [ ] Test-M6-06: owner 권한 변경 시 세션 갱신 후 API 권한 판단이 최신 상태를 반영해야 한다.
- [ ] Test-M6-07: 요청 본문 1MB 초과 시 메모리 과사용 없이 제한 응답을 반환해야 한다.
- [ ] Test-M7-01: Resume 공유 링크 관리 화면에서 생성/회수/만료 상태가 일관되게 동작해야 한다.
- [ ] Test-M7-02: Blog Export 이력의 보존 정책이 만료 데이터 정리에 반영되어야 한다.
- [ ] Test-M8-01: 임베딩 유사도 결과가 NoteEdge 후보 생성 흐름에 동기화되어야 한다.
