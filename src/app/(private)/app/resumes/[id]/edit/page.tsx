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

// B6: bullets 구조화 편집을 위한 string[] 기반 에디터
type BulletEntry = { value: string };
// B7: metrics 구조화 편집을 위한 key-value 쌍
type MetricEntry = { key: string; value: string };

type ItemEditor = {
  experienceId: string;
  sortOrder: number;
  bullets: BulletEntry[];
  metrics: MetricEntry[];
  overrideTechTagsText: string;
  notes: string;
};

type CreateItemState = {
  experienceId: string;
  sortOrder: number;
};

// B9: 공유 링크 타입
type ShareLinkDto = {
  id: string;
  token: string;
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
};

// ── 데이터 파싱 유틸 ──

function parseBulletsFromJson(json: unknown): BulletEntry[] {
  if (!json || !Array.isArray(json)) return [];
  return json
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((value) => ({ value }));
}

function parseMetricsFromJson(json: unknown): MetricEntry[] {
  if (!json || typeof json !== "object" || Array.isArray(json)) return [];
  return Object.entries(json as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([key, value]) => ({ key, value: String(value) }));
}

function bulletsToJson(bullets: BulletEntry[]): string[] | null {
  const filtered = bullets.map((b) => b.value.trim()).filter((v) => v.length > 0);
  return filtered.length > 0 ? filtered : null;
}

function metricsToJson(metrics: MetricEntry[]): Record<string, string> | null {
  const filtered = metrics.filter((m) => m.key.trim().length > 0);
  if (filtered.length === 0) return null;
  const result: Record<string, string> = {};
  for (const m of filtered) {
    result[m.key.trim()] = m.value.trim();
  }
  return result;
}

// 프리뷰용 안전 파서 (resolved 데이터에도 사용)
function safeParseBullets(json: unknown): string[] {
  if (!json || !Array.isArray(json)) return [];
  return json.filter((item): item is string => typeof item === "string");
}

function safeParseMetrics(json: unknown): Array<{ key: string; value: string }> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return [];
  return Object.entries(json as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([key, value]) => ({ key, value: String(value) }));
}

