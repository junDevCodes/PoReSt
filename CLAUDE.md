# CLAUDE.md — PoReSt 프로젝트 가이드

## 프로젝트 개요

PoReSt는 공개 포트폴리오(`/portfolio/[publicSlug]`)와 개인 워크스페이스(`/app`)를 통합한 **개인 개발자 OS**.

## 기술 스택

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **ORM:** Prisma 7.3.0 + NeonDB (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **Auth:** NextAuth 4.x (Google OAuth)
- **Testing:** Jest + Testing Library
- **Deploy:** Vercel

## 프로젝트 구조

```
src/
├── app/
│   ├── (private)/app/    # 워크스페이스 (인증 필요)
│   ├── (public)/         # 공개 페이지 (포트폴리오, 로그인 등)
│   └── api/              # API 라우트
│       ├── app/          # Private API (/api/app/*)
│       ├── auth/         # NextAuth
│       └── public/       # Public API (/api/public/*)
├── components/           # 재사용 컴포넌트
├── lib/                  # 핵심 유틸리티
├── modules/              # 도메인 모듈 (interface → implementation → http)
├── types/                # TypeScript 타입
└── view-models/          # 뷰 모델
prisma/                   # Prisma 스키마 + 마이그레이션
docs/                     # 프로젝트 문서
├── plan.md               # 전체 계획 기획서
├── task.md               # 현재 작업 상세
├── history.md            # 작업 이력
├── checklist.md          # 완료 기준
└── specs/                # PRD, 기술 설계 문서
```

## 개발 명령어

```bash
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드
npm run lint             # ESLint
npm test                 # Jest 테스트
npx prisma migrate dev   # DB 마이그레이션
npx prisma studio        # DB GUI
npm run seed             # 시드 데이터
```

## 코딩 가이드라인

상세 코딩 규칙은 `AGENTS.md`를 참조:
- 한국어 필수 (주석, 커밋 메시지, 에러 메시지)
- TDD 방법론 (Kent Beck)
- Database-First 접근
- 커밋 포맷: `domain(scope): 한국어 설명`

## 도메인 모듈 구조

```
src/modules/[domain]/
├── interface.ts          # 인터페이스 정의 (Input/Output DTO, Service)
├── implementation.ts     # 비즈니스 로직 구현
├── http.ts               # 에러 응답 헬퍼
└── index.ts              # 공개 API export
```

## 주요 규칙

- **소유권 격리:** 모든 API에 `ownerId` scope 강제
- **Public/Private 분리:** 라우팅 + API에서 동시 강제
- **환경변수:** `.env.example` 참조, `.env`는 커밋 금지
- **릴리스 게이트:** `lint` → `build` → `jest` → `vercel-build` 4종 통과 필수

---

## Agent 작업 문서 체계

모든 Claude Agents는 작업 시 `docs/` 디렉토리의 **4문서 체계**를 기준으로 작업한다.

### 4문서 역할

| 문서 | 역할 |
|---|---|
| `docs/plan.md` | 전체 완성 계획 및 기획을 큰 단위로 관리하는 **작업 기획서** |
| `docs/task.md` | plan.md에서 할당된 **바로 다음 진행할 기능 단위** 작업 상세 실행 계획서 |
| `docs/history.md` | 전체 작업 이력을 누적 기록하는 **영구 맥락 문서** |
| `docs/checklist.md` | task.md 작업에서 점검할 완료 기준을 정리한 **작업 확인서** |

### task.md 범위 기준

- checklist.md 미완료 항목이 15개를 초과하면 기능 범위 과다로 판단한다
- 기능이 복수일 경우 plan.md에서 항목을 먼저 분리한 뒤 task.md를 재작성한다

### 작업 시작 시 (필수)

```
1. docs/history.md 읽기  → 이전 맥락 파악
2. docs/task.md 읽기     → 현재 작업 범위 확인
3. docs/checklist.md 읽기 → 완료 기준 확인
```

### 작업 완료 시 (필수)

```
1. docs/checklist.md 최종 검증 항목 체크
2. docs/history.md 업데이트 (완료 내용 + 다음 세션 맥락)
3. docs/task.md 완료 항목 표시
4. docs/plan.md 해당 Phase 항목 체크
```

### 4문서 생명주기

| 문서 | 성격 | 완료 시 처리 |
|---|---|---|
| `plan.md` | 마일스톤 계획 | 전체 완료 → history.md 요약 → 새 마일스톤 |
| `task.md` | 현재 태스크 | checklist 전부 완료 → history.md 요약 → 다음 태스크 |
| `checklist.md` | task.md 검증용 | task.md와 동시 교체 |
| `history.md` | 영구 이력 | 초기화 없음. 모든 완료 내용 흡수 |
