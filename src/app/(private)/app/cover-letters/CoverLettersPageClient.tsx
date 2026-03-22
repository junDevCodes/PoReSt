"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerCoverLetterListItemDto } from "@/app/(private)/app/_lib/server-serializers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type CoverLettersPageClientProps = {
  initialCoverLetters: SerializedOwnerCoverLetterListItemDto[];
};

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

function statusBadge(status: string) {
  switch (status) {
    case "FINAL":
      return { label: "완성", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    default:
      return { label: "초안", cls: "bg-gray-100 text-gray-700 border-gray-200" };
  }
}

export function CoverLettersPageClient({ initialCoverLetters }: CoverLettersPageClientProps) {
  const [coverLetters, setCoverLetters] =
    useState<SerializedOwnerCoverLetterListItemDto[]>(initialCoverLetters);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<SerializedOwnerCoverLetterListItemDto | null>(null);

  // AI 생성 모달
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    targetCompany: "",
    targetRole: "",
    jobDescription: "",
    motivationHint: "",
  });

  // 합격본 등록 모달
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    title: "",
    targetCompany: "",
    targetRole: "",
    contentMd: "",
  });

  const toast = useToast();
  const router = useRouter();

  async function reloadCoverLetters() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/app/cover-letters", { method: "GET" });
      const parsed = await parseApiResponse<SerializedOwnerCoverLetterListItemDto[]>(response);
      if (parsed.error) {
        setError(parsed.error);
      } else {
        setCoverLetters(parsed.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!pendingDelete) return;

    setDeletingId(pendingDelete.id);
    setError(null);

    try {
      const response = await fetch(`/api/app/cover-letters/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const parsed = await parseApiResponse<{ id: string }>(response);
      if (parsed.error) {
        setError(parsed.error);
        toast.error(parsed.error);
        return;
      }
      toast.success("자기소개서를 삭제했습니다.");
      setPendingDelete(null);
      await reloadCoverLetters();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/app/cover-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCompany: generateForm.targetCompany,
          targetRole: generateForm.targetRole,
          jobDescription: generateForm.jobDescription || null,
          motivationHint: generateForm.motivationHint || null,
        }),
      });
      const parsed = await parseApiResponse<{ coverLetter: { id: string }; source: string }>(response);

      if (parsed.error) {
        setError(parsed.error);
        toast.error(parsed.error);
        return;
      }

      const source = parsed.data?.source === "gemini" ? "Gemini AI" : "템플릿";
      toast.success(`자기소개서가 생성되었습니다. (${source})`);
      setShowGenerateModal(false);
      setGenerateForm({ targetCompany: "", targetRole: "", jobDescription: "", motivationHint: "" });

      if (parsed.data?.coverLetter?.id) {
        router.push(`/app/cover-letters/${parsed.data.coverLetter.id}`);
      } else {
        await reloadCoverLetters();
      }
    } catch {
      toast.error("AI 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegister() {
    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch("/api/app/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: registerForm.title,
          targetCompany: registerForm.targetCompany || null,
          targetRole: registerForm.targetRole || null,
          contentMd: registerForm.contentMd,
          isReference: true,
          status: "FINAL",
        }),
      });
      const parsed = await parseApiResponse<{ id: string }>(response);

      if (parsed.error) {
        setError(parsed.error);
        toast.error(parsed.error);
        return;
      }

      toast.success("합격본이 등록되었습니다.");
      setShowRegisterModal(false);
      setRegisterForm({ title: "", targetCompany: "", targetRole: "", contentMd: "" });
      await reloadCoverLetters();
    } catch {
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">자기소개서</h1>
          <p className="mt-3 text-sm text-black/65">
            합격 자소서를 등록하고, AI로 맞춤 자기소개서를 생성합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="rounded-full border-2 border-violet-400 bg-violet-50 px-5 py-2 text-sm font-semibold text-violet-800"
          >
            AI 생성
          </button>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
          >
            합격본 등록
          </button>
        </div>
      </header>

      {error ? <ErrorBanner message={error} className="mt-6" /> : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">자기소개서 목록</h2>

        {isLoading ? (
          <LoadingBlock message="자기소개서 목록을 불러오는 중입니다." className="mt-4" />
        ) : coverLetters.length === 0 ? (
          <EmptyBlock message="등록된 자기소개서가 없습니다." className="mt-4" />
        ) : (
          <div className="mt-4 space-y-3">
            {coverLetters.map((cl) => {
              const badge = statusBadge(cl.status);
              return (
                <article
                  key={cl.id}
                  className="rounded-xl border border-black/10 bg-[#faf9f6] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <Link href={`/app/cover-letters/${cl.id}`} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{cl.title}</h3>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {cl.isReference ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            ★ 합격본
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm text-black/70">
                        {cl.targetCompany ?? "회사 미지정"}
                        <span className="mx-1.5 text-black/60">/</span>
                        {cl.targetRole ?? "직무 미지정"}
                      </p>
                      <p className="mt-1 text-xs text-black/60">
                        수정일 {formatDateLabel(cl.updatedAt)}
                      </p>
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/app/cover-letters/${cl.id}`}
                        className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800 transition-colors hover:bg-emerald-50"
                      >
                        편집
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(cl)}
                        disabled={deletingId === cl.id}
                        className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800 transition-colors hover:bg-rose-50 disabled:opacity-60"
                      >
                        {deletingId === cl.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="자기소개서를 삭제할까요?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" 자기소개서를 삭제하면 복구할 수 없습니다.`
            : "자기소개서를 삭제합니다."
        }
        confirmText="삭제"
        cancelText="취소"
        isDanger
        isLoading={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) setPendingDelete(null);
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
      />

      {/* AI 생성 모달 */}
      {showGenerateModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGenerating) setShowGenerateModal(false);
          }}
        >
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold">AI 자기소개서 생성</h2>
            <p className="mt-2 text-sm text-black/60">
              지원 정보를 입력하면 합격 자소서를 참고하여 맞춤 자기소개서를 생성합니다.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="gen-company" className="block text-sm font-medium text-black/80">
                  지원 회사 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="gen-company"
                  type="text"
                  value={generateForm.targetCompany}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, targetCompany: e.target.value }))}
                  placeholder="예: 네이버, 카카오"
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="gen-role" className="block text-sm font-medium text-black/80">
                  지원 직무 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="gen-role"
                  type="text"
                  value={generateForm.targetRole}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, targetRole: e.target.value }))}
                  placeholder="예: 백엔드 개발자, 프론트엔드 엔지니어"
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="gen-jd" className="block text-sm font-medium text-black/80">
                  채용 공고 (JD)
                  <span className="ml-1 font-normal text-black/40">선택</span>
                </label>
                <textarea
                  id="gen-jd"
                  value={generateForm.jobDescription}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, jobDescription: e.target.value }))}
                  placeholder="채용 공고 내용을 붙여넣으면 JD에 맞춤 최적화됩니다."
                  maxLength={5000}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="gen-hint" className="block text-sm font-medium text-black/80">
                  지원 동기 힌트
                  <span className="ml-1 font-normal text-black/40">선택</span>
                </label>
                <textarea
                  id="gen-hint"
                  value={generateForm.motivationHint}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, motivationHint: e.target.value }))}
                  placeholder="강조하고 싶은 지원 동기나 키워드를 입력하세요."
                  maxLength={2000}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { if (!isGenerating) setShowGenerateModal(false); }}
                disabled={isGenerating}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating || !generateForm.targetCompany.trim() || !generateForm.targetRole.trim()}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isGenerating ? "AI 분석 중..." : "생성"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 합격본 등록 모달 */}
      {showRegisterModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRegistering) setShowRegisterModal(false);
          }}
        >
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold">합격본 등록</h2>
            <p className="mt-2 text-sm text-black/60">
              합격한 자기소개서를 등록하면 AI 생성 시 참고 자료로 활용됩니다.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="reg-title" className="block text-sm font-medium text-black/80">
                  제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="reg-title"
                  type="text"
                  value={registerForm.title}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="예: 네이버 백엔드 합격 자소서"
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-company" className="block text-sm font-medium text-black/80">
                    회사
                  </label>
                  <input
                    id="reg-company"
                    type="text"
                    value={registerForm.targetCompany}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, targetCompany: e.target.value }))}
                    placeholder="예: 네이버"
                    maxLength={120}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="reg-role" className="block text-sm font-medium text-black/80">
                    직무
                  </label>
                  <input
                    id="reg-role"
                    type="text"
                    value={registerForm.targetRole}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, targetRole: e.target.value }))}
                    placeholder="예: 백엔드 개발자"
                    maxLength={120}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-content" className="block text-sm font-medium text-black/80">
                  자기소개서 본문 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="reg-content"
                  value={registerForm.contentMd}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, contentMd: e.target.value }))}
                  placeholder="합격한 자기소개서 전문을 붙여넣으세요."
                  maxLength={50000}
                  rows={8}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { if (!isRegistering) setShowRegisterModal(false); }}
                disabled={isRegistering}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleRegister()}
                disabled={isRegistering || !registerForm.title.trim() || !registerForm.contentMd.trim()}
                className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isRegistering ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
