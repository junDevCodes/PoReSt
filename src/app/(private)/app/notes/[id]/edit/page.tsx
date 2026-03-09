"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

type OwnerNoteDetailDto = {
  id: string;
  notebookId: string;
  visibility: Visibility;
  title: string;
  contentMd: string;
  summary: string | null;
  tags: string[];
  updatedAt: string;
  notebook: {
    id: string;
    name: string;
  };
};

type NotebookDto = {
  id: string;
  name: string;
  noteCount: number;
  updatedAt: string;
};

type NoteEditForm = {
  notebookId: string;
  visibility: Visibility;
  title: string;
  contentMd: string;
  summary: string;
  tags: string;
};

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export default function EditNotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const noteId = typeof params?.id === "string" ? params.id : "";

  const [form, setForm] = useState<NoteEditForm>({
    notebookId: "",
    visibility: "PRIVATE",
    title: "",
    contentMd: "",
    summary: "",
    tags: "",
  });
  const [notebooks, setNotebooks] = useState<NotebookDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!noteId) {
        setError("노트 식별자가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      const [noteResult, notebooksResult] = await Promise.all([
        (async () => {
          try {
            const response = await fetch(`/api/app/notes/${noteId}`, { method: "GET" });
            return await parseApiResponse<OwnerNoteDetailDto>(response);
          } catch (err) {
            return parseApiResponse<OwnerNoteDetailDto>(err);
          }
        })(),
        (async () => {
          try {
            const response = await fetch("/api/app/notebooks", { method: "GET" });
            return await parseApiResponse<NotebookDto[]>(response);
          } catch (err) {
            return parseApiResponse<NotebookDto[]>(err);
          }
        })(),
      ]);

      if (!mounted) return;

      if (noteResult.error || !noteResult.data) {
        setError(noteResult.error ?? "노트를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      const note = noteResult.data;
      setForm({
        notebookId: note.notebookId,
        visibility: note.visibility,
        title: note.title,
        contentMd: note.contentMd,
        summary: note.summary ?? "",
        tags: note.tags.join(", "),
      });
      setNotebooks(notebooksResult.data ?? []);
      setIsLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [noteId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteId) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const parsed = await (async () => {
      try {
        const response = await fetch(`/api/app/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notebookId: form.notebookId,
            visibility: form.visibility,
            title: form.title,
            contentMd: form.contentMd,
            summary: form.summary || null,
            tags: parseTags(form.tags),
          }),
        });
        return await parseApiResponse<OwnerNoteDetailDto>(response);
      } catch (err) {
        return parseApiResponse<OwnerNoteDetailDto>(err);
      }
    })();

    if (parsed.error) {
      setError(parsed.error);
      setIsSubmitting(false);
      return;
    }

    setMessage("노트가 수정되었습니다.");
    setIsSubmitting(false);
    router.push(`/app/notes/${noteId}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">노트 수정</h1>
          <p className="mt-3 text-sm text-black/60">노트 내용, 태그, 공개 상태를 수정합니다.</p>
        </div>
        <Link
          href={noteId ? `/app/notes/${noteId}` : "/app/notes"}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
        >
          상세로 돌아가기
        </Link>
      </header>

      {message ? (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        {isLoading ? (
          <p className="text-sm text-black/60">노트 정보를 불러오는 중입니다.</p>
        ) : error && !message ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">노트북</span>
              <select
                value={form.notebookId}
                onChange={(e) => setForm((prev) => ({ ...prev, notebookId: e.target.value }))}
                className="rounded-lg border border-black/15 bg-white px-3 py-2"
              >
                <option value="">노트북 선택</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">공개 상태</span>
              <select
                value={form.visibility}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, visibility: e.target.value as Visibility }))
                }
                className="rounded-lg border border-black/15 bg-white px-3 py-2"
              >
                <option value="PRIVATE">비공개</option>
                <option value="UNLISTED">링크 공개</option>
                <option value="PUBLIC">전체 공개</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">제목</span>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="rounded-lg border border-black/15 bg-white px-3 py-2"
                placeholder="노트 제목"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">요약</span>
              <textarea
                value={form.summary}
                onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                className="min-h-20 rounded-lg border border-black/15 bg-white px-3 py-2"
                placeholder="요약 (선택)"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">본문 (Markdown)</span>
              <textarea
                value={form.contentMd}
                onChange={(e) => setForm((prev) => ({ ...prev, contentMd: e.target.value }))}
                className="min-h-64 rounded-lg border border-black/15 bg-white px-3 py-2"
                placeholder="노트 본문 (Markdown)"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">태그</span>
              <input
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                className="rounded-lg border border-black/15 bg-white px-3 py-2"
                placeholder="태그 (쉼표로 구분)"
              />
            </label>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                form.notebookId.length === 0 ||
                form.title.trim().length === 0 ||
                form.contentMd.trim().length === 0
              }
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "저장 중..." : "노트 저장"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
