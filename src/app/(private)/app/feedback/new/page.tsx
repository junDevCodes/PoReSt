"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type FeedbackTargetType = "PORTFOLIO" | "RESUME" | "NOTE" | "BLOG";

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

export default function FeedbackNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<FeedbackCreateFormState>({
    targetType: "RESUME",
    targetId: "",
    contextJson: "",
    optionsJson: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let contextJson: unknown;
    let optionsJson: unknown;

    try {
      contextJson = parseOptionalJson(form.contextJson);
      optionsJson = parseOptionalJson(form.optionsJson);
    } catch {
      setError("contextJson 또는 optionsJson이 올바른 JSON 형식이 아닙니다.");
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
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">피드백 요청 생성</h1>
          <p className="mt-3 text-sm text-white/65">
            점검 대상 타입과 ID를 선택해 피드백 실행 요청을 생성합니다.
          </p>
        </div>
        <Link href="/app/feedback" className="rounded-full border border-white/30 px-4 py-2 text-sm text-white/90">
          목록으로
        </Link>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span>대상 타입</span>
            <select
              value={form.targetType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetType: event.target.value as FeedbackTargetType }))
              }
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            >
              <option value="PORTFOLIO">PORTFOLIO</option>
              <option value="RESUME">RESUME</option>
              <option value="NOTE">NOTE</option>
              <option value="BLOG">BLOG</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>대상 ID (targetId)</span>
            <input
              value={form.targetId}
              onChange={(event) => setForm((prev) => ({ ...prev, targetId: event.target.value }))}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="예: resume id, note id, blog post id"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>contextJson (선택)</span>
            <textarea
              value={form.contextJson}
              onChange={(event) => setForm((prev) => ({ ...prev, contextJson: event.target.value }))}
              className="min-h-32 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder='예: {"company":"Acme","role":"Backend Engineer"}'
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>optionsJson (선택)</span>
            <textarea
              value={form.optionsJson}
              onChange={(event) => setForm((prev) => ({ ...prev, optionsJson: event.target.value }))}
              className="min-h-24 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder='예: {"strict":true}'
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {isSubmitting ? "생성 중..." : "요청 생성"}
          </button>
        </form>
      </section>
    </main>
  );
}
