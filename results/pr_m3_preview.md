## PR 제목
`M3 마감: Notes API/UI/그래프 시각화 및 인덱스 최적화`

## PR 본문
```markdown
## Pull Request Checklist

### PR Type
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [x] Documentation update
- [x] UI/UX improvement
- [ ] Refactoring
- [x] Test update
- [x] Configuration change

### Related Issues
Closes #

### Description
M3(Notes) 범위의 핵심 기능을 마감했습니다.  
노트 CRUD/Search, Candidate Generator, Confirm/Reject, 상세 그래프 시각화와 인덱스 기반 성능 최적화를 반영했습니다.

### Changes Made
- Notes 도메인 모듈 추가 (`src/modules/notes/*`)
- Notes API 추가 (`/api/app/notes*`, `/api/app/notes/edges*`, `/api/app/notes/[id]/edges`)
- Notes UI 추가 (`/app/notes`, `/app/notes/[id]`) 및 Confirm/Reject 액션 연동
- SVG 기반 노트 연결 그래프 시각화 추가
- Notes 조회/엣지 쿼리 인덱스 최적화 마이그레이션 추가
- M3 체크리스트/진행로그/배포 체크리스트 문서 동기화

### Testing

#### Local Testing
- [ ] Tested locally with `npm run dev`
- [x] Ran build with `npm run build`
- [ ] Tested production build with `npm start`

#### Database Changes (if applicable)
- [x] Created Prisma migration
- [x] Tested migration locally
- [ ] Verified schema changes in Prisma Studio

#### Preview Deployment
- [ ] Verified Preview URL (added by Vercel bot)
- [ ] Tested all affected routes
- [ ] Checked console for errors

### Screenshots/Videos (if applicable)
- Preview 검증 후 추가 예정

### Checklist
- [x] Code follows project style guidelines
- [x] Self-reviewed my own code
- [ ] Commented code in hard-to-understand areas
- [x] Updated documentation (if needed)
- [x] No new warnings generated
- [x] Added tests that prove my fix/feature works (if applicable)
- [x] New and existing tests pass locally

### Database Migrations
- [x] Migration file created and included
- [x] Migration tested locally
- [x] Rollback plan documented (failed migration은 `migrate resolve --rolled-back`로 복구)

### Deployment Notes
- [ ] No special deployment steps required
- [x] Requires environment variable updates (list below)
- [x] Requires manual migration (list steps below)

**Environment Variables** (if any):
```env
DATABASE_URL
DATABASE_URL_UNPOOLED
DATABASE_URL_TEST
AUTH_SECRET
NEXT_PUBLIC_SITE_URL
```

**Manual Steps** (if any):
1. Preview 환경변수(DB URL) 스코프 확인
2. Preview 배포 로그에서 `prisma migrate deploy` 성공 확인
3. `/app/notes`, `/app/notes/[id]`에서 Confirm/Reject + 그래프 시각화 확인
4. 필요 시 `npx prisma migrate resolve --rolled-back 20260211193000_m3_notes_index_tuning` 후 재배포

### Reviewer Notes
- M3 Notes API 동작과 owner scope 강제 여부
- Candidate 생성/Confirm/Reject 상태 전이 정확성
- 노트 상세 그래프 표시/갱신 흐름
- 인덱스 마이그레이션(`20260211193000_m3_notes_index_tuning`) 반영 여부
```

