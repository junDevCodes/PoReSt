"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import { buildNotebookSections, type OwnerNoteListItemDto } from "@/app/(private)/app/notes/_lib/list";

function formatUpdatedAtLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

export default function NotesPage() {
  const [notes, setNotes] = useState<OwnerNoteListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNotes() {
      const response = await fetch("/api/app/notes", { method: "GET" });
      const parsed = await parseApiResponse<OwnerNoteListItemDto[]>(response);

      if (!mounted) {
        return;
      }

      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }

      setNotes(parsed.data ?? []);
      setIsLoading(false);
    }

    void loadNotes();
    return () => {
      mounted = false;
    };
  }, []);

  const sections = useMemo(() => buildNotebookSections(notes), [notes]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">노트 관리</h1>
          <p className="mt-3 text-sm text-white/65">
            노트를 노트북별로 확인하고, 상세 페이지에서 연관 후보를 관리합니다.
          </p>
        </div>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">노트북/노트 목록</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-white/60">노트 목록을 불러오는 중입니다.</p>
        ) : sections.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">등록된 노트가 없습니다.</p>
        ) : (
          <div className="mt-5 space-y-5">
            {sections.map((section) => (
              <article key={section.notebook.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <header className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{section.notebook.name}</h3>
                  <span className="text-xs text-white/50">{section.notes.length}개 노트</span>
                </header>
                <ul className="mt-3 space-y-2">
                  {section.notes.map((note) => (
                    <li key={note.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{note.title}</p>
                          <p className="mt-1 text-xs text-white/55">
                            수정일: {formatUpdatedAtLabel(note.updatedAt)} · 공개상태: {note.visibility}
                          </p>
                        </div>
                        <Link
                          href={`/app/notes/${note.id}`}
                          className="rounded-lg border border-emerald-400/50 px-3 py-2 text-xs text-emerald-200"
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
    </main>
  );
}
