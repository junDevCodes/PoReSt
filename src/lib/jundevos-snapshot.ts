import fs from "node:fs";
import path from "node:path";

export type JundevOsSystemStatus = "ok" | "warn" | "fail";

export type JundevOsSystemHealth = {
  key: string;
  label: string;
  status: JundevOsSystemStatus;
  summary: string;
  recent_events?: Array<{ id: string; level: string; event_type: string; summary: string }>;
};

export type JundevOsRecentEvent = {
  id: string;
  occurred_at: string;
  source_system: string;
  event_type: string;
  level: string;
  summary: string;
};

export type JundevOsDecision = {
  id: string;
  created_at?: string;
  status: string;
  level?: string;
  priority?: string;
  question?: string;
  source_system?: string;
};

export type JundevOsSinkSummary = {
  total_dispatches: number;
  failures: number;
  failure_ratio: number;
};

export type JundevOsGraphNode = {
  id: string;
  type: "system" | "event" | "decision" | "job" | "report" | "vault";
  label: string;
  color: string;
  size: number;
  level?: string;
  source_system?: string;
  status?: string;
  category?: string;
};

export type JundevOsGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: "emits" | "summarizes" | "raised_by" | "owned_by" | "awaits" | "wikilinks_to";
};

export type JundevOsGraph = {
  nodes: JundevOsGraphNode[];
  edges: JundevOsGraphEdge[];
  counts: { nodes: number; edges: number };
};

export type JundevOsVaultEntry = {
  id: string;
  rel_path: string;
  category: string;
  title: string;
  mtime: string;
  word_count: number;
  wikilink_count: number;
  backlink_count: number;
  tags: string[];
  wikilinks_out?: string[];
};

export type JundevOsVaultSummary = {
  available: boolean;
  total: number;
  total_words: number;
  total_wikilinks: number;
  by_category: Record<string, number>;
  recent: JundevOsVaultEntry[];
  lint: { orphans_count: number; broken_links_count: number; stale_count: number; health: string };
};

export type JundevOsSnapshot = {
  generated_at: string;
  overall_status: JundevOsSystemStatus;
  systems: JundevOsSystemHealth[];
  recent_events: JundevOsRecentEvent[];
  decisions_open: JundevOsDecision[];
  sink_summary: JundevOsSinkSummary;
  graph: JundevOsGraph;
  vault: JundevOsVaultSummary;
  counts: { events: number; reports: number; decisions: number; jobs: number; runs: number };
  source: "live" | "mock";
  debug?: { cwd: string; tried: Array<{ dir: string; reason: string; exists: boolean }>; error?: string };
};

const SYSTEM_LABELS: Record<string, string> = {
  jarvis: "jarvis (인터페이스)",
  tech: "tech (작업 프로토콜)",
  money: "money (콘텐츠)",
  agents: "agents (5 spec)",
  integrations: "integrations (경계)",
};

const MOCK_SNAPSHOT: JundevOsSnapshot = {
  generated_at: "2026-05-05T00:00:00.000Z",
  overall_status: "ok",
  systems: [
    { key: "jarvis", label: SYSTEM_LABELS.jarvis, status: "ok", summary: "Pipeline base + sink/router 가동" },
    { key: "tech", label: SYSTEM_LABELS.tech, status: "ok", summary: "5 workflow + 13 rules" },
    { key: "money", label: SYSTEM_LABELS.money, status: "ok", summary: "asset_plan 객체화 + stage_history" },
    { key: "agents", label: SYSTEM_LABELS.agents, status: "ok", summary: "5 spec + spec-template" },
    { key: "integrations", label: SYSTEM_LABELS.integrations, status: "ok", summary: "3 sub-domain (porest/life-hack/obsidian)" },
  ],
  recent_events: [
    { id: "evt-mock-1", occurred_at: "2026-05-05T00:00:00.000Z", source_system: "jarvis", event_type: "status.summary", level: "L1", summary: "v2.0.0 plan approved (W1 → W4)" },
    { id: "evt-mock-2", occurred_at: "2026-05-05T00:00:00.000Z", source_system: "jarvis", event_type: "status.summary", level: "L1", summary: "Stage 4 (P5 DEFER 차용) complete + jundev-os v1.0.0" },
    { id: "evt-mock-3", occurred_at: "2026-05-05T00:00:00.000Z", source_system: "jarvis", event_type: "status.summary", level: "L1", summary: "Stage 3 (P4 Diagnostic) complete" },
  ],
  decisions_open: [
    {
      id: "dec-mock-1",
      status: "open",
      level: "L3",
      priority: "high",
      question: "모의 결정 — live snapshot 미연결 시 표시",
      source_system: "money",
    },
  ],
  sink_summary: { total_dispatches: 0, failures: 0, failure_ratio: 0 },
  graph: { nodes: [], edges: [], counts: { nodes: 0, edges: 0 } },
  vault: {
    available: false,
    total: 0,
    total_words: 0,
    total_wikilinks: 0,
    by_category: {},
    recent: [],
    lint: { orphans_count: 0, broken_links_count: 0, stale_count: 0, health: "info" },
  },
  counts: { events: 9, reports: 8, decisions: 1, jobs: 1, runs: 0 },
  source: "mock",
};

