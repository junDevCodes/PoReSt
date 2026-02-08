# PR 제목
`M1 마감: API/UI/SEO 정리 및 Preview/Production 배포 반영`

# PR 본문
```markdown
## Pull Request Checklist

### PR Type
- [ ] 🐛 Bug fix
- [x] ✨ New feature
- [ ] 🔥 Breaking change
- [x] 📝 Documentation update
- [x] 🎨 UI/UX improvement
- [ ] ♻️ Refactoring
- [x] ✅ Test update
- [x] 🔧 Configuration change

### Related Issues
Closes #

### Description
M1 포트폴리오 범위(API, Public/Private UI, 인증 리다이렉트, SEO 기본 설정) 마감 내용을 정리하고  
Preview/Production 배포 반영 상태를 문서와 함께 동기화했습니다.

### Changes Made
- M1 배포 반영 문구 업데이트(`progress`, `alignment`, `task`, `checklist`)
- `P3005` 재발 방지용 배포 가이드 절차 추가(환경 스코프 분리 + baseline)
- Public OG/Canonical 기본 메타데이터 보강
  - `metadataBase`를 `NEXT_PUBLIC_SITE_URL` 기반으로 통일
  - `/`, `/projects`, `/projects/[slug]` canonical 적용
  - 기본 OG 이미지 경로 공통 적용(`/favicon.ico`)
- M1 후속 항목을 `M1.1 Deferred`로 분리 명시

### Testing

#### Local Testing
- [ ] Tested locally with `npm run dev`
- [x] Ran build with `npm run build`
- [ ] Tested production build with `npm start`

#### Database Changes (if applicable)
- [ ] Created Prisma migration
- [ ] Tested migration locally
- [ ] Verified schema changes in Prisma Studio

#### Preview Deployment
- [x] Verified Preview URL
- [x] Tested all affected routes
- [x] Checked console for errors

### Screenshots/Videos (if applicable)
- Preview URL: `https://porest-ivxws22k6-joonaengs-projects.vercel.app`
- Production URL: `https://porest-eight.vercel.app`
- Production Custom Domain: `https://www.jundevcodes.info`
- 배포 기준 커밋: `c5f30fd` (2026-02-08)

### Checklist
- [x] Code follows project style guidelines
- [x] Self-reviewed my own code
- [ ] Commented code in hard-to-understand areas
- [x] Updated documentation (if needed)
- [x] No new warnings generated
- [x] Added tests that prove my fix/feature works (if applicable)
- [x] New and existing tests pass locally

### Database Migrations
- [ ] Migration file created and included
- [ ] Migration tested locally
- [x] Rollback plan documented (if needed)

### Deployment Notes
- [x] No special deployment steps required
- [ ] Requires environment variable updates (list below)
- [ ] Requires manual migration (list steps below)

**Environment Variables** (if any):
```env
DATABASE_URL
DATABASE_URL_UNPOOLED
DATABASE_URL_TEST
AUTH_SECRET
NEXT_PUBLIC_SITE_URL
```

**Manual Steps** (if any):
1. Production에서 `/`, `/projects`, `/projects/[slug]` canonical/OG 메타 태그 확인
2. 비로그인 `/app/*` 접근 시 `/login?next=...` 리다이렉트 확인
3. 로그인 후 `next` 복귀 및 `/app/portfolio/settings`, `/app/projects`, `/app/experiences` 동작 확인

### Reviewer Notes
- Public 메타데이터 보강(`metadataBase`, canonical, OG) 적용 확인
- `P3005` 대응 가이드 절차가 현재 운영 방식과 일치하는지 확인
- `M1.1 Deferred`로 분리한 후속 항목 범위 확인
```
