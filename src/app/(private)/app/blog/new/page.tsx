"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type OwnerBlogPostDetailDto = {
  id: string;
};

type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Visibility = "PRIVATE" | "UNLISTED" | "PUBLIC";

const DEFAULT_FORM = {
  title: "",
  contentMd: "",
  summary: "",
  tags: "",
  status: "DRAFT" as PostStatus,
  visibility: "PRIVATE" as Visibility,
};

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export default function BlogNewPage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/app/blog/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        contentMd: form.contentMd,
        summary: form.summary || null,
        tags: parseTags(form.tags),
        status: form.status,
        visibility: form.visibility,
      }),
    });
    const parsed = await parseApiResponse<OwnerBlogPostDetailDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setIsSubmitting(false);
      return;
    }

    const createdId = parsed.data?.id;
    setIsSubmitting(false);
    if (createdId) {
      router.push(`/app/blog/${createdId}/edit`);
      return;
    }
    router.push("/app/blog");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">블로그 글 작성</h1>
          <p className="mt-3 text-sm text-white/65">Markdown 본문과 공개 상태를 입력해 새 글을 생성합니다.</p>
        </div>
        <Link href="/app/blog" className="rounded-full border border-white/30 px-4 py-2 text-sm">
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
              placeholder="블로그 제목"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span>상태</span>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PostStatus }))}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span>공개 범위</span>
              <select
                value={form.visibility}
                onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value as Visibility }))}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              >
                <option value="PRIVATE">PRIVATE</option>
                <option value="UNLISTED">UNLISTED</option>
                <option value="PUBLIC">PUBLIC</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span>요약</span>
            <textarea
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              className="min-h-24 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="요약 문장"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>태그 (콤마 구분)</span>
            <input
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="nextjs, prisma, lint"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>본문 (Markdown)</span>
            <textarea
              value={form.contentMd}
              onChange={(event) => setForm((prev) => ({ ...prev, contentMd: event.target.value }))}
              className="min-h-80 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              placeholder="# 문제\n\n문제를 설명합니다."
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
            {isSubmitting ? "생성 중.." : "글 생성"}
          </button>
        </form>
      </section>
    </main>
  );
}
