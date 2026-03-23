"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type {
  SerializedOwnerFeedbackItemDto,
  SerializedOwnerFeedbackRequestDetailDto,
  SerializedOwnerFeedbackRequestListItemDto,
} from "@/app/(private)/app/_lib/server-serializers";

type FeedbackCompareResultDto = {
  currentRequestId: string;
  previousRequestId: string;
  added: SerializedOwnerFeedbackItemDto[];
  resolved: SerializedOwnerFeedbackItemDto[];
  unchanged: SerializedOwnerFeedbackItemDto[];
  summary: {
    added: number;
    resolved: number;
    unchanged: number;
  };
};

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

function severityClassName(severity: string): string {
  if (severity === "CRITICAL") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (severity === "WARNING") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-cyan-200 bg-cyan-50 text-cyan-800";
}

type FeedbackDetailPageClientProps = {
  initialDetail: SerializedOwnerFeedbackRequestDetailDto;
  initialRequestList: SerializedOwnerFeedbackRequestListItemDto[];
};

export function FeedbackDetailPageClient({
  initialDetail,
  initialRequestList,
}: FeedbackDetailPageClientProps) {
  const [detail, setDetail] = useState<SerializedOwnerFeedbackRequestDetailDto | null>(initialDetail);
  const [requestList] = useState(initialRequestList);
  const [compareTo, setCompareTo] = useState("");
  const [compareResult, setCompareResult] = useState<FeedbackCompareResultDto | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const compareCandidates = useMemo(() => {
    if (!detail) {
      return [];
    }
    return requestList.filter(
      (item) => item.id !== detail.id && item.targetType === detail.targetType,
    );
  }, [detail, requestList]);

  async function handleRun() {
    if (!detail) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/feedback/${detail.id}/run`, { method: "POST" });
    const parsed = await parseApiResponse<SerializedOwnerFeedbackRequestDetailDto>(response);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "피드백 실행에 실패했습니다.");
      setIsRunning(false);
      return;
    }

    setDetail(parsed.data);
    setMessage("피드백 실행이 완료되었습니다.");
    setIsRunning(false);
  }

  async function handleCompare() {
    if (!detail || !compareTo) {
      return;
    }

    setIsComparing(true);
    setError(null);
    setMessage(null);

    const response = await fetch(
      `/api/app/feedback/compare?currentRequestId=${encodeURIComponent(detail.id)}&previousRequestId=${encodeURIComponent(compareTo)}`,
      { method: "GET" },
    );
    const parsed = await parseApiResponse<FeedbackCompareResultDto>(response);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "피드백 비교에 실패했습니다.");
      setIsComparing(false);
      return;
    }

    setCompareResult(parsed.data);
    setMessage("피드백 비교가 완료되었습니다.");
    setIsComparing(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">피드백 요청 상세</h1>
          <p className="mt-3 text-sm text-black/60">
            요청 실행 결과를 확인하고 이전 실행과 비교할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/feedback"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
          >
            목록으로
          </Link>
          <button
            type="button"
            onClick={() => void handleRun()}
            disabled={isRunning || !detail}
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isRunning ? "실행 중..." : "피드백 실행"}
          </button>
        </div>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        {!detail ? (
          <p className="text-sm text-black/60">피드백 요청 정보를 불러오는 중입니다.</p>
        ) : (
          <div className="grid gap-2 text-sm text-black/70">
            <p>
              <span className="text-black/60">요청 ID:</span> {detail.id}
            </p>
            <p>
              <span className="text-black/60">대상:</span> {detail.targetType} / {detail.targetId}
            </p>
            <p>
              <span className="text-black/60">상태:</span> {detail.status}
            </p>
            <p>
              <span className="text-black/60">생성일:</span> {formatDateLabel(detail.createdAt)} ·{" "}
              <span className="text-black/60">수정일:</span> {formatDateLabel(detail.updatedAt)}
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <h2 className="text-lg font-semibold">피드백 결과 항목</h2>
        {!detail || detail.items.length === 0 ? (
          <p className="mt-4 text-sm text-black/60">아직 생성된 피드백 항목이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {detail.items.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border p-4 ${severityClassName(item.severity)}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{item.severity}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm">{item.message}</p>
                {item.suggestion ? (
                  <p className="mt-2 text-sm opacity-80">제안: {item.suggestion}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <h2 className="text-lg font-semibold">이전 실행과 비교</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={compareTo}
            onChange={(event) => setCompareTo(event.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">비교할 이전 요청 선택</option>
            {compareCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.id.slice(0, 8)}... · {candidate.status} ·{" "}
                {formatDateLabel(candidate.createdAt)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleCompare()}
            disabled={!compareTo || isComparing || !detail}
            className="rounded-lg border border-cyan-600/30 px-3 py-2 text-sm text-cyan-800 disabled:opacity-60"
          >
            {isComparing ? "비교 중..." : "비교 실행"}
          </button>
        </div>

        {compareResult ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-black/70">
              추가: {compareResult.summary.added} · 해결: {compareResult.summary.resolved} · 유지:{" "}
              {compareResult.summary.unchanged}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-semibold text-emerald-800">추가된 항목</p>
                {compareResult.added.length === 0 ? (
                  <p className="mt-2 text-xs text-emerald-700">없음</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-emerald-800">
                    {compareResult.added.map((item) => (
                      <li key={item.id}>{item.title}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="font-semibold text-amber-800">해결된 항목</p>
                {compareResult.resolved.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-700">없음</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-amber-800">
                    {compareResult.resolved.map((item) => (
                      <li key={item.id}>{item.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
