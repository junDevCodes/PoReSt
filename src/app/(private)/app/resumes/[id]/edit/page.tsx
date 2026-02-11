"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import {
  applySortOrderByIndex,
  reorderResumeItems,
  type ResumeReorderItem,
} from "@/app/(private)/app/resumes/_lib/reorder";
import { resolveResumeItemComparison } from "@/app/(private)/app/resumes/_lib/compare";
import { openResumePdfPrintWindow } from "@/app/(private)/app/resumes/_lib/pdf";
import {
  getResumeItemSyncBadgeText,
  getResumeItemSyncStatus,
} from "@/app/(private)/app/resumes/_lib/sync";

type ResumeStatus = "DRAFT" | "SUBMITTED" | "ARCHIVED";

type OwnerResumeItemDto = {
  id: string;
  resumeId: string;
  experienceId: string;
  sortOrder: number;
  overrideBulletsJson: unknown;
  overrideMetricsJson: unknown;
  overrideTechTags: string[];
  notes: string | null;
  updatedAt: string;
  experience: {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    summary: string | null;
    bulletsJson: unknown;
    metricsJson: unknown;
    techTags: string[];
    updatedAt: string;
  };
};

type OwnerResumeDetailDto = {
  id: string;
  status: ResumeStatus;
  title: string;
  targetCompany: string | null;
  targetRole: string | null;
  level: string | null;
  summaryMd: string | null;
  updatedAt: string;
  items: OwnerResumeItemDto[];
};

type OwnerExperienceOptionDto = {
  id: string;
  company: string;
  role: string;
};

type ResumePreviewDto = {
  resume: {
    id: string;
    title: string;
    targetCompany: string | null;
    targetRole: string | null;
    level: string | null;
    summaryMd: string | null;
    updatedAt: string;
  };
  items: Array<{
    itemId: string;
    sortOrder: number;
    notes: string | null;
    resolvedBulletsJson: unknown;
    resolvedMetricsJson: unknown;
    resolvedTechTags: string[];
    experience: {
      company: string;
      role: string;
      summary: string | null;
    };
  }>;
};

type ResumeFormState = {
  status: ResumeStatus;
  title: string;
  targetCompany: string;
  targetRole: string;
  level: string;
  summaryMd: string;
};

type ItemEditor = {
  experienceId: string;
  sortOrder: number;
  overrideBulletsJsonText: string;
  overrideMetricsJsonText: string;
  overrideTechTagsText: string;
  notes: string;
};

type CreateItemState = {
  experienceId: string;
  sortOrder: number;
};

function toItemEditors(items: OwnerResumeItemDto[]): Record<string, ItemEditor> {
  return items.reduce<Record<string, ItemEditor>>((acc, item) => {
    acc[item.id] = {
      experienceId: item.experienceId,
      sortOrder: item.sortOrder,
      overrideBulletsJsonText: formatJsonText(item.overrideBulletsJson),
      overrideMetricsJsonText: formatJsonText(item.overrideMetricsJson),
      overrideTechTagsText: item.overrideTechTags.join(", "),
      notes: item.notes ?? "",
    };
    return acc;
  }, {});
}

function toResumeFormState(resume: OwnerResumeDetailDto): ResumeFormState {
  return {
    status: resume.status,
    title: resume.title,
    targetCompany: resume.targetCompany ?? "",
    targetRole: resume.targetRole ?? "",
    level: resume.level ?? "",
    summaryMd: resume.summaryMd ?? "",
  };
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatJsonText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function parseOptionalJsonText(input: string): { ok: true; value: unknown | null } | { ok: false } {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }

  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false };
  }
}

