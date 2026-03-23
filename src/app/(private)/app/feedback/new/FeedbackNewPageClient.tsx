"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedFeedbackTargetDto } from "@/app/(private)/app/_lib/server-serializers";

type FeedbackTargetType = "PORTFOLIO" | "RESUME" | "NOTE" | "BLOG";

type ClientFeedbackTargetDto = {
  id: string;
  type: FeedbackTargetType;
  title: string;
  updatedAt: string;
};

type OwnerFeedbackRequestDetailDto = {
  id: string;
};

type FeedbackCreateFormState = {
  targetType: FeedbackTargetType;
  targetId: string;
  contextJson: string;
  optionsJson: string;
};

function parseOptionalJson(value: string): unknown | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return JSON.parse(trimmed) as unknown;
}

type FeedbackNewPageClientProps = {
  initialTargets: SerializedFeedbackTargetDto[];
  initialTargetType: FeedbackTargetType;
};

export function FeedbackNewPageClient({
  initialTargets,
  initialTargetType,
}: FeedbackNewPageClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<FeedbackCreateFormState>({
    targetType: initialTargetType,
    targetId: initialTargets.length > 0 ? initialTargets[0].id : "",
    contextJson: "",
    optionsJson: "",
  });
  const [targets, setTargets] = useState<ClientFeedbackTargetDto[]>(initialTargets);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTargets(targetType: FeedbackTargetType) {
    setIsLoadingTargets(true);
    const response = await fetch(`/api/app/feedback/targets?type=${targetType}`, { method: "GET" });
    const parsed = await parseApiResponse<ClientFeedbackTargetDto[]>(response);

    if (parsed.error) {
      setError(parsed.error);
      setTargets([]);
      setIsLoadingTargets(false);
      return;
    }

    const nextTargets = parsed.data ?? [];
    setTargets(nextTargets);
    setForm((prev) => ({
      ...prev,
      targetId:
        nextTargets.length === 0
          ? ""
          : nextTargets.some((target) => target.id === prev.targetId)
            ? prev.targetId
            : nextTargets[0].id,
    }));
    setIsLoadingTargets(false);
  }

  function handleTargetTypeChange(newType: FeedbackTargetType) {
    setForm((prev) => ({
      ...prev,
      targetType: newType,
      targetId: "",
    }));
    void loadTargets(newType);
  }

  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === form.targetId) ?? null,
    [targets, form.targetId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.targetId) {
      setError("선택 가능한 대상이 없습니다. 먼저 항목을 생성해주세요.");
      return;
    }

    let contextJson: unknown;
    let optionsJson: unknown;

    try {
      contextJson = parseOptionalJson(form.contextJson);
      optionsJson = parseOptionalJson(form.optionsJson);
    } catch {
      setError("contextJson 또는 optionsJson은 올바른 JSON 형식이어야 합니다.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/app/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetType: form.targetType,
        targetId: form.targetId,
        contextJson,
        optionsJson,
      }),
    });

    const parsed = await parseApiResponse<OwnerFeedbackRequestDetailDto>(response);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "피드백 요청 생성에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/app/feedback/${parsed.data.id}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">피드백 요청 생성</h1>
          <p className="mt-3 text-sm text-black/60">
            대상 타입을 고르면 연결 가능한 항목 목록이 자동으로 로딩됩니다.
          </p>
        </div>
        <Link
          href="/app/feedback"
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
        >
          목록으로
        </Link>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span>대상 타입</span>
            <select
              value={form.targetType}
              onChange={(event) =>
                handleTargetTypeChange(event.target.value as FeedbackTargetType)
              }
              className="rounded-lg border border-black/15 bg-white px-3 py-2"
            >
              <option value="PORTFOLIO">PORTFOLIO</option>
              <option value="RESUME">RESUME</option>
              <option value="NOTE">NOTE</option>
              <option value="BLOG">BLOG</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>대상 선택</span>
            <select
              value={form.targetId}
              onChange={(event) => setForm((prev) => ({ ...prev, targetId: event.target.value }))}
              className="rounded-lg border border-black/15 bg-white px-3 py-2"
              disabled={isLoadingTargets || targets.length === 0}
            >
              {targets.length === 0 ? (
                <option value="">
                  {isLoadingTargets ? "대상 목록을 불러오는 중..." : "선택 가능한 대상이 없습니다."}
                </option>
              ) : null}
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-black/60">
              {selectedTarget
                ? `선택된 대상 ID: ${selectedTarget.id}`
                : "선택 가능한 대상이 없으면 해당 타입의 데이터를 먼저 생성해주세요."}
            </p>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>contextJson (선택)</span>
            <textarea
              value={form.contextJson}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, contextJson: event.target.value }))
              }
              className="min-h-32 rounded-lg border border-black/15 bg-white px-3 py-2"
              placeholder='예: {"company":"Acme","role":"Backend Engineer"}'
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>optionsJson (선택)</span>
            <textarea
              value={form.optionsJson}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, optionsJson: event.target.value }))
              }
              className="min-h-24 rounded-lg border border-black/15 bg-white px-3 py-2"
              placeholder='예: {"strict":true}'
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingTargets || !form.targetId}
            className="mt-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "생성 중..." : "요청 생성"}
          </button>
        </form>
      </section>
    </main>
  );
}
