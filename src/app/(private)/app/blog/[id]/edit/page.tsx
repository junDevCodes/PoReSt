"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Visibility = "PRIVATE" | "UNLISTED" | "PUBLIC";
type BlogExportFormat = "html" | "md" | "zip";

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

type OwnerBlogExportArtifactDto = {
  id: string;
  blogPostId: string;
  format: BlogExportFormat;
  fileName: string;
  contentType: string;
  byteSize: number;
  snapshotHash: string;
  createdAt: string;
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

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "기록 없음";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "기록 없음";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

function parseDownloadFileName(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) {
    return fallback;
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
  if (match?.[1]) {
    return match[1];
  }

  return fallback;
}

async function downloadResponseFile(response: Response, fallbackFileName: string) {
  const blob = await response.blob();
  const fileName = parseDownloadFileName(response.headers.get("Content-Disposition"), fallbackFileName);
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

function fallbackFileName(format: BlogExportFormat): string {
  if (format === "zip") {
    return "blog-export.zip";
  }

  return `blog-export.${format}`;
}

export default function BlogEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<OwnerBlogPostDetailDto | null>(null);
  const [form, setForm] = useState<BlogFormState | null>(null);
  const [exportsHistory, setExportsHistory] = useState<OwnerBlogExportArtifactDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningLint, setIsRunningLint] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingExports, setIsLoadingExports] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<BlogExportFormat | null>(null);
  const [downloadingExportId, setDownloadingExportId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const postId = typeof params?.id === "string" ? params.id : "";
  const lintIssues = useMemo(() => parseLintIssues(post?.lintReportJson), [post?.lintReportJson]);

  async function requestPost(id: string) {
    const response = await fetch(`/api/app/blog/posts/${id}`, { method: "GET" });
    return parseApiResponse<OwnerBlogPostDetailDto>(response);
  }

  async function requestExportHistory(id: string) {
    const response = await fetch(`/api/app/blog/posts/${id}/exports`, { method: "GET" });
    return parseApiResponse<OwnerBlogExportArtifactDto[]>(response);
  }

  async function loadExportHistory(id: string) {
    setIsLoadingExports(true);

    const parsed = await requestExportHistory(id);
    if (parsed.error) {
      setError(parsed.error);
      setIsLoadingExports(false);
      return;
    }

    setExportsHistory(parsed.data ?? []);
    setIsLoadingExports(false);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      if (!postId) {
        setError("글 경로가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      const [postResult, exportResult] = await Promise.all([requestPost(postId), requestExportHistory(postId)]);
      if (!mounted) {
        return;
      }

      if (postResult.error || !postResult.data) {
        setError(postResult.error ?? "글 정보를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      if (exportResult.error) {
        setError(exportResult.error);
        setIsLoading(false);
        return;
      }

      setPost(postResult.data);
      setForm(toFormState(postResult.data));
      setExportsHistory(exportResult.data ?? []);
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

  async function handleCreateExport(format: BlogExportFormat) {
    if (!post) {
      return;
    }

    setExportingFormat(format);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/blog/posts/${post.id}/export?format=${format}`, { method: "GET" });
    if (!response.ok) {
      const parsed = await parseApiResponse<never>(response);
      setError(parsed.error ?? "Export 생성에 실패했습니다.");
      setExportingFormat(null);
      return;
    }

    await downloadResponseFile(response, fallbackFileName(format));
    setMessage("Export 파일을 다운로드했습니다.");
    setExportingFormat(null);
    await loadExportHistory(post.id);
  }

  async function handleDownloadHistoryExport(exportId: string, fileName: string) {
    if (!post) {
      return;
    }

    setDownloadingExportId(exportId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/blog/posts/${post.id}/exports/${exportId}`, { method: "GET" });
    if (!response.ok) {
      const parsed = await parseApiResponse<never>(response);
      setError(parsed.error ?? "Export 재다운로드에 실패했습니다.");
      setDownloadingExportId(null);
      return;
    }

    await downloadResponseFile(response, fileName);
    setMessage("선택한 Export 파일을 다운로드했습니다.");
    setDownloadingExportId(null);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">블로그 글 편집</h1>
          <p className="mt-3 text-sm text-white/65">본문 편집, Lint, Export 이력 관리를 진행합니다.</p>
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
            {isDeleting ? "삭제 중..." : "글 삭제"}
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
                {isSaving ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => void handleRunLint()}
                disabled={isRunningLint}
                className="rounded-full border border-cyan-400/50 px-5 py-2 text-sm text-cyan-200 disabled:opacity-60"
              >
                {isRunningLint ? "Lint 실행 중..." : "Lint 실행"}
              </button>
              <button
                type="button"
                onClick={() => void handleCreateExport("html")}
                disabled={exportingFormat !== null}
                className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 disabled:opacity-60"
              >
                {exportingFormat === "html" ? "HTML 생성 중..." : "HTML"}
              </button>
              <button
                type="button"
                onClick={() => void handleCreateExport("md")}
                disabled={exportingFormat !== null}
                className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 disabled:opacity-60"
              >
                {exportingFormat === "md" ? "MD 생성 중..." : "MD"}
              </button>
              <button
                type="button"
                onClick={() => void handleCreateExport("zip")}
                disabled={exportingFormat !== null}
                className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 disabled:opacity-60"
              >
                {exportingFormat === "zip" ? "ZIP 생성 중..." : "ZIP"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Export 이력</h2>
          {post ? (
            <button
              type="button"
              onClick={() => void loadExportHistory(post.id)}
              disabled={isLoadingExports}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80 disabled:opacity-60"
            >
              {isLoadingExports ? "새로고침 중..." : "이력 새로고침"}
            </button>
          ) : null}
        </div>

        {isLoading || isLoadingExports ? (
          <p className="mt-4 text-sm text-white/60">Export 이력을 불러오는 중입니다.</p>
        ) : exportsHistory.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">생성된 Export 이력이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {exportsHistory.map((artifact) => (
              <article key={artifact.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{artifact.fileName}</p>
                    <p className="mt-1 text-xs text-white/60">
                      형식: {artifact.format.toUpperCase()} / 크기: {artifact.byteSize} bytes / 생성: {formatDateLabel(artifact.createdAt)}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">hash: {artifact.snapshotHash}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDownloadHistoryExport(artifact.id, artifact.fileName)}
                    disabled={downloadingExportId === artifact.id}
                    className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm text-cyan-200 disabled:opacity-60"
                  >
                    {downloadingExportId === artifact.id ? "다운로드 중..." : "재다운로드"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Lint 결과</h2>
        {lintIssues.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">Lint 이슈가 없거나 아직 실행되지 않았습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {lintIssues.map((issue, index) => (
              <article key={`${issue.ruleId}-${index}`} className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
                <p className="text-sm font-semibold text-amber-100">
                  {issue.ruleId} / line {issue.line}
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