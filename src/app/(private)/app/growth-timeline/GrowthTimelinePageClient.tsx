"use client";

import { useState, useCallback } from "react";
import type {
  DailyActivityCount,
  TypeDistribution,
  MonthlySummary,
} from "@/modules/growth-timeline/interface";
import { GROWTH_EVENT_LABELS } from "@/modules/growth-timeline/interface";

type SerializedEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entityId: string | null;
  occurredAt: string;
  createdAt: string;
};

type SerializedTimeline = {
  totalEvents: number;
  recentEvents: SerializedEvent[];
  heatmap: DailyActivityCount[];
  typeDistribution: TypeDistribution[];
  monthlySummary: MonthlySummary[];
};

const EVENT_TYPE_OPTIONS = Object.entries(GROWTH_EVENT_LABELS).map(
  ([value, label]) => ({ value, label }),
);

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getHeatmapColor(count: number): string {
  if (count === 0) return "bg-black/[0.04]";
  if (count === 1) return "bg-emerald-200";
  if (count === 2) return "bg-emerald-300";
  if (count <= 4) return "bg-emerald-400";
  return "bg-emerald-600";
}

// ─────────────────────────────────────────────
// 히트맵 (최근 365일)
// ─────────────────────────────────────────────

function ActivityHeatmap({ heatmap }: { heatmap: DailyActivityCount[] }) {
  // 최근 52주(364일) 표시
  const recent = heatmap.slice(-364);
  // 주 단위 그룹핑 (일~토)
  const weeks: DailyActivityCount[][] = [];
  let currentWeek: DailyActivityCount[] = [];

  // 첫 날의 요일 기준으로 빈 셀 채우기
  if (recent.length > 0) {
    const firstDay = new Date(recent[0].date).getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: "", count: -1 });
    }
  }

  for (const day of recent) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const totalActive = recent.filter((d) => d.count > 0).length;
  const totalEvents = recent.reduce((sum, d) => sum + Math.max(d.count, 0), 0);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">활동 히트맵</h2>
          <p className="mt-1 text-xs text-black/55">
            최근 1년간 {totalEvents}개 이벤트 / {totalActive}일 활동
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-black/45">
          <span>적음</span>
          <div className="h-3 w-3 rounded-sm bg-black/[0.04]" />
          <div className="h-3 w-3 rounded-sm bg-emerald-200" />
          <div className="h-3 w-3 rounded-sm bg-emerald-300" />
          <div className="h-3 w-3 rounded-sm bg-emerald-400" />
          <div className="h-3 w-3 rounded-sm bg-emerald-600" />
          <span>많음</span>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="flex gap-[2px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={`group relative h-3 w-3 rounded-sm ${day.count < 0 ? "bg-transparent" : getHeatmapColor(day.count)}`}
                  title={
                    day.date
                      ? `${day.date}: ${day.count}개 이벤트`
                      : undefined
                  }
                >
                  {day.date && day.count > 0 && (
                    <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
                      {day.date}: {day.count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// 월별 바 차트
// ─────────────────────────────────────────────

function MonthlyChart({ monthlySummary }: { monthlySummary: MonthlySummary[] }) {
  const maxCount = Math.max(...monthlySummary.map((m) => m.count), 1);
  const recent = monthlySummary.slice(-12);

  if (recent.length === 0) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">월별 활동</h2>
        <p className="mt-4 text-sm text-black/55">아직 활동 데이터가 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold">월별 활동</h2>
      <div className="mt-6 flex items-end gap-2" style={{ height: 140 }}>
        {recent.map((m) => {
          const heightPercent = (m.count / maxCount) * 100;
          return (
            <div
              key={m.month}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t bg-emerald-500/80 transition-colors group-hover:bg-emerald-600"
                style={{
                  height: `${Math.max(heightPercent, m.count > 0 ? 4 : 0)}%`,
                  minHeight: m.count > 0 ? 4 : 0,
                }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
                {m.month}: {m.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-black/40">
        {recent.length > 0 && (
          <>
            <span>{recent[0].month}</span>
            <span>{recent[recent.length - 1].month}</span>
          </>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// 타입 분포
// ─────────────────────────────────────────────

function TypeBreakdown({
  distribution,
}: {
  distribution: TypeDistribution[];
}) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">이벤트 분포</h2>
        <p className="mt-4 text-sm text-black/55">아직 이벤트가 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold">이벤트 분포</h2>
      <div className="mt-4 space-y-3">
        {distribution.map((item) => {
          const percent = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.type}>
              <div className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-medium">
                  {item.count} ({percent.toFixed(1)}%)
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// 이벤트 타임라인
// ─────────────────────────────────────────────

function EventTimeline({
  events,
  onDelete,
}: {
  events: SerializedEvent[];
  onDelete: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? events : events.slice(0, 15);

  if (events.length === 0) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">성장 타임라인</h2>
        <p className="mt-4 text-sm text-black/55">
          아직 이벤트가 없습니다. &quot;자동 수집&quot; 버튼을 눌러 기존 데이터에서
          이벤트를 생성하세요.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold">
        성장 타임라인 ({events.length}개)
      </h2>
      <div className="mt-4 space-y-0">
        {displayed.map((event, index) => {
          const typeLabel =
            GROWTH_EVENT_LABELS[
              event.type as keyof typeof GROWTH_EVENT_LABELS
            ] ?? event.type;
          return (
            <div
              key={event.id}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* 타임라인 선 */}
              {index < displayed.length - 1 && (
                <div className="absolute left-[11px] top-6 h-full w-px bg-black/10" />
              )}
              {/* 점 */}
              <div className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-emerald-400 bg-white" />
              {/* 콘텐츠 */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
                        {typeLabel}
                      </span>
                      <span className="text-xs text-black/45">
                        {formatDate(event.occurredAt)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-1 text-xs text-black/60">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="shrink-0 rounded p-1 text-xs text-black/30 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="삭제"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {events.length > 15 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm font-medium text-black/70 hover:text-black"
        >
          전체 {events.length}건 보기
        </button>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// 이벤트 추가 모달
// ─────────────────────────────────────────────

function AddEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState("CUSTOM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/app/growth-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description: description || null,
          occurredAt: new Date(occurredAt).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "이벤트 추가에 실패했습니다.");
        return;
      }

      onCreated();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">이벤트 추가</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">유형</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              placeholder="예: AWS SAA 자격증 취득"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="이벤트에 대한 부가 설명"
              className="w-full resize-none rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">발생일</label>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-black/60 hover:bg-black/5"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 요약 카드
// ─────────────────────────────────────────────

function SummaryCards({
  totalEvents,
  recentCount,
  typeCount,
  monthCount,
}: {
  totalEvents: number;
  recentCount: number;
  typeCount: number;
  monthCount: number;
}) {
  const items = [
    { label: "전체 이벤트", value: totalEvents },
    { label: "최근 표시", value: recentCount },
    { label: "이벤트 유형", value: typeCount },
    { label: "활동 월수", value: monthCount },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-black/10 bg-white p-5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">
            {item.label}
          </p>
          <p className="mt-3 text-3xl font-semibold">{item.value}</p>
        </article>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export function GrowthTimelinePageClient({
  timeline: initialTimeline,
}: {
  timeline: SerializedTimeline;
}) {
  const [timeline, setTimeline] = useState(initialTimeline);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const refreshTimeline = useCallback(async () => {
    try {
      const res = await fetch("/api/app/growth-timeline");
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.data);
      }
    } catch {
      // 무시
    }
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/app/growth-timeline/sync", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        const { created, skipped } = data.data;
        setSyncMessage(`${created}개 생성, ${skipped}개 건너뜀`);
        await refreshTimeline();
      } else {
        setSyncMessage("동기화에 실패했습니다.");
      }
    } catch {
      setSyncMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/app/growth-timeline/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshTimeline();
      }
    } catch {
      // 무시
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* 헤더 */}
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">
          Growth Timeline
        </p>
        <h1 className="mt-3 text-3xl font-semibold">성장 타임라인</h1>
        <p className="mt-2 text-sm text-black/65">
          기술 추가, 프로젝트 생성, 경력 변경 등 성장 이벤트를 추적합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/85"
          >
            이벤트 추가
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 disabled:opacity-50"
          >
            {syncing ? "동기화 중..." : "자동 수집"}
          </button>
          {syncMessage && (
            <span className="flex items-center text-sm text-emerald-600">
              {syncMessage}
            </span>
          )}
        </div>
      </section>

      {/* 요약 카드 */}
      <SummaryCards
        totalEvents={timeline.totalEvents}
        recentCount={timeline.recentEvents.length}
        typeCount={timeline.typeDistribution.length}
        monthCount={timeline.monthlySummary.length}
      />

      {/* 히트맵 */}
      <ActivityHeatmap heatmap={timeline.heatmap} />

      {/* 차트 영역 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyChart monthlySummary={timeline.monthlySummary} />
        <TypeBreakdown distribution={timeline.typeDistribution} />
      </div>

      {/* 타임라인 */}
      <EventTimeline
        events={timeline.recentEvents}
        onDelete={handleDelete}
      />

      {/* 모달 */}
      {showAddModal && (
        <AddEventModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            refreshTimeline();
          }}
        />
      )}
    </div>
  );
}
