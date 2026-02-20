"use client";

import Link from "next/link";
import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerResumeListItemDto } from "@/app/(private)/app/_lib/server-serializers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type ResumesPageClientProps = {
  initialResumes: SerializedOwnerResumeListItemDto[];
};

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

export function ResumesPageClient({ initialResumes }: ResumesPageClientProps) {
  const [resumes, setResumes] = useState<SerializedOwnerResumeListItemDto[]>(initialResumes);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteResume, setPendingDeleteResume] =
    useState<SerializedOwnerResumeListItemDto | null>(null);
  const toast = useToast();

  async function requestResumes() {
    const response = await fetch("/api/app/resumes", { method: "GET" });
    return parseApiResponse<SerializedOwnerResumeListItemDto[]>(response);
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

  async function handleDeleteConfirmed() {
    if (!pendingDeleteResume) {
      return;
    }

    setDeletingId(pendingDeleteResume.id);
    setError(null);

    const response = await fetch(`/api/app/resumes/${pendingDeleteResume.id}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setDeletingId(null);
      return;
    }

    toast.success("이력서를 삭제했습니다.");
    setDeletingId(null);
    setPendingDeleteResume(null);
    await reloadResumes();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">이력서 관리</h1>
          <p className="mt-3 text-sm text-black/65">
            회사/직무별 이력서 버전을 생성하고, 포함 경력과 항목 구성을 관리합니다.
          </p>
        </div>
        <Link
          href="/app/resumes/new"
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
        >
          새 이력서
        </Link>
      </header>

      {error ? <ErrorBanner message={error} className="mt-6" /> : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">이력서 목록</h2>

        {isLoading ? (
          <LoadingBlock message="이력서 목록을 불러오는 중입니다." className="mt-4" />
        ) : resumes.length === 0 ? (
          <EmptyBlock message="등록된 이력서가 없습니다." className="mt-4" />
        ) : (
          <div className="mt-4 space-y-3">
            {resumes.map((resume) => (
              <article key={resume.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{resume.title}</h3>
                    <p className="mt-1 text-xs text-black/60">
                      상태: {resume.status} · 항목 수: {resume.itemCount} · 수정일 {formatDateLabel(resume.updatedAt)}
                    </p>
                    <p className="mt-2 text-sm text-black/70">
                      {resume.targetCompany ?? "회사 미지정"} / {resume.targetRole ?? "직무 미지정"}
                      {resume.level ? ` / ${resume.level}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/app/resumes/${resume.id}/edit`}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800"
                    >
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteResume(resume)}
                      disabled={deletingId === resume.id}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800 disabled:opacity-60"
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

      <ConfirmDialog
        open={Boolean(pendingDeleteResume)}
        title="이력서를 삭제할까요?"
        description={
          pendingDeleteResume
            ? `"${pendingDeleteResume.title}" 이력서를 삭제하면 복구할 수 없습니다.`
            : "이력서를 삭제합니다."
        }
        confirmText="삭제"
        cancelText="취소"
        isDanger
        isLoading={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) {
            setPendingDeleteResume(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
      />
    </div>
  );
}
