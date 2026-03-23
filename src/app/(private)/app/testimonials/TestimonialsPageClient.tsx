"use client";

import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedTestimonialDto } from "@/app/(private)/app/_lib/server-serializers";

type TestimonialStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";

const STATUS_LABELS: Record<TestimonialStatus, string> = {
  PENDING: "대기 중",
  SUBMITTED: "작성 완료",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};

const STATUS_COLORS: Record<TestimonialStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const RELATIONSHIP_PRESETS = ["동료", "상사", "부하", "멘토", "멘티", "클라이언트", "협력사", "기타"];

type TestimonialsPageClientProps = {
  initialTestimonials: SerializedTestimonialDto[];
};

export function TestimonialsPageClient({ initialTestimonials }: TestimonialsPageClientProps) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 생성 폼
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRelationship, setCreateRelationship] = useState("");


  async function handleCreate() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/app/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: createName || null,
          authorEmail: createEmail || null,
          relationship: createRelationship || null,
        }),
      });
      const result = await parseApiResponse<SerializedTestimonialDto>(res);
      if (result.data) {
        setTestimonials((prev) => [result.data!, ...prev]);
        setShowCreateForm(false);
        setCreateName("");
        setCreateEmail("");
        setCreateRelationship("");
      } else {
        setError(result.error);
      }
    } catch {
      setError("생성에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: TestimonialStatus) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/app/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await parseApiResponse<SerializedTestimonialDto>(res);
      if (result.data) {
        setTestimonials((prev) => prev.map((t) => (t.id === id ? result.data! : t)));
      } else {
        setError(result.error);
      }
    } catch {
      setError("상태 변경에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTogglePublic(id: string, isPublic: boolean) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/app/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });
      const result = await parseApiResponse<SerializedTestimonialDto>(res);
      if (result.data) {
        setTestimonials((prev) => prev.map((t) => (t.id === id ? result.data! : t)));
      }
    } catch {
      setError("변경에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("추천서를 삭제하시겠습니까?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/app/testimonials/${id}`, { method: "DELETE" });
      const result = await parseApiResponse<void>(res);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {
      setError("삭제에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  }

  function copyShareLink(token: string) {
    const url = `${window.location.origin}/testimonial/${token}`;
    navigator.clipboard.writeText(url);
  }

  const selected = testimonials.find((t) => t.id === selectedId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">추천서 / 동료 평가</h1>
          <p className="mt-1 text-sm text-black/60">
            공유 링크를 보내면 동료가 비로그인으로 추천서를 작성할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80"
        >
          + 추천 요청
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            닫기
          </button>
        </div>
      ) : null}

      {/* 생성 폼 모달 */}
      {showCreateForm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">추천 요청 생성</h2>
            <p className="mt-1 text-sm text-black/60">
              작성자 정보를 미리 입력하면 편리합니다. (선택 사항)
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-black/70">작성자 이름</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70">작성자 이메일</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="예: hong@company.com"
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70">관계</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {RELATIONSHIP_PRESETS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setCreateRelationship(r)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        createRelationship === r
                          ? "bg-black text-white"
                          : "bg-black/5 text-black/70 hover:bg-black/10"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg px-4 py-2 text-sm text-black/60 hover:bg-black/5"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50"
              >
                {actionLoading ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 추천서 목록 */}
      {testimonials.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-8 text-center">
          <p className="text-sm text-black/50">
            아직 추천서 요청이 없습니다. 상단의 &quot;+ 추천 요청&quot; 버튼으로 시작해보세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
              className={`cursor-pointer rounded-xl border p-4 transition hover:shadow-sm ${
                selectedId === t.id ? "border-black/20 bg-black/[0.02]" : "border-black/10 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-black/60">
                    {(t.authorName ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t.authorName ?? "이름 미지정"}
                      {t.relationship ? (
                        <span className="ml-1.5 text-xs text-black/50">({t.relationship})</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-black/50">
                      {t.authorCompany ? `${t.authorCompany} · ` : ""}
                      {t.authorTitle ?? ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.isPublic ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">공개</span>
                  ) : null}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>
              </div>

              {t.content ? (
                <p className="mt-3 line-clamp-2 text-sm text-black/65">{t.content}</p>
              ) : null}

              {t.rating ? (
                <p className="mt-1 text-xs text-amber-600">
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* 상세 패널 */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selected.authorName ?? "이름 미지정"}
                {selected.relationship ? ` (${selected.relationship})` : ""}
              </h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
            </div>

            {selected.authorCompany || selected.authorTitle ? (
              <p className="mt-1 text-sm text-black/60">
                {[selected.authorCompany, selected.authorTitle].filter(Boolean).join(" · ")}
              </p>
            ) : null}

            {selected.authorEmail ? (
              <p className="mt-1 text-xs text-black/50">{selected.authorEmail}</p>
            ) : null}

            {selected.content ? (
              <div className="mt-4 rounded-lg bg-black/[0.02] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/75">{selected.content}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-black/15 p-4 text-center">
                <p className="text-sm text-black/40">아직 작성되지 않았습니다.</p>
              </div>
            )}

            {selected.rating ? (
              <p className="mt-2 text-sm text-amber-600">
                평점: {"★".repeat(selected.rating)}{"☆".repeat(5 - selected.rating)}
              </p>
            ) : null}

            {/* 공유 링크 */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/[0.03] p-3">
              <p className="flex-1 truncate text-xs text-black/50">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/testimonial/${selected.shareToken}`
                  : `/testimonial/${selected.shareToken}`}
              </p>
              <button
                onClick={() => copyShareLink(selected.shareToken)}
                className="shrink-0 rounded-md bg-black/10 px-3 py-1 text-xs font-medium text-black/70 hover:bg-black/15"
              >
                복사
              </button>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status === "SUBMITTED" ? (
                <>
                  <button
                    onClick={() => handleStatusChange(selected.id, "APPROVED")}
                    disabled={actionLoading}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected.id, "REJECTED")}
                    disabled={actionLoading}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    거절
                  </button>
                </>
              ) : null}

              {selected.status === "APPROVED" ? (
                <button
                  onClick={() => handleTogglePublic(selected.id, !selected.isPublic)}
                  disabled={actionLoading}
                  className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/5 disabled:opacity-50"
                >
                  {selected.isPublic ? "비공개로 전환" : "공개로 전환"}
                </button>
              ) : null}

              {selected.status === "REJECTED" ? (
                <button
                  onClick={() => handleStatusChange(selected.id, "APPROVED")}
                  disabled={actionLoading}
                  className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/5 disabled:opacity-50"
                >
                  재승인
                </button>
              ) : null}

              <button
                onClick={() => handleDelete(selected.id)}
                disabled={actionLoading}
                className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                삭제
              </button>

              <button
                onClick={() => setSelectedId(null)}
                className="ml-auto rounded-lg px-4 py-2 text-sm text-black/60 hover:bg-black/5"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
