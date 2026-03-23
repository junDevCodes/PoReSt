"use client";

import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type AuditLogDto = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metaJson: unknown;
  createdAt: string;
};

type AuditMeta = {
  nextCursor: string | null;
  hasNext: boolean;
  limit: number;
};

type AuditResponse = {
  items: AuditLogDto[];
  meta: AuditMeta;
};

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

function stringifyMeta(meta: unknown): string {
  if (meta === null || meta === undefined) {
    return "-";
  }
  try {
    return JSON.stringify(meta);
  } catch {
    return "-";
  }
}

type AuditPageClientProps = {
  initialLogs: AuditLogDto[];
  initialNextCursor: string | null;
  initialHasNext: boolean;
};

export function AuditPageClient({ initialLogs, initialNextCursor, initialHasNext }: AuditPageClientProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoadMore() {
    if (!nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    const search = new URLSearchParams({ limit: "20", cursor: nextCursor });
    const response = await fetch(`/api/app/audit?${search.toString()}`, { method: "GET" });
    const parsed = await parseApiResponse<AuditResponse>(response);

    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "추가 로그를 불러오지 못했습니다.");
      setIsLoadingMore(false);
      return;
    }

    setLogs((prev) => [...prev, ...(parsed.data?.items ?? [])]);
    setNextCursor(parsed.data.meta?.nextCursor ?? null);
    setHasNext(parsed.data.meta?.hasNext ?? false);
    setIsLoadingMore(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-black/60">관리</p>
        <h1 className="mt-2 text-3xl font-semibold">Audit Log</h1>
        <p className="mt-3 text-sm text-black/65">최근 액션 이력을 시간순으로 확인합니다.</p>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        {logs.length === 0 ? (
          <p className="text-sm text-black/60">표시할 로그가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <article key={log.id} className="rounded-lg border border-black/10 bg-[#faf9f6] p-3">
                <p className="text-xs text-black/60">{formatDateTime(log.createdAt)}</p>
                <p className="mt-1 text-sm font-semibold text-black">
                  {log.action} / {log.entityType}
                </p>
                <p className="mt-1 text-xs text-black/70">entityId: {log.entityId}</p>
                <p className="mt-1 break-all text-[11px] text-black/55">
                  meta: {stringifyMeta(log.metaJson)}
                </p>
              </article>
            ))}
          </div>
        )}

        {hasNext ? (
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={isLoadingMore}
            className="mt-4 rounded-lg border border-black/20 px-3 py-2 text-sm text-black/85 disabled:opacity-60"
          >
            {isLoadingMore ? "불러오는 중..." : "더 보기"}
          </button>
        ) : null}
      </section>
    </main>
  );
}
