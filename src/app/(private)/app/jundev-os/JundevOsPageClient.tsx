"use client";

import { useMemo, useState, type FormEvent } from "react";
import type {
  ControlPlaneDashboardDto,
  SystemDecisionDto,
  SystemSummaryDto,
} from "@/modules/jundev-os";

type JundevOsPageClientProps = {
  initialDashboard: ControlPlaneDashboardDto;
  figmaUrl: string;
  vercelProjectUrl: string;
};

type RequestState = {
  kind: "idle" | "success" | "error";
  text: string;
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "계획",
  READY: "준비",
  RUNNING: "실행",
  BLOCKED: "대기",
  DONE: "완료",
  FAILED: "실패",
  OPEN: "승인 대기",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELED: "취소",
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(json?.error?.message ?? `요청 실패: HTTP ${response.status}`);
  }

  return json?.data as T;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getSystemLabel(systems: SystemSummaryDto[], key: string) {
  return systems.find((system) => system.key === key)?.label ?? key;
}

function statusClass(status: string) {
  if (status === "DONE" || status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200";
  }
  if (status === "FAILED" || status === "REJECTED") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200";
  }
  if (status === "BLOCKED" || status === "OPEN") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200";
  }
  return "border-black/10 bg-black/[0.03] text-black/65 dark:border-white/10 dark:bg-white/10 dark:text-white/70";
}