function toItemEditors(items: OwnerResumeItemDto[]): Record<string, ItemEditor> {
  return items.reduce<Record<string, ItemEditor>>((acc, item) => {
    acc[item.id] = {
      experienceId: item.experienceId,
      sortOrder: item.sortOrder,
      bullets: parseBulletsFromJson(item.overrideBulletsJson),
      metrics: parseMetricsFromJson(item.overrideMetricsJson),
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

// ── B6: Bullets 구조화 편집기 컴포넌트 ──

function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: BulletEntry[];
  onChange: (bullets: BulletEntry[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">오버라이드 불릿</span>
      {bullets.map((bullet, index) => (
        <div key={index} className="flex gap-2">
          <input
            value={bullet.value}
            onChange={(e) => {
              const next = [...bullets];
              next[index] = { value: e.target.value };
              onChange(next);
            }}
            className="flex-1 rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-1.5 text-sm"
            placeholder={`성과 항목 ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(bullets.filter((_, i) => i !== index))}
            className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...bullets, { value: "" }])}
        className="w-fit rounded-lg border border-dashed border-black/20 px-3 py-1.5 text-xs text-black/60 hover:border-black/40 hover:text-black/80"
      >
        + 항목 추가
      </button>
    </div>
  );
}

// ── B7: Metrics 구조화 편집기 컴포넌트 ──

function MetricsEditor({
  metrics,
  onChange,
}: {
  metrics: MetricEntry[];
  onChange: (metrics: MetricEntry[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">오버라이드 지표</span>
      {metrics.map((metric, index) => (
        <div key={index} className="flex gap-2">
          <input
            value={metric.key}
            onChange={(e) => {
              const next = [...metrics];
              next[index] = { ...metric, key: e.target.value };
              onChange(next);
            }}
            className="w-1/3 rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-1.5 text-sm"
            placeholder="지표명"
          />
          <input
            value={metric.value}
            onChange={(e) => {
              const next = [...metrics];
              next[index] = { ...metric, value: e.target.value };
              onChange(next);
            }}
            className="flex-1 rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-1.5 text-sm"
            placeholder="값 (예: 18%, 3x 개선)"
          />
          <button
            type="button"
            onClick={() => onChange(metrics.filter((_, i) => i !== index))}
            className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...metrics, { key: "", value: "" }])}
        className="w-fit rounded-lg border border-dashed border-black/20 px-3 py-1.5 text-xs text-black/60 hover:border-black/40 hover:text-black/80"
      >
        + 지표 추가
      </button>
    </div>
  );
}

// ── B8: 포맷된 Bullets 렌더 ──

function FormattedBullets({ json }: { json: unknown }) {
  const items = safeParseBullets(json);
  if (items.length === 0) return <p className="text-[11px] text-black/40">불릿 없음</p>;
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((item, i) => (
        <li key={i} className="text-[11px] text-black/70">{item}</li>
      ))}
    </ul>
  );
}

// ── B8: 포맷된 Metrics 렌더 ──

function FormattedMetrics({ json }: { json: unknown }) {
  const entries = safeParseMetrics(json);
  if (entries.length === 0) return <p className="text-[11px] text-black/40">지표 없음</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((entry, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2 py-0.5 text-[11px]"
        >
          <span className="font-medium text-black/70">{entry.key}</span>
          <span className="text-black/50">{entry.value}</span>
        </span>
      ))}
    </div>
  );
}

// ── B8: 포맷된 TechTags 렌더 ──

function FormattedTechTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <p className="text-[11px] text-black/40">태그 없음</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-200"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ── B9: 공유 링크 관리 컴포넌트 ──

function ShareLinksSection({ resumeId }: { resumeId: string }) {
  const [links, setLinks] = useState<ShareLinkDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadLinks() {
    const response = await fetch(`/api/app/resumes/${resumeId}/share-links`);
    const parsed = await parseApiResponse<ShareLinkDto[]>(response);
    if (parsed.data) {
      setLinks(parsed.data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    async function fetchLinks() {
      const response = await fetch(`/api/app/resumes/${resumeId}/share-links`);
      const parsed = await parseApiResponse<ShareLinkDto[]>(response);
      if (!mounted) return;
      if (parsed.data) {
        setLinks(parsed.data);
      }
      setIsLoading(false);
    }
    void fetchLinks();
    return () => { mounted = false; };
  }, [resumeId]);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    const response = await fetch(`/api/app/resumes/${resumeId}/share-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const parsed = await parseApiResponse<ShareLinkDto>(response);
    if (parsed.error) {
      setError(parsed.error);
    } else {
      await loadLinks();
    }
    setIsCreating(false);
  }

  async function handleRevoke(linkId: string) {
    setRevokingId(linkId);
    setError(null);
    const response = await fetch(`/api/app/resumes/${resumeId}/share-links`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareLinkId: linkId }),
    });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
    } else {
      await loadLinks();
    }
    setRevokingId(null);
  }

  function handleCopy(token: string) {
    const url = `${window.location.origin}/resume/share/${token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  const activeLinks = links.filter((l) => !l.isRevoked);
  const revokedLinks = links.filter((l) => l.isRevoked);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">공유 링크</h3>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={isCreating}
          className="rounded-lg border border-cyan-600/30 px-3 py-1.5 text-xs text-cyan-800 disabled:opacity-60"
        >
          {isCreating ? "생성 중..." : "새 공유 링크 생성"}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : null}

      {isLoading ? (
        <p className="text-xs text-black/50">불러오는 중...</p>
      ) : activeLinks.length === 0 && revokedLinks.length === 0 ? (
        <p className="text-xs text-black/50">생성된 공유 링크가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {activeLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2"
            >
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                활성
              </span>
              <code className="flex-1 truncate text-xs text-black/60">
                /resume/share/{link.token}
              </code>
              <span className="text-[10px] text-black/40">
                {new Date(link.createdAt).toLocaleDateString("ko-KR")}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(link.token)}
                className="rounded-md border border-black/15 px-2 py-1 text-[10px] text-black/70 hover:bg-black/5"
              >
                {copiedToken === link.token ? "복사됨!" : "URL 복사"}
              </button>
              <button
                type="button"
                onClick={() => void handleRevoke(link.id)}
                disabled={revokingId === link.id}
                className="rounded-md border border-rose-200 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                {revokingId === link.id ? "취소 중..." : "취소"}
              </button>
            </div>
          ))}
          {revokedLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-2 opacity-60"
            >
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-medium text-black/50">
                취소됨
              </span>
              <code className="flex-1 truncate text-xs text-black/40">
                /resume/share/{link.token}
              </code>
              <span className="text-[10px] text-black/40">
                {new Date(link.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    const parsed =
      await parseApiResponse<Array<{ id: string; company: string; role: string }>>(response);
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

    setSavingItemId(itemId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/resumes/${resume.id}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experienceId: editor.experienceId,
        sortOrder: editor.sortOrder,
        overrideBulletsJson: bulletsToJson(editor.bullets),
        overrideMetricsJson: metricsToJson(editor.metrics),
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
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">이력서 편집</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/resumes"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
          >
            목록으로
          </Link>
          <button
            type="button"
            onClick={() => void handleDeleteResume()}
            disabled={isDeletingResume || isLoading}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700 disabled:opacity-60"
          >
            {isDeletingResume ? "삭제 중..." : "이력서 삭제"}
          </button>
        </div>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <h2 className="text-lg font-semibold">이력서 기본 정보</h2>
        {isLoading || !form ? (
          <p className="mt-4 text-sm text-black/60">이력서를 불러오는 중입니다.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span>제목</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                }
                className="rounded-lg border border-black/15 bg-white px-3 py-2"
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
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
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
                    setForm((prev) =>
                      prev ? { ...prev, targetCompany: event.target.value } : prev,
                    )
                  }
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>직무</span>
                <input
                  value={form.targetRole}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, targetRole: event.target.value } : prev))
                  }
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>레벨</span>
                <input
                  value={form.level}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, level: event.target.value } : prev))
                  }
                  className="rounded-lg border border-black/15 bg-white px-3 py-2"
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
                className="min-h-36 rounded-lg border border-black/15 bg-white px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleSaveResume()}
              disabled={isSavingResume}
              className="w-fit rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSavingResume ? "저장 중..." : "이력서 저장"}
            </button>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <h2 className="text-lg font-semibold">경력 항목 추가</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_120px]">
          <select
            value={createItem.experienceId}
            onChange={(event) =>
              setCreateItem((prev) => ({ ...prev, experienceId: event.target.value }))
            }
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
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
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleCreateItem()}
            disabled={isCreatingItem || !createItem.experienceId}
            className="rounded-lg border border-cyan-600/30 px-3 py-2 text-sm text-cyan-800 disabled:opacity-60"
          >
            {isCreatingItem ? "추가 중..." : "항목 추가"}
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <h2 className="text-lg font-semibold">이력서 항목</h2>
        {isLoading || !resume ? (
          <p className="mt-4 text-sm text-black/60">이력서 항목을 불러오는 중입니다.</p>
        ) : resume.items.length === 0 ? (
          <p className="mt-4 text-sm text-black/60">추가된 항목이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-black/60">
              항목 카드를 드래그해서 순서를 변경할 수 있습니다.
            </p>
            {isReorderingItems ? (
              <p className="text-xs text-cyan-800">순서를 저장하는 중입니다.</p>
            ) : null}
            {outdatedItemCount > 0 ? (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                원본 Experience가 변경된 항목이 {outdatedItemCount}개 있습니다. 필요한 항목을 확인
                후 저장해 동기화 상태를 맞춰주세요.
              </p>
            ) : null}
            {resume.items.map((item) => {
              const editor = itemEditors[item.id] ?? {
                experienceId: item.experienceId,
                sortOrder: item.sortOrder,
                bullets: parseBulletsFromJson(item.overrideBulletsJson),
                metrics: parseMetricsFromJson(item.overrideMetricsJson),
                overrideTechTagsText: item.overrideTechTags.join(", "),
                notes: item.notes ?? "",
              };
              const syncStatus = getResumeItemSyncStatus(item.updatedAt, item.experience.updatedAt);
              const syncBadgeText = getResumeItemSyncBadgeText(syncStatus);
              const syncBadgeClassName =
                syncStatus === "OUTDATED"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : syncStatus === "SYNCED"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-black/15 bg-black/5 text-black/70";
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
                  className={`rounded-xl border bg-white p-4 transition ${
                    draggingItemId === item.id
                      ? "border-cyan-600/50"
                      : "border-black/10 hover:border-cyan-600/40"
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

                  {/* 상단: 경력 선택 + 순서 + 태그 + 저장/삭제 */}
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_1fr_80px_80px]">
                    <select
                      value={editor.experienceId}
                      onChange={(event) =>
                        setItemEditors((prev) => ({
                          ...prev,
                          [item.id]: { ...editor, experienceId: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-2 text-sm"
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
                      className="rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-2 text-sm"
                    />
                    <input
                      value={editor.overrideTechTagsText}
                      onChange={(event) =>
                        setItemEditors((prev) => ({
                          ...prev,
                          [item.id]: { ...editor, overrideTechTagsText: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-2 text-sm"
                      placeholder="기술 태그(콤마 구분)"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveItem(item.id)}
                      disabled={savingItemId === item.id || isReorderingItems}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-700 disabled:opacity-60"
                    >
                      {savingItemId === item.id ? "저장..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteItem(item.id)}
                      disabled={deletingItemId === item.id || isReorderingItems}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:opacity-60"
                    >
                      {deletingItemId === item.id ? "삭제..." : "삭제"}
                    </button>
                  </div>

                  {/* B6: Bullets 구조화 편집기 */}
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <BulletsEditor
                      bullets={editor.bullets}
                      onChange={(bullets) =>
                        setItemEditors((prev) => ({
                          ...prev,
                          [item.id]: { ...editor, bullets },
                        }))
                      }
                    />
                    {/* B7: Metrics 구조화 편집기 */}
                    <MetricsEditor
                      metrics={editor.metrics}
                      onChange={(metrics) =>
                        setItemEditors((prev) => ({
                          ...prev,
                          [item.id]: { ...editor, metrics },
                        }))
                      }
                    />
                  </div>

                  <textarea
                    value={editor.notes}
                    onChange={(event) =>
                      setItemEditors((prev) => ({
                        ...prev,
                        [item.id]: { ...editor, notes: event.target.value },
                      }))
                    }
                    className="mt-3 min-h-20 w-full rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-2 text-sm"
                    placeholder="항목 메모"
                  />

                  {/* B8: 포맷된 원본/수정본 비교 */}
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-black/10 bg-[#f5f5f0] p-3">
                      <p className="text-xs font-semibold text-black/70">원본</p>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-black/50">불릿</p>
                          <FormattedBullets json={comparison.original.bulletsJson} />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-black/50">지표</p>
                          <FormattedMetrics json={comparison.original.metricsJson} />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-black/50">태그</p>
                          <FormattedTechTags tags={comparison.original.techTags} />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-3">
                      <p className="text-xs font-semibold text-cyan-800">수정본</p>
                      <p className="mt-1 text-[11px] text-cyan-700">
                        bullets {comparison.hasOverride.bullets ? "override" : "original"} / metrics{" "}
                        {comparison.hasOverride.metrics ? "override" : "original"} / tags{" "}
                        {comparison.hasOverride.techTags ? "override" : "original"}
                      </p>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-cyan-600">불릿</p>
                          <FormattedBullets json={comparison.resolved.bulletsJson} />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-cyan-600">지표</p>
                          <FormattedMetrics json={comparison.resolved.metricsJson} />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-medium text-cyan-600">태그</p>
                          <FormattedTechTags tags={comparison.resolved.techTags} />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* B9: 공유 링크 관리 섹션 */}
      {resumeId ? (
        <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
          <ShareLinksSection resumeId={resumeId} />
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">프리뷰</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleLoadPreview()}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm text-black/75"
            >
              프리뷰 갱신
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isDownloadingPdf}
              className="rounded-lg border border-cyan-600/30 px-3 py-2 text-sm text-cyan-800 disabled:opacity-60"
            >
              {isDownloadingPdf ? "PDF 준비 중..." : "PDF 다운로드"}
            </button>
          </div>
        </div>

        {/* B8: 포맷된 프리뷰 렌더링 */}
        {!preview ? (
          <p className="mt-4 text-sm text-black/60">
            프리뷰를 불러오면 이력서 결과를 확인할 수 있습니다.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-baseline gap-3">
              <p className="text-sm font-medium text-black/80">
                {preview.resume.title}
              </p>
              <span className="text-xs text-black/50">
                {preview.items.length}개 항목
              </span>
            </div>
            {preview.resume.summaryMd ? (
              <p className="whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-3 text-sm text-black/70">
                {preview.resume.summaryMd}
              </p>
            ) : null}
            {preview.items.map((item) => (
              <article
                key={item.itemId}
                className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold text-black/60">
                    {item.sortOrder}
                  </span>
                  <p className="text-sm font-medium">
                    {item.experience.company} / {item.experience.role}
                  </p>
                </div>
                {item.experience.summary ? (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-black/60">
                    {item.experience.summary}
                  </p>
                ) : null}
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-black/50">핵심 성과</p>
                    <FormattedBullets json={item.resolvedBulletsJson} />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-black/50">핵심 지표</p>
                    <FormattedMetrics json={item.resolvedMetricsJson} />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-black/50">기술 스택</p>
                    <FormattedTechTags tags={item.resolvedTechTags} />
                  </div>
                </div>
                {item.notes ? (
                  <p className="mt-2 border-t border-black/5 pt-2 text-xs text-black/50">
                    메모: {item.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
