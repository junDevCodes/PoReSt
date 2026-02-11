"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type ResumeStatus = "DRAFT" | "SUBMITTED" | "ARCHIVED";

type OwnerResumeDetailDto = {
  id: string;
};

const DEFAULT_FORM = {
  title: "",
  targetCompany: "",
  targetRole: "",
  level: "",
  summaryMd: "",
  status: "DRAFT" as ResumeStatus,
};

export default function NewResumePage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/app/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        targetCompany: form.targetCompany || null,
        targetRole: form.targetRole || null,
        level: form.level || null,
        summaryMd: form.summaryMd || null,
        status: form.status,
      }),
    });
    const parsed = await parseApiResponse<OwnerResumeDetailDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setIsSubmitting(false);
      return;
    }

    const createdId = parsed.data?.id;
    setIsSubmitting(false);
    if (createdId) {
      router.push(`/app/resumes/${createdId}/edit`);
      return;
    }

    router.push("/app/resumes");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">이력서 생성</h1>
          <p className="mt-3 text-sm text-white/65">
            회사/직무 컨텍스트를 포함한 이력서 버전을 생성합니다.
          </p>
        </div>
        <Link href="/app/resumes" className="rounded-full border border-white/30 px-4 py-2 text-sm">
          목록으로
        </Link>
      </header>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span>제목</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="예: A사 백엔드 지원 v1"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span>회사명</span>
              <input
                value={form.targetCompany}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, targetCompany: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                placeholder="지원 회사"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span>직무</span>
              <input
                value={form.targetRole}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, targetRole: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                placeholder="지원 직무"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span>레벨</span>
              <input
                value={form.level}
                onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                placeholder="junior / mid / senior"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span>상태</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as ResumeStatus }))
              }
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>요약(Markdown)</span>
            <textarea
              value={form.summaryMd}
              onChange={(event) => setForm((prev) => ({ ...prev, summaryMd: event.target.value }))}
              className="min-h-52 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="지원 포지션에 맞춘 요약을 입력하세요."
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-fit rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {isSubmitting ? "생성 중..." : "이력서 생성"}
          </button>
        </form>
      </section>
    </main>
  );
}
