# Q&A 보충 자료 (Q7-Q13)

## Q7: 배포 검증 — CI/CD 전략

**질문:** "이건 CI로 해야해? 아니면 어떻게 검증할게 있어?"

**답변:** GitHub Actions CI/CD로 자동 검증

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npx prisma validate
      - run: npm run build
```

**Vercel 자동 배포:**

- PR마다 Preview 자동 생성
- main merge시 Production 자동 배포

---

## Q8: 모니터링 도구 도입

**질문:** "도구 도입 어떻게 할건지 보충설명이 필요해"

**답변:**

**Phase 1: 무료 도구**

- Sentry (에러 추적, 월 5K 이벤트 무료)
- Vercel Analytics (기본 제공)

**설정:**

```bash
npm install @sentry/nextjs

# sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

---

## Q9: PDF 스타일 포트폴리오 + 커스터마이징

**질문:** "기본 구조는 PDF 형식에 가깝게, 개인이 커스터마이징 가능하도록"

**답변:**

**기본 템플릿 (PDF 스타일):**

- 깔끔한 타이포그래피
- 섹션 구분 명확
- 인쇄 친화적

**커스터마이징 옵션 (v2):**

```prisma
model PortfolioSettings {
  theme      String  // "minimal" | "modern" | "classic"
  accentColor String // "#3b82f6"
  fontFamily String  // "Inter" | "Roboto"
}
```

---

## Q10-Q13: UI/UX 개선사항

**Q10: Public 포트폴리오 템플릿**

- 템플릿 기반 섹션 구성
- 반응형 레이아웃
- 다크모드 지원

**Q11: Private 대시보드**

- 사이드바 네비게이션
- 빠른 검색
- 자동저장

**Q12: Blog Lint UI**

- 실시간 검출 결과 표시
- 클릭하면 해당 위치로 이동
- Ignore 사유 기록

**Q13: 접근성 (a11y)**

- 키보드 네비게이션 지원
- ARIA 레이블 추가
- 색상 대비 4.5:1 이상
- 스크린 리더 테스트

---

## Wave3-Closure QA 보강 (2026-02-27)

### 사전 조건

- `.env`는 필수, `.env.local`은 선택(개인 오버라이드)
- 로컬 `npm install` 전에 `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`를 설정
- 설치 중 `prisma generate` 실패 시 `npm install --ignore-scripts` -> `.env` 확인 -> `npx prisma generate` 순서로 복구

### 핵심 스모크 동선

1. `/` 랜딩 접근 확인
2. `/login` 로그인 진입 UI 확인
3. 로그인 상태에서 `/app` 진입 확인
4. `/app/portfolio/settings` 미리보기 렌더 확인
5. `/app` -> `/` 이동 후 홈 CTA가 `워크스페이스로 이동`으로 표시되는지 확인
6. 다시 `/app` 복귀 시 세션 유지 확인

### 판정 기준

- Preview/Production 각각에서 핵심 스모크 동선 전부 통과
- 게이트(`lint`, `build`, `jest`, `vercel-build`) 통과
- 실패 시 `x-request-id` + 배포 로그를 함께 기록