export default function ResumeEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [resume, setResume] = useState<OwnerResumeDetailDto | null>(null);
  const [form, setForm] = useState<ResumeFormState | null>(null);
  const [itemEditors, setItemEditors] = useState<Record<string, ItemEditor>>({});
  const [availableExperiences, setAvailableExperiences] = useState<OwnerExperienceOptionDto[]>([]);
  const [createItem, setCreateItem] = useState<CreateItemState>({ experienceId: "", sortOrder: 0 });
  const [preview, setPreview] = useState<ResumePreviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isReorderingItems, setIsReorderingItems] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [isDeletingResume, setIsDeletingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resumeId = typeof params?.id === "string" ? params.id : "";

  const availableExperienceOptions = useMemo(() => {
    const usedIds = new Set(resume?.items.map((item) => item.experienceId) ?? []);
    return availableExperiences.filter((experience) => !usedIds.has(experience.id));
  }, [availableExperiences, resume?.items]);

  const outdatedItemCount = useMemo(() => {
    const items = resume?.items ?? [];
    return items.filter((item) => {
      const status = getResumeItemSyncStatus(item.updatedAt, item.experience.updatedAt);
      return status === "OUTDATED";
    }).length;
  }, [resume?.items]);

  async function loadResumeDetail(id: string) {
    const response = await fetch(`/api/app/resumes/${id}`, { method: "GET" });
    return parseApiResponse<OwnerResumeDetailDto>(response);
  }

  async function loadExperiences() {
    const response = await fetch("/api/app/experiences", { method: "GET" });
    const parsed = await parseApiResponse<Array<{ id: string; company: string; role: string }>>(response);
    if (parsed.error) {
      return parsed;
    }
    return {
      ...parsed,
      data: parsed.data ?? [],
    };
  }

  async function reloadResume() {
    if (!resumeId) {
      return;
    }

    const parsed = await loadResumeDetail(resumeId);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "이력서를 불러오지 못했습니다.");
      return;
    }

    setResume(parsed.data);
    setForm(toResumeFormState(parsed.data));
    setItemEditors(toItemEditors(parsed.data.items));
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      if (!resumeId) {
        setError("이력서 식별자가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      const [resumeResult, experiencesResult] = await Promise.all([
        loadResumeDetail(resumeId),
        loadExperiences(),
      ]);

      if (!mounted) {
        return;
      }

      if (resumeResult.error || !resumeResult.data) {
        setError(resumeResult.error ?? "이력서를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      if (experiencesResult.error) {
        setError(experiencesResult.error);
        setIsLoading(false);
        return;
      }

      setResume(resumeResult.data);
      setForm(toResumeFormState(resumeResult.data));
      setItemEditors(toItemEditors(resumeResult.data.items));
      setAvailableExperiences(experiencesResult.data ?? []);
      setIsLoading(false);
    }

    void loadInitialData();
    return () => {
      mounted = false;
    };
  }, [resumeId]);

  async function handleSaveResume() {
    if (!resume || !form) {
      return;
    }

    setIsSavingResume(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/resumes/${resume.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        title: form.title,
        targetCompany: form.targetCompany || null,
        targetRole: form.targetRole || null,
        level: form.level || null,
        summaryMd: form.summaryMd || null,
      }),
    });
    const parsed = await parseApiResponse<OwnerResumeDetailDto>(response);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "이력서 저장에 실패했습니다.");
      setIsSavingResume(false);
      return;
    }

    setResume(parsed.data);
    setForm(toResumeFormState(parsed.data));
    setMessage("이력서가 저장되었습니다.");
    setIsSavingResume(false);
  }

  async function handleDeleteResume() {
    if (!resume) {
      return;
    }

    const shouldDelete = confirm(`"${resume.title}" 이력서를 삭제하시겠습니까?`);
    if (!shouldDelete) {
      return;
    }

    setIsDeletingResume(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/resumes/${resume.id}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setIsDeletingResume(false);
      return;
    }

    setIsDeletingResume(false);
    router.push("/app/resumes");
  }

  async function handleCreateItem() {
    if (!resume || !createItem.experienceId) {
      return;
    }

    setIsCreatingItem(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/resumes/${resume.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experienceId: createItem.experienceId,
        sortOrder: createItem.sortOrder,
      }),
    });
    const parsed = await parseApiResponse<OwnerResumeItemDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setIsCreatingItem(false);
      return;
    }

    setCreateItem({ experienceId: "", sortOrder: 0 });
    await reloadResume();
    setMessage("이력서 항목이 추가되었습니다.");
    setIsCreatingItem(false);
  }

  async function handleSaveItem(itemId: string) {
    if (!resume) {
      return;
    }

    const editor = itemEditors[itemId];
    if (!editor) {
      return;
    }

    const parsedBullets = parseOptionalJsonText(editor.overrideBulletsJsonText);
    if (!parsedBullets.ok) {
      setError("오버라이드 불릿 JSON 형식이 올바르지 않습니다.");
      return;
    }

    const parsedMetrics = parseOptionalJsonText(editor.overrideMetricsJsonText);
    if (!parsedMetrics.ok) {
      setError("오버라이드 지표 JSON 형식이 올바르지 않습니다.");
      return;
    }

    setSavingItemId(itemId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/resumes/${resume.id}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experienceId: editor.experienceId,
        sortOrder: editor.sortOrder,
        overrideBulletsJson: parsedBullets.value,
        overrideMetricsJson: parsedMetrics.value,
        overrideTechTags: parseTags(editor.overrideTechTagsText),
        notes: editor.notes || null,
      }),
    });
    const parsed = await parseApiResponse<OwnerResumeItemDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setSavingItemId(null);
      return;
    }

    await reloadResume();
    setMessage("이력서 항목이 저장되었습니다.");
    setSavingItemId(null);
  }

  async function handleDeleteItem(itemId: string) {
    if (!resume) {
      return;
    }

    setDeletingItemId(itemId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/resumes/${resume.id}/items/${itemId}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setDeletingItemId(null);
      return;
    }

    await reloadResume();
    setMessage("이력서 항목이 삭제되었습니다.");
    setDeletingItemId(null);
  }

  async function handleDropItem(targetItemId: string) {
    if (!resume || !draggingItemId) {
      return;
    }

    if (draggingItemId === targetItemId) {
      setDraggingItemId(null);
      return;
    }

    const currentItems: ResumeReorderItem[] = resume.items.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
    }));
    const reordered = reorderResumeItems(currentItems, draggingItemId, targetItemId);
    const recalculated = applySortOrderByIndex(reordered);
    const changed = recalculated.filter((item) => {
      const original = currentItems.find((current) => current.id === item.id);
      return original ? original.sortOrder !== item.sortOrder : false;
    });

    if (changed.length === 0) {
      setDraggingItemId(null);
      return;
    }

    setIsReorderingItems(true);
    setError(null);
    setMessage(null);

    const updateResults = await Promise.all(
      changed.map(async (item) => {
        const response = await fetch(`/api/app/resumes/${resume.id}/items/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: item.sortOrder }),
        });
        return parseApiResponse<OwnerResumeItemDto>(response);
      }),
    );

    const failed = updateResults.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error);
      setIsReorderingItems(false);
      setDraggingItemId(null);
      return;
    }

    await reloadResume();
    setMessage("항목 순서를 변경했습니다.");
    setIsReorderingItems(false);
    setDraggingItemId(null);
  }

  async function handleLoadPreview() {
    if (!resume) {
      return;
    }

    setError(null);
    const response = await fetch(`/api/app/resumes/${resume.id}/preview`, {
      method: "GET",
    });
    const parsed = await parseApiResponse<ResumePreviewDto>(response);
    if (parsed.error || !parsed.data) {
      setError(parsed.error ?? "프리뷰를 불러오지 못했습니다.");
      return;
    }

    setPreview(parsed.data);
  }

  async function handleDownloadPdf() {
    if (!resume) {
      return;
    }

    setIsDownloadingPdf(true);
    setError(null);
    setMessage(null);

    let currentPreview = preview;
    if (!currentPreview) {
      const response = await fetch(`/api/app/resumes/${resume.id}/preview`, {
        method: "GET",
      });
      const parsed = await parseApiResponse<ResumePreviewDto>(response);
      if (parsed.error || !parsed.data) {
        setError(parsed.error ?? "PDF 생성을 위한 프리뷰를 불러오지 못했습니다.");
        setIsDownloadingPdf(false);
        return;
      }
      currentPreview = parsed.data;
      setPreview(parsed.data);
    }

    const result = openResumePdfPrintWindow(currentPreview);
    if (!result.ok) {
      setError("PDF 창을 열 수 없습니다. 팝업 차단 설정을 확인해주세요.");
      setIsDownloadingPdf(false);
      return;
    }

    setMessage("인쇄 창이 열렸습니다. 프린터에서 'PDF로 저장'을 선택해주세요.");
    setIsDownloadingPdf(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">이력서 편집</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/app/resumes" className="rounded-full border border-white/30 px-4 py-2 text-sm">
            목록으로
          </Link>
          <button
            type="button"
            onClick={() => void handleDeleteResume()}
            disabled={isDeletingResume || isLoading}
            className="rounded-full border border-rose-400/50 px-4 py-2 text-sm text-rose-200 disabled:opacity-60"
          >
            {isDeletingResume ? "삭제 중..." : "이력서 삭제"}
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
        <h2 className="text-lg font-semibold">이력서 기본 정보</h2>
        {isLoading || !form ? (
          <p className="mt-4 text-sm text-white/60">이력서를 불러오는 중입니다.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span>제목</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="flex flex-col gap-2 text-sm">
                <span>상태</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev ? { ...prev, status: event.target.value as ResumeStatus } : prev,
                    )
                  }
                  className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>회사</span>
                <input
                  value={form.targetCompany}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, targetCompany: event.target.value } : prev))
                  }
                  className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>직무</span>
                <input
                  value={form.targetRole}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, targetRole: event.target.value } : prev))
                  }
                  className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>레벨</span>
                <input
                  value={form.level}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, level: event.target.value } : prev))
                  }
                  className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span>요약(Markdown)</span>
              <textarea
                value={form.summaryMd}
                onChange={(event) =>
                  setForm((prev) => (prev ? { ...prev, summaryMd: event.target.value } : prev))
                }
                className="min-h-36 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleSaveResume()}
              disabled={isSavingResume}
              className="w-fit rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {isSavingResume ? "저장 중..." : "이력서 저장"}
            </button>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">경력 항목 추가</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_120px]">
          <select
            value={createItem.experienceId}
            onChange={(event) =>
              setCreateItem((prev) => ({ ...prev, experienceId: event.target.value }))
            }
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
          >
            <option value="">추가할 경력을 선택하세요</option>
            {availableExperienceOptions.map((experience) => (
              <option key={experience.id} value={experience.id}>
                {experience.company} / {experience.role}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={createItem.sortOrder}
            onChange={(event) =>
              setCreateItem((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
            }
            min={0}
            max={9999}
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleCreateItem()}
            disabled={isCreatingItem || !createItem.experienceId}
            className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm text-cyan-200 disabled:opacity-60"
          >
            {isCreatingItem ? "추가 중..." : "항목 추가"}
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">이력서 항목</h2>
        {isLoading || !resume ? (
          <p className="mt-4 text-sm text-white/60">이력서 항목을 불러오는 중입니다.</p>
        ) : resume.items.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">추가된 항목이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-white/60">항목 카드를 드래그해서 순서를 변경할 수 있습니다.</p>
            {isReorderingItems ? (
              <p className="text-xs text-cyan-200">순서를 저장하는 중입니다.</p>
            ) : null}
            {outdatedItemCount > 0 ? (
              <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                원본 Experience가 변경된 항목이 {outdatedItemCount}개 있습니다. 필요한 항목을 확인 후 저장해
                동기화 상태를 맞춰주세요.
              </p>
            ) : null}
            {resume.items.map((item) => {
              const editor = itemEditors[item.id] ?? {
                experienceId: item.experienceId,
                sortOrder: item.sortOrder,
                overrideBulletsJsonText: formatJsonText(item.overrideBulletsJson),
                overrideMetricsJsonText: formatJsonText(item.overrideMetricsJson),
                overrideTechTagsText: item.overrideTechTags.join(", "),
                notes: item.notes ?? "",
              };
              const syncStatus = getResumeItemSyncStatus(item.updatedAt, item.experience.updatedAt);
              const syncBadgeText = getResumeItemSyncBadgeText(syncStatus);
              const syncBadgeClassName =
                syncStatus === "OUTDATED"
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
                  : syncStatus === "SYNCED"
                    ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                    : "border-white/20 bg-white/10 text-white/80";
              const comparison = resolveResumeItemComparison({
                experience: {
                  bulletsJson: item.experience.bulletsJson,
                  metricsJson: item.experience.metricsJson,
                  techTags: item.experience.techTags,
                },
                overrideBulletsJson: item.overrideBulletsJson,
                overrideMetricsJson: item.overrideMetricsJson,
                overrideTechTags: item.overrideTechTags,
              });

              return (
                <article
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggingItemId(item.id)}
                  onDragEnd={() => setDraggingItemId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    void handleDropItem(item.id);
                  }}
                  className={`rounded-xl border bg-black/20 p-4 transition ${
                    draggingItemId === item.id
                      ? "border-cyan-300/70"
                      : "border-white/10 hover:border-cyan-500/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {item.experience.company} / {item.experience.role}
                    </p>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${syncBadgeClassName}`}
                    >
                      {syncBadgeText}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_1fr_80px_80px]">
                    <select
                      value={editor.experienceId}
                      onChange={(event) =>
                        setItemEditors((prev) => ({
                          ...prev,
                          [item.id]: { ...editor, experienceId: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
                    >
                      {availableExperiences.map((experience) => (
                        <option key={experience.id} value={experience.id}>
                          {experience.company} / {experience.role}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editor.sortOrder}
                      onChange={(event) =>
                        setItemEditors((prev) => ({
                          ...prev,
                          [item.id]: { ...editor, sortOrder: Number(event.target.value) || 0 },
                        }))
                      }
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
                    />
                    <input
                      value={editor.overrideTechTagsText}
                      onChange={(event) =>
                        setItemEditors((prev) => ({
                          ...prev,
                          [item.id]: { ...editor, overrideTechTagsText: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
                      placeholder="기술 태그(콤마 구분)"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveItem(item.id)}
                      disabled={savingItemId === item.id || isReorderingItems}
                      className="rounded-lg border border-emerald-400/50 px-3 py-2 text-sm text-emerald-200 disabled:opacity-60"
                    >
                      {savingItemId === item.id ? "저장..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteItem(item.id)}
                      disabled={deletingItemId === item.id || isReorderingItems}
                      className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm text-rose-200 disabled:opacity-60"
                    >
                      {deletingItemId === item.id ? "삭제..." : "삭제"}
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm">
                      <span>오버라이드 불릿 JSON</span>
                      <textarea
                        value={editor.overrideBulletsJsonText}
                        onChange={(event) =>
                          setItemEditors((prev) => ({
                            ...prev,
                            [item.id]: { ...editor, overrideBulletsJsonText: event.target.value },
                          }))
                        }
                        className="min-h-24 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-xs"
                        placeholder='["핵심 성과 1", "핵심 성과 2"]'
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                      <span>오버라이드 지표 JSON</span>
                      <textarea
                        value={editor.overrideMetricsJsonText}
                        onChange={(event) =>
                          setItemEditors((prev) => ({
                            ...prev,
                            [item.id]: { ...editor, overrideMetricsJsonText: event.target.value },
                          }))
                        }
                        className="min-h-24 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-xs"
                        placeholder='{"conversionRate":"18%"}'
                      />
                    </label>
                  </div>
                  <textarea
                    value={editor.notes}
                    onChange={(event) =>
                      setItemEditors((prev) => ({
                        ...prev,
                        [item.id]: { ...editor, notes: event.target.value },
                      }))
                    }
                    className="mt-3 min-h-20 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
                    placeholder="항목 메모"
                  />
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-xs font-semibold text-white/80">원본</p>
                      <pre className="mt-2 overflow-x-auto text-[11px] text-white/70">
                        {`bullets: ${JSON.stringify(comparison.original.bulletsJson)}`}
                      </pre>
                      <pre className="mt-2 overflow-x-auto text-[11px] text-white/70">
                        {`metrics: ${JSON.stringify(comparison.original.metricsJson)}`}
                      </pre>
                      <p className="mt-2 text-[11px] text-white/70">
                        tags:{" "}
                        {comparison.original.techTags.length > 0
                          ? comparison.original.techTags.join(", ")
                          : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
                      <p className="text-xs font-semibold text-cyan-100">수정본</p>
                      <p className="mt-1 text-[11px] text-cyan-200/80">
                        bullets {comparison.hasOverride.bullets ? "override" : "original"} / metrics{" "}
                        {comparison.hasOverride.metrics ? "override" : "original"} / tags{" "}
                        {comparison.hasOverride.techTags ? "override" : "original"}
                      </p>
                      <pre className="mt-2 overflow-x-auto text-[11px] text-cyan-100/85">
                        {`bullets: ${JSON.stringify(comparison.resolved.bulletsJson)}`}
                      </pre>
                      <pre className="mt-2 overflow-x-auto text-[11px] text-cyan-100/85">
                        {`metrics: ${JSON.stringify(comparison.resolved.metricsJson)}`}
                      </pre>
                      <p className="mt-2 text-[11px] text-cyan-100/85">
                        tags:{" "}
                        {comparison.resolved.techTags.length > 0
                          ? comparison.resolved.techTags.join(", ")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">프리뷰</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleLoadPreview()}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/90"
            >
              프리뷰 갱신
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isDownloadingPdf}
              className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm text-cyan-200 disabled:opacity-60"
            >
              {isDownloadingPdf ? "PDF 준비 중..." : "PDF 다운로드"}
            </button>
          </div>
        </div>

        {!preview ? (
          <p className="mt-4 text-sm text-white/60">프리뷰를 불러오면 이력서 결과를 확인할 수 있습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-white/80">
              {preview.resume.title} ({preview.items.length}개 항목)
            </p>
            {preview.items.map((item) => (
              <article key={item.itemId} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium">
                  {item.sortOrder}. {item.experience.company} / {item.experience.role}
                </p>
                <p className="mt-1 text-xs text-white/65">
                  기술: {item.resolvedTechTags.length > 0 ? item.resolvedTechTags.join(", ") : "없음"}
                </p>
                <pre className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/70">
                  {`bullets: ${JSON.stringify(item.resolvedBulletsJson)}`}
                </pre>
                <pre className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/70">
                  {`metrics: ${JSON.stringify(item.resolvedMetricsJson)}`}
                </pre>
                {item.notes ? <p className="mt-1 text-xs text-white/70">메모: {item.notes}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
