"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Visibility = "PRIVATE" | "UNLISTED" | "PUBLIC";

type BlogLintIssue = {
  ruleId: string;
  severity: "WARNING";
  message: string;
  line: number;
  excerpt: string;
};

type OwnerBlogPostDetailDto = {
  id: string;
  ownerId: string;
  status: PostStatus;
  visibility: Visibility;
  title: string;
  contentMd: string;
  summary: string | null;
  tags: string[];
  lintReportJson: unknown;
  lastLintedAt: string | null;
  updatedAt: string;
};

type BlogFormState = {
  title: string;
  contentMd: string;
  summary: string;
  tags: string;
  status: PostStatus;
  visibility: Visibility;
};

function toFormState(post: OwnerBlogPostDetailDto): BlogFormState {
  return {
    title: post.title,
    contentMd: post.contentMd,
    summary: post.summary ?? "",
    tags: post.tags.join(", "),
    status: post.status,
    visibility: post.visibility,
  };
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function parseLintIssues(report: unknown): BlogLintIssue[] {
  if (!report || typeof report !== "object") {
    return [];
  }

  const value = report as { issues?: unknown };
  if (!Array.isArray(value.issues)) {
    return [];
  }

  return value.issues.filter((issue): issue is BlogLintIssue => {
    if (!issue || typeof issue !== "object") {
      return false;
    }
    const candidate = issue as Record<string, unknown>;
    return (
      typeof candidate.ruleId === "string" &&
      typeof candidate.message === "string" &&
      typeof candidate.line === "number" &&
      typeof candidate.excerpt === "string"
    );
  });
}

export default function BlogEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<OwnerBlogPostDetailDto | null>(null);
  const [form, setForm] = useState<BlogFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningLint, setIsRunningLint] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const postId = typeof params?.id === "string" ? params.id : "";
  const lintIssues = useMemo(() => parseLintIssues(post?.lintReportJson), [post?.lintReportJson]);

  async function requestPost(id: string) {
    const response = await fetch(`/api/app/blog/posts/${id}`, { method: "GET" });
    return parseApiResponse<OwnerBlogPostDetailDto>(response);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      if (!postId) {
        setError("글 식별자가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      const parsed = await requestPost(postId);
      if (!mounted) {
        return;
      }

      if (parsed.error || !parsed.data) {
        setError(parsed.error ?? "글 정보를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      setPost(parsed.data);
      setForm(toFormState(parsed.data));
      setIsLoading(false);
    }

    void loadInitial();
    return () => {
      mounted = false;
    };
  }, [postId]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!post || !form) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/blog/posts/${post.id}`, {
      method: "PUT",
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
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "글 저장에 실패했습니다.");
      setIsSaving(false);
      return;
    }

    setPost(parsed.data);
    setForm(toFormState(parsed.data));
    setMessage("글을 저장했습니다.");
    setIsSaving(false);
  }

  async function handleRunLint() {
    if (!post) {
      return;
    }
    setIsRunningLint(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/blog/posts/${post.id}/lint`, { method: "POST" });
    const parsed = await parseApiResponse<OwnerBlogPostDetailDto>(response);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "Lint 실행에 실패했습니다.");
      setIsRunningLint(false);
      return;
    }

    setPost(parsed.data);
    setMessage("Lint 실행을 완료했습니다.");
    setIsRunningLint(false);
  }

  async function handleDelete() {
    if (!post) {
      return;
    }
    const shouldDelete = confirm(`"${post.title}" 글을 삭제하시겠습니까?`);
    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/blog/posts/${post.id}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    router.push("/app/blog");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">블로그 글 편집</h1>
          <p className="mt-3 text-sm text-white/65">본문 수정, Lint 검사, export 다운로드를 수행합니다.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/blog" className="rounded-full border border-white/30 px-4 py-2 text-sm">
            목록으로
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting || isLoading}
            className="rounded-full border border-rose-400/50 px-4 py-2 text-sm text-rose-200 disabled:opacity-60"
          >
            {isDeleting ? "삭제 중.." : "글 삭제"}
          </button>
        </div>
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
        {isLoading || !form ? (
          <p className="text-sm text-white/60">글 정보를 불러오는 중입니다.</p>
        ) : (
          <form onSubmit={handleSave} className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span>제목</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span>상태</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, status: event.target.value as PostStatus } : prev))
                  }
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
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, visibility: event.target.value as Visibility } : prev))
                  }
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
                onChange={(event) => setForm((prev) => (prev ? { ...prev, summary: event.target.value } : prev))}
                className="min-h-24 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>태그 (콤마 구분)</span>
              <input
                value={form.tags}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, tags: event.target.value } : prev))}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>본문 (Markdown)</span>
              <textarea
                value={form.contentMd}
                onChange={(event) =>
                  setForm((prev) => (prev ? { ...prev, contentMd: event.target.value } : prev))
                }
                className="min-h-96 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
              >
                {isSaving ? "저장 중.." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => void handleRunLint()}
                disabled={isRunningLint}
                className="rounded-full border border-cyan-400/50 px-5 py-2 text-sm text-cyan-200 disabled:opacity-60"
              >
                {isRunningLint ? "Lint 실행 중.." : "Lint 실행"}
              </button>
              {post ? (
                <>
                  <a
                    href={`/api/app/blog/posts/${post.id}/export?format=html`}
                    className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90"
                  >
                    HTML
                  </a>
                  <a
                    href={`/api/app/blog/posts/${post.id}/export?format=md`}
                    className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90"
                  >
                    MD
                  </a>
                  <a
                    href={`/api/app/blog/posts/${post.id}/export?format=zip`}
                    className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90"
                  >
                    ZIP
                  </a>
                </>
              ) : null}
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Lint 결과</h2>
        {lintIssues.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">현재 Lint 이슈가 없거나 아직 실행하지 않았습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {lintIssues.map((issue, index) => (
              <article key={`${issue.ruleId}-${index}`} className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
                <p className="text-sm font-semibold text-amber-100">
                  {issue.ruleId} · line {issue.line}
                </p>
                <p className="mt-1 text-sm text-amber-100/90">{issue.message}</p>
                <p className="mt-2 text-xs text-amber-100/80">excerpt: {issue.excerpt}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
