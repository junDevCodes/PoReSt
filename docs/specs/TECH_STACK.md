# PoReSt (Portfolio Resume Studio) - 기술 스택 명세서

> **버전**: v1.0  
> **작성일**: 2026-02-04  
> **목적**: 프로젝트의 모든 기술 스택 버전을 명확히 정의하고 호환성을 보장

---

## 🎯 핵심 프레임워크

### Next.js
- **버전**: `16.1.6` (2025년 12월 릴리즈)
- **이유**: App Router 안정화, React 19 지원, 최신 보안 패치
- **주요 기능**: App Router, Server Components, Route Handlers, ISR

### React
- **버전**: `19.2.3`
- **이유**: Next.js 16과 공식 호환, React Compiler 지원
- **주요 기능**: Server Components, Actions, use hook

### TypeScript
- **버전**: `^5` (5.x 최신)
- **이유**: Next.js 16 공식 지원, 최신 타입 기능

---

## 🗄️ 데이터베이스 & ORM

### Prisma
- **Prisma Client**: `^7.3.0`
- **Prisma CLI**: `^7.3.0` (devDependencies)
- **이유**: PostgreSQL 완벽 지원, Next.js 서버리스 환경 최적화
- **주요 기능**: Type-safe queries, Migration, Prisma Studio
- **참고**: 현재 레포 버전에 맞춰 7.x 사용

### PostgreSQL
- **추천 버전**: PostgreSQL 15.x 또는 16.x
- **서비스 선택지**:
  - **Neon**: Serverless Postgres (무료 tier: 0.5GB)
  - **Prisma Postgres**: Built-in pooling (무료 tier: 512MB)
  - **Supabase**: pgvector 지원 (무료 tier: 500MB)
- **확정**: 프로젝트 시작 시 선택 필요

---

## 🔐 인증

### NextAuth.js
- **next-auth**: `^4.24.13` (v4 stable)
- **@auth/prisma-adapter**: `^2.11.1` (v4용)
- **이유**: 검증된 안정 버전, Next.js 13+ App Router 지원
- **주요 기능**: Prisma Adapter, Session 관리, 로그인 사용자 인증 + 운영 권한(`isOwner`) 제어
- **참고**: v5는 beta 상태로 production 사용 보류

---

## 🎨 UI/스타일링

### Tailwind CSS
- **tailwindcss**: `^4` (Tailwind CSS v4.0 - 2024년 릴리즈)
- **@tailwindcss/postcss**: `^4`
- **이유**: 성능 대폭 개선, CSS-in-JS 불필요
- **주요 기능**: Utility-first, Just-in-Time compilation

### shadcn/ui (선택)
- **설치 시점**: M1 Portfolio UI 구현 시
- **버전**: 최신 (CLI로 설치)
- **명령어**: `npx shadcn@latest init`

---

## 🛠️ 개발 도구

### ESLint
- **eslint**: `^9`
- **eslint-config-next**: `16.1.6`
- **이유**: Next.js 16 호환, 최신 린트 규칙

### Prettier
- **prettier**: `^3.8.1`
- **이유**: 코드 포맷팅 일관성, TypeScript/JSX 지원

---

## 📦 추가 예정 패키지 (M3-M4)

### Notes Graph (M3)
```json
{
  "@pgvector/prisma": "^0.2.0",  // pgvector support
  "openai": "^4.0.0"  // 임베딩 생성 (선택)
}
```

### Blog Lint (M4)
```json
{
  "remark": "^15.0.0",  // Markdown 파싱
  "remark-parse": "^11.0.0",
  "unified": "^11.0.0"
}
```

---

## 🚀 배포

### Vercel
- **플랫폼**: Vercel (Next.js 최적화)
- **Node.js 버전**: `20.x` (Vercel 권장)
- **빌드 명령**: `npm run vercel-build`

---

## 📋 Node.js & npm

### 로컬 개발 환경
- **Node.js**: `20.x LTS` (권장: 20.11.0 이상)
- **npm**: `10.x` (Node 20과 함께 설치)
- **확인 명령**:
  ```bash
  node -v  # v20.x.x
  npm -v   # 10.x.x
  ```

---

## 🔗 호환성 매트릭스

| 패키지 | 버전 | Next.js 16 | React 19 | Node 20 | TypeScript 5 |
|--------|------|-----------|----------|---------|--------------|
| next | 16.1.6 | ✅ | ✅ | ✅ | ✅ |
| react | 19.2.3 | ✅ | ✅ | ✅ | ✅ |
| prisma | ^7.3.0 | ✅ | ✅ | ✅ | ✅ |
| next-auth | ^4.24.13 | ✅ | ✅ | ✅ | ✅ |
| tailwindcss | ^4 | ✅ | ✅ | ✅ | ✅ |

---

## ⚠️ 중요 호환성 노트

### 1. Next.js 16 + React 19
- **필수**: React 19.2.0 이상
- **주의**: React 18은 호환 안 됨

### 2. Prisma + PostgreSQL
- **서버리스**: Pooled connection 필수
- **환경변수**: `DATABASE_URL` (direct), `DATABASE_URL_UNPOOLED` (pooled)

### 3. NextAuth.js v4
- **안정성**: Production-ready stable 버전
- **필수**: `@auth/prisma-adapter` v2.11.1 (Prisma v7 호환)
- **v5**: Beta 단계로 production 사용 보류

### 4. Tailwind CSS v4
- **변경사항**: PostCSS 설정 방식 변경
- **마이그레이션**: v3에서 업그레이드 시 가이드 참조

---

## 📝 package.json 전체 의존성

### dependencies
```json
{
  "@auth/prisma-adapter": "^2.11.1",
  "@prisma/client": "^7.3.0",
  "@auth/prisma-adapter": "^2.11.1",
  "next": "16.1.6",
  "next-auth": "^4.24.13",
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

### devDependencies
```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.1.6",
  "prettier": "^3.8.1",
  "prisma": "^7.3.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## 🔄 업데이트 정책

- **메이저 버전**: 팀 합의 후 업그레이드
- **마이너 버전**: 보안 패치는 즉시, 기능 추가는 검토 후
- **패치 버전**: 자동 업데이트 허용 (`^` 사용)

---

## ✅ 설치 검증 체크리스트

```bash
# 1. Node.js 버전 확인
node -v  # v20.x.x 이상

# 2. 의존성 설치
npm install

# 3. TypeScript 타입 체크
npm run build

# 4. ESLint 실행
npm run lint

# 5. Prisma 클라이언트 생성
npx prisma generate

# 6. 개발 서버 실행
npm run dev
```

---

**마지막 업데이트**: 2026-02-04  
**다음 리뷰**: M0 완료 시 (Prisma/Auth.js 설치 후)

