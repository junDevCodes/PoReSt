"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type OwnerBlogPostListItemDto = {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  title: string;
  summary: string | null;
  tags: string[];
  lastLintedAt: string | null;
  updatedAt: string;
};

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "기록 없음";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "기록 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<OwnerBlogPostListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function requestPosts() {
    const response = await fetch("/api/app/blog/posts", { method: "GET" });
    return parseApiResponse<OwnerBlogPostListItemDto[]>(response);
  }

  async function reloadPosts() {
    setIsLoading(true);
    const parsed = await requestPosts();
    if (parsed.error) {
      setError(parsed.error);
      setIsLoading(false);
      return;
    }
    setPosts(parsed.data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      const parsed = await requestPosts();
      if (!mounted) {
        return;
      }
      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }
      setPosts(parsed.data ?? []);
      setIsLoading(false);
    }
    void loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleRunLint(postId: string) {
    setWorkingId(postId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/blog/posts/${postId}/lint`, { method: "POST" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setWorkingId(null);
      return;
    }

    setMessage("Lint를 실행했습니다.");
    setWorkingId(null);
    await reloadPosts();
  }

  async function handleDelete(post: OwnerBlogPostListItemDto) {
    const shouldDelete = confirm(`"${post.title}" 글을 삭제하시겠습니까?`);
    if (!shouldDelete) {
      return;
    }

    setWorkingId(post.id);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/blog/posts/${post.id}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setWorkingId(null);
      return;
    }

    setMessage("글을 삭제했습니다.");
    setWorkingId(null);
    await reloadPosts();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">블로그 글 관리</h1>
          <p className="mt-3 text-sm text-white/65">
            글 작성/편집, Lint 실행, export 다운로드를 한 화면에서 처리합니다.
          </p>
        </div>
        <Link href="/app/blog/new" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
          새 글 작성
        </Link>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">글 목록</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-white/60">글 목록을 불러오는 중입니다.</p>
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">등록된 글이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="mt-1 text-xs text-white/60">
                      상태: {post.status} · 공개범위: {post.visibility} · 수정일: {formatDateLabel(post.updatedAt)} ·
                      최근 Lint: {formatDateLabel(post.lastLintedAt)}
                    </p>
                    <p className="mt-2 text-sm text-white/70">{post.summary ?? "요약 없음"}</p>
                    {post.tags.length > 0 ? (
                      <p className="mt-2 text-xs text-cyan-200">태그: {post.tags.join(", ")}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/app/blog/${post.id}/edit`}
                      className="rounded-lg border border-emerald-400/50 px-3 py-2 text-sm text-emerald-200"
                    >
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleRunLint(post.id)}
                      disabled={workingId === post.id}
                      className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm text-cyan-200 disabled:opacity-60"
                    >
                      {workingId === post.id ? "Lint.." : "Lint"}
                    </button>
                    <a
                      href={`/api/app/blog/posts/${post.id}/export?format=html`}
                      className="rounded-lg border border-white/30 px-3 py-2 text-sm text-white/90"
                    >
                      HTML
                    </a>
                    <a
                      href={`/api/app/blog/posts/${post.id}/export?format=md`}
                      className="rounded-lg border border-white/30 px-3 py-2 text-sm text-white/90"
                    >
                      MD
                    </a>
                    <a
                      href={`/api/app/blog/posts/${post.id}/export?format=zip`}
                      className="rounded-lg border border-white/30 px-3 py-2 text-sm text-white/90"
                    >
                      ZIP
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleDelete(post)}
                      disabled={workingId === post.id}
                      className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm text-rose-200 disabled:opacity-60"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
