# PoReSt Architecture (M0 Foundation)

## 1) One-line summary
Single Next.js(App Router) app that serves **Public Portfolio** with ISR and protects **Private Workspace** with Auth.js + middleware, backed by PostgreSQL + Prisma.

---

## 2) System overview
```mermaid
flowchart LR
  Browser -->|Public| PublicRoutes["/(public) routes"]
  Browser -->|Authenticated| PrivateRoutes["/(private) routes"]

  PublicRoutes --> AppRouter["Next.js App Router"]
  PrivateRoutes --> AppRouter

  AppRouter --> Middleware["Middleware: /app/*, /api/app/*"]
  AppRouter --> RouteHandlers["Route Handlers: /api/public/*, /api/app/*"]
  AppRouter --> Auth["Auth.js (NextAuth)"]

  RouteHandlers --> Prisma["Prisma Client"]
  Auth --> Prisma
  Prisma --> Postgres["PostgreSQL (pooled connection)"]
```

---

## 3) Public / Private boundary
- **Routing layer**: `(public)` and `(private)` Route Groups.
- **Middleware**: Block `/app/*` + `/api/app/*` when unauthenticated.
- **API layer**: `/api/public/*` vs `/api/app/*` naming split.
- **Access policy**: 로그인 사용자는 private 접근 가능하고, 운영성 API만 `User.isOwner === true`로 제한.

---

## 4) Tech stack (fixed for v1)
- Next.js (App Router)
- Auth.js (NextAuth) + Prisma Adapter
- Prisma ORM + PostgreSQL
- Tailwind CSS (UI)
- Vercel (deploy)

---

## 5) Folder structure
```
/src
  /app
    /(public)
    /(private)
    /api
  /lib
  /components
/prisma
```

---

## 6) Route groups
- **Public**: `/`, `/projects`, `/u/[publicSlug]`, `/u/[publicSlug]/projects`, `/u/[publicSlug]/projects/[slug]`, `/projects/[slug]`(레거시 리다이렉트), `/auth/*`
- **Private**: `/app`, `/app/*`
- **API**
  - Public: `/api/public/*`
  - Private: `/api/app/*`

---

## 7) Environment variables
Required (M0):
- `DATABASE_URL` (pooled connection string)
- `AUTH_SECRET`
- `AUTH_TRUST_HOST`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `NEXT_PUBLIC_SITE_URL`

---

## 8) Security / performance decisions
- **Session strategy**: JWT (Edge middleware compatibility).
- **Cookies**: HttpOnly + Secure (prod) + SameSite=Lax.
- **Public pages**: ISR with `revalidate` (time-based).
- **Private pages**: no cache; 로그인 사용자 접근 + ownerId 데이터 격리.

---

## 9) DB connection / pooling (serverless)
- Use a **pooled** PostgreSQL connection string (Prisma Postgres or Neon pooled).
- Keep Prisma client singleton in `src/lib/prisma.ts`.
- Avoid per-request client instantiation to prevent connection storms.

---

## 10) Decision log (M0)
- Split API namespaces: `/api/public/*` vs `/api/app/*`.
- Protect private routes via middleware + server-side auth/ownerId scope check.
- JWT sessions for edge-safe auth validation.


