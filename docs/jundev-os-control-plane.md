# jundev-os Control Plane Architecture

## Deployment Target

- Vercel team: `team_8yPdpJMjLygvDPFW9ClhMKXp`
- Vercel project: `porest` (`prj_XBcoiLebJJmxsvEnGtPitPE0t658`)
- Production domains: `jundevcodes.info`, `www.jundevcodes.info`
- Runtime app: PoReSt Next.js workspace
- Database: Neon Postgres through Prisma 7
- Required env names: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `OWNER_EMAIL`, `NEXT_PUBLIC_SITE_URL`

## Figma Design

- File: <https://www.figma.com/design/34RbWOwavm43VHX3T0P5jW>
- Pages:
  - Captured current control-plane UI
  - `Target Architecture`: Vercel + Neon + 4 systems + PoReSt target service map

## Runtime Shape

PoReSt remains the deployed public product. The jundev-os control plane is added as an owner-only private workspace route:

- UI: `/app/jundev-os`
- State API: `GET /api/app/jundev-os/state`
- Event API: `POST /api/app/jundev-os/events`
- Job API: `POST /api/app/jundev-os/jobs`
- Workflow API: `POST /api/app/jundev-os/workflows`
- Decision API: `POST /api/app/jundev-os/decisions/:id/resolve`

The control plane is owner-gated with `requireOwner()`. Normal PoReSt public pages and authenticated workspace pages keep their existing behavior.

## Data Contract

The migration `20260427143000_jundev_os_control_plane` adds:

- `SystemEvent`: append-only operational timeline
- `SystemReport`: workflow and analysis reports
- `SystemDecision`: approval queue and audit trail
- `ContentJob`: unit of work for content, campaign, release, and system tasks
- `WorkflowRun`: workflow execution history

All tables are scoped by `ownerId` and cascade when a user is deleted.

## System Allocation

- `LIFE_HACK`: content ideas, routines, publishing jobs
- `JARVIS`: events, reports, decisions, operational audit
- `TECH`: workflow execution, reference sync, release gates
- `MONEY`: monetization experiments, campaign jobs, risk review
- `POREST`: deployed Next.js product, domain, Neon health, workspace host

## Vercel / Neon Build Path

The existing `vercel.json` uses `npm run vercel-build`, which runs:

```bash
prisma migrate deploy && next build
```

That means the new control-plane tables are created during production deployment as long as `DATABASE_URL_UNPOOLED` is set for the Vercel project. Vercel's documented local verification path is:

```bash
vercel env run -e production -- next build
```

Use `vercel pull --environment=production` when the local machine needs to verify production environment names without exposing secret values.