function SmallStatus({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function JundevOsPageClient({
  initialDashboard,
  figmaUrl,
  vercelProjectUrl,
}: JundevOsPageClientProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [requestState, setRequestState] = useState<RequestState>({ kind: "idle", text: "" });
  const [busy, setBusy] = useState(false);

  const defaultSystem = dashboard.systems.find((system) => system.key === "POREST") ?? dashboard.systems[0];
  const workflowOptions = useMemo(() => {
    const all = dashboard.systems.flatMap((system) => system.workflows);
    return Array.from(new Set(["workspace-orchestration", "porest-release-gate", ...all]));
  }, [dashboard.systems]);

  async function refresh(nextMessage?: string) {
    const response = await fetch("/api/app/jundev-os/state", { cache: "no-store" });
    const nextDashboard = await readJsonResponse<ControlPlaneDashboardDto>(response);
    setDashboard(nextDashboard);
    if (nextMessage) {
      setRequestState({ kind: "success", text: nextMessage });
    }
  }

  async function runWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setBusy(true);
    setRequestState({ kind: "idle", text: "" });
    try {
      await readJsonResponse(
        await fetch("/api/app/jundev-os/workflows", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            system: formData.get("system"),
            workflowKey: formData.get("workflowKey"),
            summary: formData.get("summary"),
          }),
        }),
      );
      await refresh("워크플로가 실행되고 리포트가 생성되었습니다.");
      form.reset();
    } catch (error) {
      setRequestState({ kind: "error", text: error instanceof Error ? error.message : "워크플로 실행에 실패했습니다." });
    } finally {
      setBusy(false);
    }
  }

  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setBusy(true);
    setRequestState({ kind: "idle", text: "" });
    try {
      await readJsonResponse(
        await fetch("/api/app/jundev-os/jobs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            system: formData.get("system"),
            title: formData.get("title"),
            channel: formData.get("channel"),
            priority: formData.get("priority"),
            dueAt: formData.get("dueAt"),
            description: formData.get("description"),
            requiresApproval: formData.get("requiresApproval") === "on",
          }),
        }),
      );
      await refresh("작업이 Neon DB에 등록되었습니다.");
      form.reset();
    } catch (error) {
      setRequestState({ kind: "error", text: error instanceof Error ? error.message : "작업 생성에 실패했습니다." });
    } finally {
      setBusy(false);
    }
  }

  async function resolveDecision(decision: SystemDecisionDto, status: "APPROVED" | "REJECTED" | "CANCELED") {
    setBusy(true);
    setRequestState({ kind: "idle", text: "" });
    try {
      await readJsonResponse(
        await fetch(`/api/app/jundev-os/decisions/${decision.id}/resolve`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status,
            result: `${STATUS_LABELS[status]} 처리: ${decision.title}`,
          }),
        }),
      );
      await refresh("승인 요청이 처리되었습니다.");
    } catch (error) {
      setRequestState({ kind: "error", text: error instanceof Error ? error.message : "승인 처리에 실패했습니다." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/45 dark:text-white/45">jundev-os</p>
            <h1 className="mt-3 text-3xl font-semibold">Control Plane</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65 dark:text-white/65">
              Vercel의 PoReSt 서비스 안에서 Life Hack, Jarvis, Tech, Money, PoReSt를 하나의 운영 시스템으로 묶습니다.
              모든 실행, 승인, 작업, 리포트는 Neon Postgres에 기록됩니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={figmaUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-black/75 transition hover:border-black/35 dark:border-white/15 dark:text-white/75 dark:hover:border-white/35"
            >
              Figma 시안
            </a>
            <a
              href={vercelProjectUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-black/75 transition hover:border-black/35 dark:border-white/15 dark:text-white/75 dark:hover:border-white/35"
            >
              Vercel 프로젝트
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Events", dashboard.totals.events],
            ["Reports", dashboard.totals.reports],
            ["Open Decisions", dashboard.totals.openDecisions],
            ["Active Jobs", dashboard.totals.activeJobs],
            ["Workflow Runs", dashboard.totals.workflowRuns],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45 dark:text-white/45">{label}</p>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {requestState.kind !== "idle" && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            requestState.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {requestState.text}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-5">
        {dashboard.systems.map((system) => (
          <article
            key={system.key}
            className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5"
            style={{ borderTopColor: system.accent, borderTopWidth: 4 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{system.label}</h2>
                <p className="mt-1 text-xs font-medium text-black/45 dark:text-white/45">{system.owner}</p>
              </div>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: system.accent }} />
            </div>
            <p className="mt-3 min-h-16 text-sm leading-6 text-black/65 dark:text-white/65">{system.role}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-lg bg-black/[0.04] px-3 py-2 dark:bg-white/10">events {system.eventCount}</span>
              <span className="rounded-lg bg-black/[0.04] px-3 py-2 dark:bg-white/10">jobs {system.activeJobCount}</span>
              <span className="rounded-lg bg-black/[0.04] px-3 py-2 dark:bg-white/10">decisions {system.openDecisionCount}</span>
              <span className="rounded-lg bg-black/[0.04] px-3 py-2 dark:bg-white/10">runs {system.recentRunCount}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={runWorkflow} className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">워크플로 실행</h2>
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">실행 결과는 WorkflowRun, SystemReport, SystemEvent로 저장됩니다.</p>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
            >
              실행
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              시스템
              <select
                name="system"
                defaultValue={defaultSystem?.key}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
              >
                {dashboard.systems.map((system) => (
                  <option key={system.key} value={system.key}>
                    {system.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              워크플로
              <select
                name="workflowKey"
                defaultValue="workspace-orchestration"
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
              >
                {workflowOptions.map((workflow) => (
                  <option key={workflow} value={workflow}>
                    {workflow}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium">
              실행 메모
              <textarea
                name="summary"
                rows={4}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
                placeholder="이번 실행에서 확인할 기준이나 목표"
              />
            </label>
          </div>
        </form>

        <form onSubmit={createJob} className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">작업 등록</h2>
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">콘텐츠, 배포, 수익화 작업을 승인 가능한 단위로 등록합니다.</p>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
            >
              등록
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              시스템
              <select
                name="system"
                defaultValue="LIFE_HACK"
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
              >
                {dashboard.systems.map((system) => (
                  <option key={system.key} value={system.key}>
                    {system.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              채널
              <input
                name="channel"
                defaultValue="workspace"
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium">
              제목
              <input
                name="title"
                required
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
                placeholder="예: PoReSt 릴리즈 전 최종 점검"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              우선순위
              <input
                name="priority"
                type="number"
                min={1}
                max={5}
                defaultValue={2}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              기한
              <input
                name="dueAt"
                type="date"
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium">
              설명
              <textarea
                name="description"
                rows={3}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#171717]"
              />
            </label>
            <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold">
              <input name="requiresApproval" type="checkbox" className="h-4 w-4 rounded border-black/20" />
              승인 요청도 함께 생성
            </label>
          </div>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-semibold">승인 대기</h2>
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.openDecisions.length === 0 ? (
              <p className="rounded-xl border border-black/10 bg-[#faf9f6] p-4 text-sm text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                처리할 승인 요청이 없습니다.
              </p>
            ) : (
              dashboard.openDecisions.map((decision) => (
                <article key={decision.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-black/45 dark:text-white/45">
                        {getSystemLabel(dashboard.systems, decision.system)} · {formatDate(decision.createdAt)}
                      </p>
                      <h3 className="mt-1 font-semibold">{decision.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-black/60 dark:text-white/60">{decision.description}</p>
                    </div>
                    <SmallStatus status={decision.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => resolveDecision(decision, "APPROVED")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => resolveDecision(decision, "REJECTED")}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50"
                    >
                      반려
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => resolveDecision(decision, "CANCELED")}
                      className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-black/65 disabled:opacity-50 dark:border-white/10 dark:text-white/65"
                    >
                      취소
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-semibold">활성 작업</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-black/[0.04] text-xs uppercase tracking-[0.16em] text-black/45 dark:bg-white/10 dark:text-white/45">
                <tr>
                  <th className="px-4 py-3">System</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.activeJobs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-black/55 dark:text-white/55" colSpan={4}>
                      활성 작업이 없습니다.
                    </td>
                  </tr>
                ) : (
                  dashboard.activeJobs.map((job) => (
                    <tr key={job.id} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-4 py-3">{getSystemLabel(dashboard.systems, job.system)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{job.title}</p>
                        <p className="mt-1 text-xs text-black/45 dark:text-white/45">{job.channel} · P{job.priority}</p>
                      </td>
                      <td className="px-4 py-3">
                        <SmallStatus status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-black/55 dark:text-white/55">{formatDate(job.dueAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-semibold">최근 이벤트</h2>
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.recentEvents.slice(0, 6).map((event) => (
              <article key={event.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-black/45 dark:text-white/45">
                  {getSystemLabel(dashboard.systems, event.system)} · {event.type}
                </p>
                <h3 className="mt-1 font-semibold">{event.title}</h3>
                <p className="mt-2 text-xs text-black/50 dark:text-white/50">{formatDate(event.createdAt)}</p>
              </article>
            ))}
            {dashboard.recentEvents.length === 0 && <p className="text-sm text-black/55 dark:text-white/55">아직 이벤트가 없습니다.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-semibold">리포트</h2>
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.reports.slice(0, 5).map((report) => (
              <article key={report.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-black/45 dark:text-white/45">
                  {getSystemLabel(dashboard.systems, report.system)} · {report.source}
                </p>
                <h3 className="mt-1 font-semibold">{report.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-black/60 dark:text-white/60">{report.bodyMd}</p>
              </article>
            ))}
            {dashboard.reports.length === 0 && <p className="text-sm text-black/55 dark:text-white/55">생성된 리포트가 없습니다.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-semibold">워크플로 이력</h2>
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.recentRuns.map((run) => (
              <article key={run.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-black/45 dark:text-white/45">
                      {getSystemLabel(dashboard.systems, run.system)}
                    </p>
                    <h3 className="mt-1 font-semibold">{run.workflowKey}</h3>
                  </div>
                  <SmallStatus status={run.status} />
                </div>
                <p className="mt-2 text-xs text-black/50 dark:text-white/50">{formatDate(run.createdAt)}</p>
              </article>
            ))}
            {dashboard.recentRuns.length === 0 && <p className="text-sm text-black/55 dark:text-white/55">워크플로 실행 이력이 없습니다.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