const SYSTEM_COLOR: Record<string, string> = {
  jarvis: "#0ea5e9",
  tech: "#a78bfa",
  money: "#f59e0b",
  agents: "#10b981",
  integrations: "#ec4899",
};

const LEVEL_SIZE: Record<string, number> = { L0: 16, L1: 22, L2: 30, L3: 40 };

const VAULT_COLOR = "#854d0e";

function buildGraph(
  events: JundevOsRecentEvent[],
  decisions: Array<Record<string, unknown>>,
  jobs: Array<Record<string, unknown>>,
  reports: Array<Record<string, unknown>>,
  vaultEntries: JundevOsVaultEntry[],
  limit: number,
): JundevOsGraph {
  const nodes: JundevOsGraphNode[] = [];
  const edges: JundevOsGraphEdge[] = [];
  const seen = new Set<string>();

  const addNode = (n: JundevOsGraphNode) => {
    if (!seen.has(n.id)) {
      seen.add(n.id);
      nodes.push(n);
    }
  };

  for (const sys of Object.keys(SYSTEM_COLOR)) {
    addNode({ id: `sys-${sys}`, type: "system", label: sys, color: SYSTEM_COLOR[sys], size: 50 });
  }

  const recentEvents = events.slice(-limit);
  for (const e of recentEvents) {
    addNode({
      id: e.id,
      type: "event",
      label: (e.summary || e.event_type || e.id).slice(0, 40),
      color: SYSTEM_COLOR[e.source_system] ?? "#94a3b8",
      size: LEVEL_SIZE[e.level] ?? 22,
      level: e.level,
      source_system: e.source_system,
    });
    if (SYSTEM_COLOR[e.source_system]) {
      edges.push({ id: `${e.id}__sys`, source: e.id, target: `sys-${e.source_system}`, type: "emits" });
    }
  }

  for (const r of reports.slice(-limit)) {
    const id = String(r.id ?? "");
    if (!id) continue;
    addNode({
      id,
      type: "report",
      label: String(r.title ?? "report").slice(0, 40),
      color: "#64748b",
      size: 18,
    });
    const sourceEvents = Array.isArray(r.source_events) ? r.source_events : [];
    for (const evtId of sourceEvents) {
      if (typeof evtId === "string" && seen.has(evtId)) {
        edges.push({ id: `${id}__${evtId}`, source: id, target: evtId, type: "summarizes" });
      }
    }
  }

  for (const d of decisions) {
    const id = String(d.id ?? "");
    if (!id) continue;
    const status = String(d.status ?? "open");
    addNode({
      id,
      type: "decision",
      label: String(d.title ?? d.question ?? id).slice(0, 40),
      color: status === "resolved" ? "#22c55e" : "#ef4444",
      size: 28,
      status,
    });
    if (typeof d.source_event === "string" && seen.has(d.source_event)) {
      edges.push({ id: `${id}__${d.source_event}`, source: id, target: d.source_event, type: "raised_by" });
    }
  }

  for (const j of jobs) {
    const id = String(j.id ?? "");
    if (!id) continue;
    addNode({
      id,
      type: "job",
      label: String(j.topic ?? id).slice(0, 40),
      color: "#f59e0b",
      size: 24,
      status: String(j.status ?? "draft"),
    });
    edges.push({ id: `${id}__sys`, source: id, target: "sys-money", type: "owned_by" });
    const approval = j.approval as { decision_request?: string } | undefined;
    const ref = approval?.decision_request;
    if (ref && seen.has(ref)) {
      edges.push({ id: `${id}__${ref}`, source: id, target: ref, type: "awaits" });
    }
  }

  // vault nodes + wikilink edges
  const vaultByTitle = new Map<string, JundevOsVaultEntry>();
  for (const v of vaultEntries) vaultByTitle.set(v.title, v);
  for (const v of vaultEntries) {
    addNode({
      id: v.id,
      type: "vault",
      label: v.title.slice(0, 40),
      color: VAULT_COLOR,
      size: 16,
      category: v.category,
    });
  }
  for (const v of vaultEntries) {
    for (const link of v.wikilinks_out ?? []) {
      const target = vaultByTitle.get(link);
      if (target) {
        edges.push({
          id: `${v.id}__wl__${target.id}`,
          source: v.id,
          target: target.id,
          type: "wikilinks_to",
        });
      }
    }
  }

  return { nodes, edges, counts: { nodes: nodes.length, edges: edges.length } };
}

