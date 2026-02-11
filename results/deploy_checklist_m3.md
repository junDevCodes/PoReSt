# M3 배포 체크리스트 (Notes)

## 0) 사전 확인
- [ ] 현재 브랜치가 배포 대상 브랜치인지 확인 (`m1-preview` 또는 운영 브랜치)
- [ ] `.env.local`에 아래 값이 모두 설정되어 있는지 확인
  - [ ] `DATABASE_URL`
  - [ ] `DATABASE_URL_UNPOOLED`
  - [ ] `DATABASE_URL_TEST`
  - [ ] `AUTH_SECRET`
  - [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `DATABASE_URL_TEST`가 운영 DB와 분리된 테스트 전용 DB인지 확인

## 1) 로컬 환경 변수 로드 (Git Bash)
- [ ] 아래 명령 실행

```bash
cd ~/Desktop/workspace/portfolio
set -a
source .env.local
set +a
```

## 2) 로컬 게이트 검증
- [ ] DB 연결 확인

```bash
printf 'SELECT 1;' | DATABASE_URL_UNPOOLED="$DATABASE_URL_TEST" npx prisma db execute --stdin
DATABASE_URL_UNPOOLED="$DATABASE_URL_TEST" npx prisma migrate status
```

- [ ] 코드 품질/빌드/전체 테스트

```bash
npm run lint
npm run build
npx jest --runInBand
```

- [ ] M3 핵심 테스트 재검증

```bash
npx jest src/modules/notes/tests/validation.test.ts --runInBand
npx jest src/modules/notes/tests/implementation.integration.test.ts --runInBand
npx jest notes-list.test.ts --runInBand
npx jest note-detail.test.ts --runInBand
npx jest graph.test.ts --runInBand
```

## 3) Preview 빌드 사전 검증
- [ ] Preview와 동일 경로 빌드 검증

```bash
npm run vercel-build
```

## 4) Preview 배포 후 수동 스모크
- [ ] Public 페이지 정상 동작
  - [ ] `/` 접근 가능
  - [ ] `/projects` 접근 가능
  - [ ] `/projects/[slug]` 접근 가능
- [ ] Notes 페이지 정상 동작
  - [ ] `/app/notes`에서 Notebook/Note 목록이 표시됨
  - [ ] `/app/notes/[id]`에서 노트 본문/태그가 표시됨
  - [ ] CONFIRMED 목록이 표시됨
  - [ ] CANDIDATE 목록이 표시됨
  - [ ] `확정` 버튼 클릭 시 CANDIDATE -> CONFIRMED로 이동
  - [ ] `거절` 버튼 클릭 시 목록에서 제거됨
  - [ ] 하단 SVG 그래프가 표시됨
  - [ ] 그래프 중심 노드(ME)와 연결 노드가 시각적으로 구분됨
- [ ] 인증/권한 동작
  - [ ] 비로그인 상태에서 `/app/notes` 접근 시 `/login?next=...`로 리다이렉트
  - [ ] 로그인 후 원래 경로로 복귀

## 5) Production 배포 체크
- [ ] Vercel `Production` 환경 변수 확인
  - [ ] `DATABASE_URL` = production pooled URL
  - [ ] `DATABASE_URL_UNPOOLED` = production direct URL
  - [ ] `DATABASE_URL_TEST`는 운영 환경과 충돌 없는 값
- [ ] Production 배포 로그 확인
  - [ ] `prisma migrate deploy` 성공
  - [ ] `next build` 성공
- [ ] Production 스모크 (Preview와 동일 항목) 재검증

## 6) M3 완료 판정
- [ ] 로컬 게이트(`lint/build/jest --runInBand`) 통과
- [ ] Preview 수동 스모크 통과
- [ ] Production 수동 스모크 통과
- [ ] `plans/task.md`, `plans/checklist.md`, `results/progress_2026-02-07.md` 최신화

