"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type {
  SerializedOwnerNoteDetailDto,
  SerializedOwnerNotebookDto,
} from "@/app/(private)/app/_lib/server-serializers";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

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

type NoteEditPageClientProps = {
  initialNote: SerializedOwnerNoteDetailDto;
  initialNotebooks: SerializedOwnerNotebookDto[];
};

export function NoteEditPageClient({ initialNote, initialNotebooks }: NoteEditPageClientProps) {
  const router = useRouter();
  const noteId = initialNote.id;

  const [form, setForm] = useState<NoteEditForm>({
    notebookId: initialNote.notebookId,
    visibility: initialNote.visibility as Visibility,
    title: initialNote.title,
    contentMd: initialNote.contentMd,
    summary: initialNote.summary ?? "",
    tags: initialNote.tags.join(", "),
  });
  const [notebooks] = useState(initialNotebooks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
        return await parseApiResponse<SerializedOwnerNoteDetailDto>(response);
      } catch {
        return { data: null, error: "네트워크 오류가 발생했습니다.", fields: null } as const;
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
          href={`/app/notes/${noteId}`}
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
      </section>
    </main>
  );
}