function loadVaultEntries(snapshotDir: string): JundevOsVaultEntry[] {
  const candidatePath = path.join(snapshotDir, "vault.json");
  if (!fs.existsSync(candidatePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
    return Array.isArray(raw.entries) ? raw.entries : [];
  } catch {
    return [];
  }
}

function loadVaultSummary(snapshotDir: string): JundevOsVaultSummary {
  const candidatePath = path.join(snapshotDir, "vault.json");
  if (!fs.existsSync(candidatePath)) {
    return {
      available: false,
      total: 0,
      total_words: 0,
      total_wikilinks: 0,
      by_category: {},
      recent: [],
      lint: { orphans_count: 0, broken_links_count: 0, stale_count: 0, health: "info" },
    };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
    const recent: JundevOsVaultEntry[] = Array.isArray(raw.entries)
      ? [...raw.entries]
          .sort((a, b) => (b.mtime || "").localeCompare(a.mtime || ""))
          .slice(0, 6)
      : [];
    return {
      available: true,
      total: raw.counts?.total ?? recent.length,
      total_words: raw.counts?.total_words ?? 0,
      total_wikilinks: raw.counts?.total_wikilinks ?? 0,
      by_category: raw.counts?.by_category ?? {},
      recent,
      lint: raw.lint ?? { orphans_count: 0, broken_links_count: 0, stale_count: 0, health: "info" },
    };
  } catch {
    return {
      available: false,
      total: 0,
      total_words: 0,
      total_wikilinks: 0,
      by_category: {},
      recent: [],
      lint: { orphans_count: 0, broken_links_count: 0, stale_count: 0, health: "info" },
    };
  }
}

export function loadJundevOsSnapshot(): JundevOsSnapshot {
  const envOverride = process.env.JUNDEVOS_RUNTIME_DIR;
  const tried = [
    envOverride ? { dir: envOverride, reason: "env" } : null,
    { dir: path.resolve(process.cwd(), "data", "jundev-os-snapshot"), reason: "cwd/data (Vercel-friendly)" },
    { dir: path.resolve(process.cwd(), "..", "runtime", "control-plane"), reason: "cwd/..(monorepo root)" },
    { dir: path.resolve(process.cwd(), "runtime", "control-plane"), reason: "cwd/runtime" },
    { dir: path.resolve(process.cwd(), "..", "..", "runtime", "control-plane"), reason: "cwd/../.." },
  ]
    .filter((c): c is { dir: string; reason: string } => c !== null)
    .map((c) => ({ ...c, exists: fs.existsSync(c.dir) }));
  const debugInfo = { cwd: process.cwd(), tried };

  const runtimeRoot = tried.find((c) => c.exists);
  if (!runtimeRoot) {
    return { ...MOCK_SNAPSHOT, debug: debugInfo };
  }

  const dir = runtimeRoot.dir;
  try {
    const eventsPath = path.join(dir, "events.json");
    const reportsPath = path.join(dir, "reports.json");
    const decisionsPath = path.join(dir, "decisions.json");
    const jobsPath = path.join(dir, "content-jobs.json");
    const runsPath = path.join(dir, "workflow-runs.json");

    const events: JundevOsRecentEvent[] = JSON.parse(fs.readFileSync(eventsPath, "utf8"));
    const reports = JSON.parse(fs.readFileSync(reportsPath, "utf8"));
    const decisions: Array<Record<string, unknown>> = JSON.parse(
      fs.readFileSync(decisionsPath, "utf8"),
    );
    const jobs = JSON.parse(fs.readFileSync(jobsPath, "utf8"));
    const runs = fs.existsSync(runsPath) ? JSON.parse(fs.readFileSync(runsPath, "utf8")) : [];

    const decisionsOpen: JundevOsDecision[] = decisions
      .filter((d) => (d.status as string) !== "resolved")
      .slice(0, 5)
      .map((d) => ({
        id: String(d.id ?? "(no-id)"),
        created_at: typeof d.created_at === "string" ? d.created_at : undefined,
        status: String(d.status ?? "unknown"),
        level: typeof d.level === "string" ? d.level : undefined,
        priority: typeof d.priority === "string" ? d.priority : undefined,
        question: typeof d.question === "string" ? d.question : (d.summary as string) ?? undefined,
        source_system: typeof d.source_system === "string" ? d.source_system : undefined,
      }));

    const sinkFailureCount = events.filter((e) => e.event_type === "sink.failed").length;
    const sinkDispatchCount = events.filter(
      (e) =>
        e.event_type === "policy.blocked" ||
        e.event_type === "decision.required" ||
        e.event_type === "workflow.failed" ||
        e.event_type === "status.summary",
    ).length;
    const sinkSummary: JundevOsSinkSummary = {
      total_dispatches: sinkDispatchCount,
      failures: sinkFailureCount,
      failure_ratio: sinkDispatchCount > 0 ? sinkFailureCount / sinkDispatchCount : 0,
    };

    const recent = [...events]
      .sort((a, b) => (b.occurred_at || "").localeCompare(a.occurred_at || ""))
      .slice(0, 5);

    const systems: JundevOsSystemHealth[] = Object.keys(SYSTEM_LABELS).map((key) => {
      const systemEvents = events.filter((e) => e.source_system === key).slice(-3);
      const hasFail = events.some(
        (e) => e.source_system === key && (e.event_type === "workflow.failed" || e.event_type === "sink.failed"),
      );
      return {
        key,
        label: SYSTEM_LABELS[key],
        status: hasFail ? "warn" : "ok",
        summary: `events: ${systemEvents.length} (recent)`,
        recent_events: systemEvents.map((e) => ({
          id: e.id,
          level: e.level,
          event_type: e.event_type,
          summary: e.summary,
        })),
      };
    });

    const vaultEntries = loadVaultEntries(dir);
    const graph = buildGraph(events, decisions, jobs, reports, vaultEntries, 30);
    const vault = loadVaultSummary(dir);

    return {
      generated_at: new Date().toISOString(),
      overall_status: systems.some((s) => s.status === "fail") ? "fail" : "ok",
      systems,
      recent_events: recent,
      decisions_open: decisionsOpen,
      sink_summary: sinkSummary,
      graph,
      vault,
      counts: {
        events: events.length,
        reports: reports.length,
        decisions: decisions.length,
        jobs: jobs.length,
        runs: runs.length,
      },
      source: "live",
      debug: debugInfo,
    };
  } catch (err) {
    return {
      ...MOCK_SNAPSHOT,
      debug: { ...debugInfo, error: err instanceof Error ? err.message : String(err) },
    };
  }
}
