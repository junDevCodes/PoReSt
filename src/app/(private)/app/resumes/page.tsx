"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type ResumeStatus = "DRAFT" | "SUBMITTED" | "ARCHIVED";

type OwnerResumeListItemDto = {
  id: string;
  status: ResumeStatus;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  level: string | null;
  itemCount: number;
  updatedAt: string;
};

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<OwnerResumeListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function requestResumes() {
    const response = await fetch("/api/app/resumes", { method: "GET" });
    return parseApiResponse<OwnerResumeListItemDto[]>(response);
  }

  async function reloadResumes() {
    setIsLoading(true);
    setError(null);
    const parsed = await requestResumes();
    if (parsed.error) {
      setError(parsed.error);
      setIsLoading(false);
      return;
    }

    setResumes(parsed.data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialResumes() {
      const parsed = await requestResumes();
      if (!mounted) {
        return;
      }

      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }

      setResumes(parsed.data ?? []);
      setIsLoading(false);
    }

    void loadInitialResumes();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(resume: OwnerResumeListItemDto) {
    const shouldDelete = confirm(`"${resume.title}" 이력서를 삭제하시겠습니까?`);
    if (!shouldDelete) {
      return;
    }

    setDeletingId(resume.id);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/resumes/${resume.id}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setDeletingId(null);
      return;
    }

    setMessage("이력서가 삭제되었습니다.");
    setDeletingId(null);
    await reloadResumes();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">이력서 관리</h1>
          <p className="mt-3 text-sm text-white/65">
            회사/직무별 이력서 버전을 생성하고, 포함할 경력 항목을 관리합니다.
          </p>
        </div>
        <Link href="/app/resumes/new" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
          새 이력서
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
        <h2 className="text-lg font-semibold">이력서 목록</h2>

        {isLoading ? (
          <p className="mt-4 text-sm text-white/60">이력서 목록을 불러오는 중입니다.</p>
        ) : resumes.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">등록된 이력서가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {resumes.map((resume) => (
              <article key={resume.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{resume.title}</h3>
                    <p className="mt-1 text-xs text-white/60">
                      상태: {resume.status} · 항목 수: {resume.itemCount} · 수정일:{" "}
                      {formatDateLabel(resume.updatedAt)}
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      {resume.targetCompany ?? "회사 미지정"} / {resume.targetRole ?? "직무 미지정"}
                      {resume.level ? ` / ${resume.level}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/app/resumes/${resume.id}/edit`}
                      className="rounded-lg border border-emerald-400/50 px-3 py-2 text-sm text-emerald-200"
                    >
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(resume)}
                      disabled={deletingId === resume.id}
                      className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm text-rose-200 disabled:opacity-60"
                    >
                      {deletingId === resume.id ? "삭제 중..." : "삭제"}
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
