"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type {
  SerializedOwnerNoteListItemDto,
  SerializedOwnerNotebookDto,
} from "@/app/(private)/app/_lib/server-serializers";
import {
  buildNotebookSections,
  type OwnerNoteListItemDto,
} from "@/app/(private)/app/notes/_lib/list";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type NoteCreateForm = {
  notebookId: string;
  title: string;
  contentMd: string;
  summary: string;
  tags: string;
};

type NotesPageClientProps = {
  initialNotes: SerializedOwnerNoteListItemDto[];
  initialNotebooks: SerializedOwnerNotebookDto[];
};

function formatUpdatedAtLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function buildInitialForm(notebooks: SerializedOwnerNotebookDto[]): NoteCreateForm {
  return {
    notebookId: notebooks[0]?.id ?? "",
    title: "",
    contentMd: "",
    summary: "",
    tags: "",
  };
}

export function NotesPageClient({ initialNotes, initialNotebooks }: NotesPageClientProps) {
  const [notes, setNotes] = useState<OwnerNoteListItemDto[]>(initialNotes);
  const [notebooks, setNotebooks] = useState<SerializedOwnerNotebookDto[]>(initialNotebooks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [deletingNotebookId, setDeletingNotebookId] = useState<string | null>(null);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newNotebookDescription, setNewNotebookDescription] = useState("");
  const [noteForm, setNoteForm] = useState<NoteCreateForm>(buildInitialForm(initialNotebooks));
  const toast = useToast();

  async function loadData() {
    setIsLoading(true);
    const [notesResponse, notebooksResponse] = await Promise.all([
      fetch("/api/app/notes", { method: "GET" }),
      fetch("/api/app/notebooks", { method: "GET" }),
    ]);

    const [notesParsed, notebooksParsed] = await Promise.all([
      parseApiResponse<OwnerNoteListItemDto[]>(notesResponse),
      parseApiResponse<SerializedOwnerNotebookDto[]>(notebooksResponse),
    ]);

    if (notesParsed.error || notebooksParsed.error) {
      setError(notesParsed.error ?? notebooksParsed.error ?? "목록을 불러오지 못했습니다.");
      setIsLoading(false);
      return;
    }

    const nextNotebooks = notebooksParsed.data ?? [];
    const nextNotes = notesParsed.data ?? [];
    setNotes(nextNotes);
    setNotebooks(nextNotebooks);
    setNoteForm((prev) => ({
      ...prev,
      notebookId: prev.notebookId || nextNotebooks[0]?.id || "",
    }));
    setIsLoading(false);
  }

  const sections = useMemo(() => buildNotebookSections(notes), [notes]);

  async function handleCreateNotebook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCreatingNotebook(true);

    const response = await fetch("/api/app/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newNotebookName,
        description: newNotebookDescription || null,
      }),
    });

    const parsed = await parseApiResponse<SerializedOwnerNotebookDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setIsCreatingNotebook(false);
      return;
    }

    setNewNotebookName("");
    setNewNotebookDescription("");
    toast.success("노트북을 생성했습니다.");
    await loadData();
    setIsCreatingNotebook(false);
  }

  async function handleDeleteNotebook(notebookId: string) {
    setError(null);
    setDeletingNotebookId(notebookId);

    const response = await fetch(`/api/app/notebooks/${notebookId}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setDeletingNotebookId(null);
      return;
    }

    toast.success("노트북을 삭제했습니다.");
    await loadData();
    setDeletingNotebookId(null);
  }

  async function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCreatingNote(true);

    const response = await fetch("/api/app/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notebookId: noteForm.notebookId,
        title: noteForm.title,
        contentMd: noteForm.contentMd,
        summary: noteForm.summary || null,
        tags: parseTags(noteForm.tags),
      }),
    });

    const parsed = await parseApiResponse<OwnerNoteListItemDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setIsCreatingNote(false);
      return;
    }

    setNoteForm((prev) => ({
      ...prev,
      title: "",
      contentMd: "",
      summary: "",
      tags: "",
    }));
    toast.success("노트를 생성했습니다.");
    await loadData();
    setIsCreatingNote(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">노트 관리</h1>
          <p className="mt-3 text-sm text-black/65">
            노트북을 만들고 노트를 작성한 뒤, 상세 페이지에서 연관 후보를 관리할 수 있습니다.
          </p>
        </div>
      </header>

      {error ? <ErrorBanner message={error} className="mt-6" /> : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">노트북 생성</h2>
          <form onSubmit={handleCreateNotebook} className="mt-4 grid gap-3">
            <input
              value={newNotebookName}
              onChange={(event) => setNewNotebookName(event.target.value)}
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
              placeholder="예: 백엔드 자료구조"
            />
            <textarea
              value={newNotebookDescription}
              onChange={(event) => setNewNotebookDescription(event.target.value)}
              className="min-h-24 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
              placeholder="노트북 설명 (선택)"
            />
            <button
              type="submit"
              disabled={isCreatingNotebook || newNotebookName.trim().length === 0}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCreatingNotebook ? "생성 중..." : "노트북 생성"}
            </button>
          </form>

          <ul className="mt-5 space-y-2">
            {notebooks.map((notebook) => (
              <li
                key={notebook.id}
                className="flex items-center justify-between rounded-lg border border-black/10 bg-[#faf9f6] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{notebook.name}</p>
                  <p className="mt-1 text-xs text-black/55">
                    노트 {notebook.noteCount}개 · 수정일 {formatUpdatedAtLabel(notebook.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteNotebook(notebook.id)}
                  disabled={deletingNotebookId === notebook.id || notebook.noteCount > 0}
                  className="rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-800 disabled:opacity-50"
                  title={
                    notebook.noteCount > 0
                      ? "노트가 남아 있는 노트북은 삭제할 수 없습니다."
                      : "노트북 삭제"
                  }
                >
                  {deletingNotebookId === notebook.id ? "삭제 중..." : "삭제"}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">노트 작성</h2>
          <form onSubmit={handleCreateNote} className="mt-4 grid gap-3">
            <select
              value={noteForm.notebookId}
              onChange={(event) =>
                setNoteForm((prev) => ({
                  ...prev,
                  notebookId: event.target.value,
                }))
              }
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            >
              <option value="">노트북 선택</option>
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.name}
                </option>
              ))}
            </select>

            <input
              value={noteForm.title}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
              placeholder="노트 제목"
            />
            <textarea
              value={noteForm.summary}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, summary: event.target.value }))}
              className="min-h-20 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
              placeholder="요약 (선택)"
            />
            <textarea
              value={noteForm.contentMd}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, contentMd: event.target.value }))}
              className="min-h-32 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
              placeholder="노트 본문 (Markdown)"
            />
            <input
              value={noteForm.tags}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
              placeholder="태그 (쉼표로 구분)"
            />
            <button
              type="submit"
              disabled={
                isCreatingNote ||
                noteForm.notebookId.length === 0 ||
                noteForm.title.trim().length === 0 ||
                noteForm.contentMd.trim().length === 0
              }
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCreatingNote ? "저장 중..." : "노트 저장"}
            </button>
          </form>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">노트북별 노트 목록</h2>
        {isLoading ? (
          <LoadingBlock message="노트 목록을 불러오는 중입니다." className="mt-4" />
        ) : sections.length === 0 ? (
          <EmptyBlock message="등록된 노트가 없습니다." className="mt-4" />
        ) : (
          <div className="mt-5 space-y-5">
            {sections.map((section) => (
              <article key={section.notebook.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                <header className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{section.notebook.name}</h3>
                  <span className="text-xs text-black/50">{section.notes.length}개 노트</span>
                </header>
                <ul className="mt-3 space-y-2">
                  {section.notes.map((note) => (
                    <li key={note.id} className="rounded-lg border border-black/10 bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{note.title}</p>
                          <p className="mt-1 text-xs text-black/55">
                            수정일 {formatUpdatedAtLabel(String(note.updatedAt))} · 공개상태: {note.visibility}
                          </p>
                        </div>
                        <Link
                          href={`/app/notes/${note.id}`}
                          className="rounded-lg border border-emerald-300 px-3 py-2 text-xs text-emerald-800"
                        >
                          상세 보기
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
