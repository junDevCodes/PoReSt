"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerCoverLetterDetailDto } from "@/app/(private)/app/_lib/server-serializers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type CoverLetterDetailClientProps = {
  initialData: SerializedOwnerCoverLetterDetailDto;
};

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "날짜 정보 없음";
  return parsed.toISOString().slice(0, 10);
}

export function CoverLetterDetailClient({ initialData }: CoverLetterDetailClientProps) {
  const [form, setForm] = useState({
    title: initialData.title,
    targetCompany: initialData.targetCompany ?? "",
    targetRole: initialData.targetRole ?? "",
    status: initialData.status,
    contentMd: initialData.contentMd,
  });
  const [isReference, setIsReference] = useState(initialData.isReference);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
  const router = useRouter();
  const id = initialData.id;

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/app/cover-letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          targetCompany: form.targetCompany || null,
          targetRole: form.targetRole || null,
          status: form.status,
          contentMd: form.contentMd,
        }),
      });
      const parsed = await parseApiResponse<SerializedOwnerCoverLetterDetailDto>(response);

      if (parsed.error) {
        setError(parsed.error);
        toast.error(parsed.error);
        return;
      }

      toast.success("자기소개서가 저장되었습니다.");
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/app/cover-letters/${id}`, { method: "DELETE" });
      const parsed = await parseApiResponse<{ id: string }>(response);

      if (parsed.error) {
        setError(parsed.error);
        toast.error(parsed.error);
        return;
      }

      toast.success("자기소개서가 삭제되었습니다.");
      router.push("/app/cover-letters");
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleReference() {
    setIsToggling(true);
    setError(null);

    try {
      const response = await fetch(`/api/app/cover-letters/${id}/toggle-reference`, {
        method: "POST",
      });
      const parsed = await parseApiResponse<{ isReference: boolean }>(response);

      if (parsed.error) {
        setError(parsed.error);
        toast.error(parsed.error);
        return;
      }

      const newRef = parsed.data?.isReference ?? !isReference;
      setIsReference(newRef);
      toast.success(newRef ? "합격본으로 지정되었습니다." : "합격본 지정이 해제되었습니다.");
    } catch {
      toast.error("합격본 토글 중 오류가 발생했습니다.");
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col">
      {/* 뒤로가기 */}
      <Link
        href="/app/cover-letters"
        className="text-sm text-black/60 transition-colors hover:text-black"
      >
        ← 자기소개서 목록
      </Link>

      {error ? <ErrorBanner message={error} className="mt-4" /> : null}

      {/* 헤더 */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={120}
            className="w-full border-none bg-transparent text-2xl font-semibold outline-none focus:ring-0"
            placeholder="자기소개서 제목"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                form.status === "FINAL"
                  ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                  : "border-gray-200 bg-gray-100 text-gray-700"
              }`}
            >
              {form.status === "FINAL" ? "완성" : "초안"}
            </span>
            {isReference ? (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                ★ 합격본
              </span>
            ) : null}
            <span className="text-xs text-black/50">
              생성일 {formatDateLabel(initialData.createdAt)} · 수정일{" "}
              {formatDateLabel(initialData.updatedAt)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleToggleReference()}
            disabled={isToggling}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-60 ${
              isReference
                ? "border-amber-300 text-amber-800 hover:bg-amber-50"
                : "border-black/15 text-black/70 hover:bg-black/5"
            }`}
          >
            {isToggling ? "처리 중..." : isReference ? "합격본 해제" : "합격본 지정"}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !form.title.trim()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800 transition-colors hover:bg-rose-50 disabled:opacity-60"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 메타 필드 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="detail-company" className="block text-xs font-medium text-black/60">
            지원 회사
          </label>
          <input
            id="detail-company"
            type="text"
            value={form.targetCompany}
            onChange={(e) => setForm((f) => ({ ...f, targetCompany: e.target.value }))}
            maxLength={120}
            placeholder="회사명"
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="detail-role" className="block text-xs font-medium text-black/60">
            지원 직무
          </label>
          <input
            id="detail-role"
            type="text"
            value={form.targetRole}
            onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
            maxLength={120}
            placeholder="직무명"
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="detail-status" className="block text-xs font-medium text-black/60">
            상태
          </label>
          <select
            id="detail-status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "FINAL" }))}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="DRAFT">초안</option>
            <option value="FINAL">완성</option>
          </select>
        </div>
      </div>

      {/* 본문 편집 */}
      <div className="mt-6">
        <label htmlFor="detail-content" className="block text-xs font-medium text-black/60">
          본문
        </label>
        <textarea
          id="detail-content"
          value={form.contentMd}
          onChange={(e) => setForm((f) => ({ ...f, contentMd: e.target.value }))}
          maxLength={50000}
          rows={20}
          placeholder="자기소개서 본문을 작성하세요..."
          className="mt-2 w-full rounded-lg border border-black/15 px-4 py-3 text-sm leading-relaxed"
        />
      </div>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="자기소개서를 삭제할까요?"
        description={`"${form.title}" 자기소개서를 삭제하면 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        isDanger
        isLoading={isDeleting}
        onCancel={() => {
          if (!isDeleting) setShowDeleteConfirm(false);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </div>
  );
}
