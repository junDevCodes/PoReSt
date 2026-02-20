"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/useToast";

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
  const [pendingDeletePost, setPendingDeletePost] = useState<OwnerBlogPostListItemDto | null>(null);
  const toast = useToast();

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

    const response = await fetch(`/api/app/blog/posts/${postId}/lint`, { method: "POST" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setWorkingId(null);
      return;
    }

    toast.success("Lint를 실행했습니다.");
    setWorkingId(null);
    await reloadPosts();
  }

  async function handleDeleteConfirmed() {
    if (!pendingDeletePost) {
      return;
    }

    setWorkingId(pendingDeletePost.id);
    setError(null);

    const response = await fetch(`/api/app/blog/posts/${pendingDeletePost.id}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setWorkingId(null);
      return;
    }

    toast.success("글을 삭제했습니다.");
    setWorkingId(null);
    setPendingDeletePost(null);
    await reloadPosts();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">블로그 글 관리</h1>
          <p className="mt-3 text-sm text-black/65">
            글 작성/편집, Lint 실행, export 다운로드를 한 화면에서 처리합니다.
          </p>
        </div>
        <Link href="/app/blog/new" className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">
          새 글 작성
        </Link>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">글 목록</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-black/60">글 목록을 불러오는 중입니다.</p>
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-black/60">등록된 글이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="mt-1 text-xs text-black/60">
                      상태: {post.status} · 공개범위: {post.visibility} · 수정일: {formatDateLabel(post.updatedAt)} ·
                      최근 Lint: {formatDateLabel(post.lastLintedAt)}
                    </p>
                    <p className="mt-2 text-sm text-black/70">{post.summary ?? "요약 없음"}</p>
                    {post.tags.length > 0 ? (
                      <p className="mt-2 text-xs text-cyan-700">태그: {post.tags.join(", ")}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/app/blog/${post.id}/edit`}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800"
                    >
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleRunLint(post.id)}
                      disabled={workingId === post.id}
                      className="rounded-lg border border-cyan-300 px-3 py-2 text-sm text-cyan-800 disabled:opacity-60"
                    >
                      {workingId === post.id ? "Lint 실행 중..." : "Lint 실행"}
                    </button>
                    <a
                      href={`/api/app/blog/posts/${post.id}/export?format=html`}
                      className="rounded-lg border border-black/20 px-3 py-2 text-sm text-black/85"
                    >
                      HTML
                    </a>
                    <a
                      href={`/api/app/blog/posts/${post.id}/export?format=md`}
                      className="rounded-lg border border-black/20 px-3 py-2 text-sm text-black/85"
                    >
                      MD
                    </a>
                    <a
                      href={`/api/app/blog/posts/${post.id}/export?format=zip`}
                      className="rounded-lg border border-black/20 px-3 py-2 text-sm text-black/85"
                    >
                      ZIP
                    </a>
                    <button
                      type="button"
                      onClick={() => setPendingDeletePost(post)}
                      disabled={workingId === post.id}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800 disabled:opacity-60"
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

      <ConfirmDialog
        open={Boolean(pendingDeletePost)}
        title="글을 삭제할까요?"
        description={
          pendingDeletePost
            ? `"${pendingDeletePost.title}" 글을 삭제하면 복구할 수 없습니다.`
            : "글을 삭제합니다."
        }
        confirmText="삭제"
        cancelText="취소"
        isDanger
        isLoading={Boolean(workingId)}
        onCancel={() => {
          if (!workingId) {
            setPendingDeletePost(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
      />
    </div>
  );
}
