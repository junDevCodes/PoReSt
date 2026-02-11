"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type OwnerFeedbackRequestListItemDto = {
  id: string;
  targetType: "PORTFOLIO" | "RESUME" | "NOTE" | "BLOG";
  targetId: string;
  status: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

export default function FeedbackListPage() {
  const [requests, setRequests] = useState<OwnerFeedbackRequestListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadRequests() {
      const response = await fetch("/api/app/feedback", { method: "GET" });
      const parsed = await parseApiResponse<OwnerFeedbackRequestListItemDto[]>(response);

      if (!mounted) {
        return;
      }

      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }

      setRequests(parsed.data ?? []);
      setIsLoading(false);
    }

    void loadRequests();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">피드백 요청 관리</h1>
          <p className="mt-3 text-sm text-white/65">
            이력서/포트폴리오/노트/블로그 대상 피드백 요청을 생성하고 실행 결과를 확인합니다.
          </p>
        </div>
        <Link href="/app/feedback/new" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
          새 요청 만들기
        </Link>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">요청 목록</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-white/60">피드백 요청을 불러오는 중입니다.</p>
        ) : requests.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">생성된 피드백 요청이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {request.targetType} 대상 피드백
                    </h3>
                    <p className="mt-1 text-xs text-white/60">
                      요청 상태: {request.status} · 항목 수: {request.itemCount}
                    </p>
                    <p className="mt-1 text-xs text-white/55">
                      targetId: {request.targetId}
                    </p>
                    <p className="mt-1 text-xs text-white/55">
                      생성일: {formatDateLabel(request.createdAt)} · 수정일: {formatDateLabel(request.updatedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/app/feedback/${request.id}`}
                    className="rounded-lg border border-emerald-400/50 px-3 py-2 text-sm text-emerald-200"
                  >
                    상세 보기
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
