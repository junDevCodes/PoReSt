import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getMetadataBase } from "@/lib/site-url";
import { loadJundevOsSnapshot } from "@/lib/jundevos-snapshot";
import { GraphView } from "@/components/jundev-os/GraphView";
import { RefreshButton } from "@/components/jundev-os/RefreshButton";
import { VoiceCommand } from "@/components/jundev-os/VoiceCommand";

const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "jundev-os — 운영 OS",
  description:
    "jarvis · tech · money · agents 4 시스템과 PoReSt 제품을 통합 운영하는 개인 OS 대시보드.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "jundev-os",
    url: "/",
    title: "jundev-os — 운영 OS",
    description:
      "jarvis · tech · money · agents 4 시스템과 PoReSt 제품을 통합 운영하는 개인 OS 대시보드.",
    images: [{ url: DEFAULT_OG_IMAGE_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: "jundev-os — 운영 OS",
    description:
      "jarvis · tech · money · agents 4 시스템과 PoReSt 제품을 통합 운영하는 개인 OS 대시보드.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export const revalidate = 60;

const STATUS_COLOR: Record<string, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  fail: "bg-rose-500",
};

const LEVEL_BADGE: Record<string, string> = {
  L0: "bg-slate-100 text-slate-700",
  L1: "bg-sky-100 text-sky-700",
  L2: "bg-amber-100 text-amber-800",
  L3: "bg-rose-100 text-rose-700",
};

function formatTime(iso: string): string {
  if (!iso) return "—";
  return iso.slice(0, 16).replace("T", " ");
}

export default async function HomePage() {
  const snapshot = loadJundevOsSnapshot();
  const session = await getServerSession(authOptions);
  const hasSession = Boolean(session?.user?.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f5f2] text-[#1a1a1a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-300/40 blur-[120px]" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/40 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-200/40 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-16">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">jundev-os</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">
              개인 운영 OS
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-black/65">
              jarvis · tech · money · agents 4 시스템 + PoReSt 제품을 단일 layer로 운영합니다.
              본 페이지는 실시간 운영 상태를 build-time snapshot으로 노출합니다.
            </p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-medium">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[snapshot.overall_status]}`} />
              overall: {snapshot.overall_status}
              <span className="text-black/40">·</span>
              <span className="text-black/50">{snapshot.source === "live" ? "live snapshot" : "mock"}</span>
            </div>
            <RefreshButton />
          </div>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {snapshot.systems.map((system) => (
            <article
              key={system.key}
              className="rounded-2xl border border-black/10 bg-white/75 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[system.status]}`} />
                <span className="text-xs uppercase tracking-wider text-black/50">{system.key}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold">{system.label}</h3>
              <p className="mt-2 text-xs leading-5 text-black/60">{system.summary}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">최근 이벤트</h2>
              <span className="text-xs text-black/50">jarvis events.json (최신 5건)</span>
            </div>
            {snapshot.recent_events.length === 0 ? (
              <p className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/60">
                기록된 이벤트가 없습니다.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {snapshot.recent_events.map((event) => (
                  <li key={event.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${LEVEL_BADGE[event.level] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {event.level}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-snug">{event.summary}</p>
                        <p className="mt-1 text-xs text-black/50">
                          {event.source_system} · {event.event_type} · {formatTime(event.occurred_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-semibold">store counts</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">events</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.counts.events}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">reports</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.counts.reports}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">decisions</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.counts.decisions}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">jobs</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.counts.jobs}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-black/60">workflow runs</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.counts.runs}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-black/40">snapshot: {formatTime(snapshot.generated_at)}</p>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold">Knowledge Graph</h2>
            <span className="text-xs text-black/50">
              5 시스템 + events / decisions / jobs / reports — 노드 클릭 시 상세
            </span>
          </div>
          <p className="mt-1 text-xs text-black/50">
            nodes: {snapshot.graph.counts.nodes} · edges: {snapshot.graph.counts.edges}
          </p>
          <div className="mt-4">
            <GraphView graph={snapshot.graph} />
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">결정 대기열 (open decisions)</h2>
              <span className="text-xs text-black/50">jarvis L3 escalation</span>
            </div>
            {snapshot.decisions_open.length === 0 ? (
              <p className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/60">
                대기 중인 결정이 없습니다. ✓
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {snapshot.decisions_open.map((decision) => (
                  <li key={decision.id} className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${LEVEL_BADGE[decision.level ?? "L1"] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {decision.level ?? "L?"}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-snug">
                          {decision.question ?? decision.id}
                        </p>
                        <p className="mt-1 text-xs text-black/50">
                          {decision.source_system ?? "—"} · status: {decision.status} ·
                          priority: {decision.priority ?? "normal"} ·
                          {decision.created_at ? ` ${formatTime(decision.created_at)}` : ""}
                        </p>
                      </div>
                      <VoiceCommand decision={{ id: decision.id, question: decision.question, level: decision.level }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-semibold">sink delivery</h2>
            <p className="mt-1 text-xs text-black/50">events.json 기반 통계</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">total dispatches</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {snapshot.sink_summary.total_dispatches}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">failures</dt>
                <dd
                  className={`text-lg font-semibold tabular-nums ${snapshot.sink_summary.failures > 0 ? "text-rose-600" : ""}`}
                >
                  {snapshot.sink_summary.failures}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-black/60">failure ratio</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {(snapshot.sink_summary.failure_ratio * 100).toFixed(1)}%
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] leading-4 text-black/40">
              D1 recursion guard + sink-failure-isolation rule이 적용 중. failure ratio &gt; 5% 시
              jarvis L2 alert.
            </p>
          </article>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Second Brain — vault 최근 entry</h2>
              <span className="text-xs text-black/50">
                Life Hack vault · meta only (privacy)
              </span>
            </div>
            {snapshot.vault.available ? (
              <ul className="mt-4 space-y-2">
                {snapshot.vault.recent.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-black/10 bg-[#faf9f6] p-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{entry.title}</p>
                        <p className="mt-1 truncate text-[11px] text-black/50">
                          {entry.category} · {entry.rel_path} · {formatTime(entry.mtime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-black/50 whitespace-nowrap">
                        <span>{entry.word_count}w</span>
                        {entry.wikilink_count > 0 ? <span>↗{entry.wikilink_count}</span> : null}
                        {entry.backlink_count > 0 ? <span>↙{entry.backlink_count}</span> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/60">
                vault.json 미연결. `npm run snapshot:sync` 후 다시 빌드하세요.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-semibold">vault stats</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">total entries</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.vault.total}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">total words</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.vault.total_words}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">wikilinks</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.vault.total_wikilinks}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-black/60">lint health</dt>
                <dd
                  className={`text-sm font-semibold ${snapshot.vault.lint.health === "ok" ? "text-emerald-600" : snapshot.vault.lint.health === "warn" ? "text-amber-600" : "text-black/50"}`}
                >
                  {snapshot.vault.lint.health}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-black/40">
              orphans {snapshot.vault.lint.orphans_count} · broken{" "}
              {snapshot.vault.lint.broken_links_count} · stale {snapshot.vault.lint.stale_count}
            </p>
            <p className="mt-3 text-[11px] leading-4 text-black/40">
              LLM-Wiki 패턴 (3-layer + 4 ops). vault body는 commit X — meta만 노출.
            </p>
          </article>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Claude Code 학습 누적</h2>
              <span className="text-xs text-black/50">사용자 메시지 통계 (counts only — privacy)</span>
            </div>
            {snapshot.cc.available && snapshot.cc.projects.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {snapshot.cc.projects.map((p) => (
                  <li key={p.project} className="rounded-xl border border-black/10 bg-[#faf9f6] p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium" title={p.project}>
                        {p.project.replace(/^C--Users-jylee-/, "").replace(/^Desktop-/, "").replace(/-/g, " / ")}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-black/50 whitespace-nowrap">
                        <span>📁 {p.sessions_count} sessions</span>
                        <span>💬 {p.total_messages} msgs</span>
                        {p.latest_mtime ? <span>{formatTime(p.latest_mtime)}</span> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/60">
                cc-summary.json 미연결. `npm run snapshot:sync` 후 다시 빌드.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-semibold">cc stats</h2>
            <p className="mt-1 text-xs text-black/50">~/.claude/projects/ 누적</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">projects</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.cc.projects_total}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
                <dt className="text-black/60">sessions</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.cc.sessions_total}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-black/60">user messages</dt>
                <dd className="text-lg font-semibold tabular-nums">{snapshot.cc.messages_total}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] leading-4 text-black/40">
              사용자 메시지만 (Claude 응답 제외). preview / first_message 영구 X — counts만 prod 노출.
            </p>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-black/10 bg-white/75 p-6">
          <h2 className="text-2xl font-semibold">PoReSt 제품 진입</h2>
          <p className="mt-2 text-sm text-black/65">
            jundev-os의 첫 dogfooding 제품. 공개 포트폴리오 + 개인 워크스페이스.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/portfolio/jundevcodes"
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90"
            >
              포트폴리오 보기
            </Link>
            <Link
              href="/landing"
              className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
            >
              PoReSt 소개
            </Link>
            {hasSession ? (
              <Link
                href="/app"
                className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
              >
                워크스페이스로 이동
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
              >
                로그인
              </Link>
            )}
            <Link
              href="/projects"
              className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
            >
              공개 프로젝트
            </Link>
          </div>
        </section>

        <footer className="mt-14 border-t border-black/10 pt-6 text-xs text-black/40">
          <p>
            jundev-os v1.0.0 · 4 시스템 한도 · 5 spec 한도 · no provider abstraction · no
            bot/auto-publish · 1 sink (local-markdown)
          </p>
          <p className="mt-1">
            본 대시보드는 build-time snapshot입니다. live API는 control-plane (port 4173) 참조.
          </p>
          {process.env.JUNDEVOS_DEBUG === "1" && snapshot.debug ? (
            <details className="mt-3 rounded-md border border-black/10 bg-white/40 p-2">
              <summary className="cursor-pointer text-[10px]">snapshot debug</summary>
              <pre className="mt-2 overflow-x-auto text-[10px] leading-4 text-black/60">
                {JSON.stringify(snapshot.debug, null, 2)}
              </pre>
            </details>
          ) : null}
        </footer>
      </main>
    </div>
  );
}
