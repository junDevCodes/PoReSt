"use client";

import { useEffect, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type DomainType = "PROJECT" | "EXPERIENCE" | "RESUME" | "NOTE" | "BLOG_POST";

type EntityOption = {
  id: string;
  label: string;
};

type DomainLinkDto = {
  id: string;
  sourceType: DomainType;
  sourceId: string;
  targetType: DomainType;
  targetId: string;
  context: string | null;
  updatedAt: string;
};

type DomainOptionsState = Record<DomainType, EntityOption[]>;

const DOMAIN_TYPE_LABEL: Record<DomainType, string> = {
  PROJECT: "프로젝트",
  EXPERIENCE: "경력",
  RESUME: "이력서",
  NOTE: "노트",
  BLOG_POST: "블로그",
};

const EMPTY_OPTIONS: DomainOptionsState = {
  PROJECT: [],
  EXPERIENCE: [],
  RESUME: [],
  NOTE: [],
  BLOG_POST: [],
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function findLabel(options: DomainOptionsState, type: DomainType, id: string): string {
  const item = options[type].find((candidate) => candidate.id === id);
  return item ? item.label : `${DOMAIN_TYPE_LABEL[type]} (${id.slice(0, 8)})`;
}

export default function DomainLinksPage() {
  const [options, setOptions] = useState<DomainOptionsState>(EMPTY_OPTIONS);
  const [links, setLinks] = useState<DomainLinkDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceType, setSourceType] = useState<DomainType>("PROJECT");
  const [sourceId, setSourceId] = useState("");
  const [targetType, setTargetType] = useState<DomainType>("NOTE");
  const [targetId, setTargetId] = useState("");
  const [context, setContext] = useState("");

  const sourceOptions = useMemo(() => options[sourceType], [options, sourceType]);
  const targetOptions = useMemo(() => options[targetType], [options, targetType]);
  const effectiveSourceId =
    sourceOptions.find((option) => option.id === sourceId)?.id ?? sourceOptions[0]?.id ?? "";
  const effectiveTargetId =
    targetOptions.find((option) => option.id === targetId)?.id ?? targetOptions[0]?.id ?? "";

  async function loadEntityOptions() {
    const [
      projectResponse,
      experienceResponse,
      resumeResponse,
      noteResponse,
      blogResponse,
    ] = await Promise.all([
      fetch("/api/app/projects", { method: "GET" }),
      fetch("/api/app/experiences", { method: "GET" }),
      fetch("/api/app/resumes", { method: "GET" }),
      fetch("/api/app/notes", { method: "GET" }),
      fetch("/api/app/blog/posts", { method: "GET" }),
    ]);

    const [projects, experiences, resumes, notes, blogs] = await Promise.all([
      parseApiResponse<Array<{ id: string; title?: string }>>(projectResponse),
      parseApiResponse<Array<{ id: string; company?: string; role?: string }>>(experienceResponse),
      parseApiResponse<Array<{ id: string; title?: string }>>(resumeResponse),
      parseApiResponse<Array<{ id: string; title?: string }>>(noteResponse),
      parseApiResponse<Array<{ id: string; title?: string }>>(blogResponse),
    ]);

    if (projects.error || experiences.error || resumes.error || notes.error || blogs.error) {
      setError(
        projects.error ??
          experiences.error ??
          resumes.error ??
          notes.error ??
          blogs.error ??
          "엔티티 목록을 불러오지 못했습니다.",
      );
      return;
    }

    setOptions({
      PROJECT: (projects.data ?? []).map((item) => ({
        id: item.id,
        label: item.title?.trim() ? item.title : `프로젝트 (${item.id.slice(0, 8)})`,
      })),
      EXPERIENCE: (experiences.data ?? []).map((item) => ({
        id: item.id,
        label:
          [item.company, item.role].filter((value) => Boolean(value)).join(" / ") ||
          `경력 (${item.id.slice(0, 8)})`,
      })),
      RESUME: (resumes.data ?? []).map((item) => ({
        id: item.id,
        label: item.title?.trim() ? item.title : `이력서 (${item.id.slice(0, 8)})`,
      })),
      NOTE: (notes.data ?? []).map((item) => ({
        id: item.id,
        label: item.title?.trim() ? item.title : `노트 (${item.id.slice(0, 8)})`,
      })),
      BLOG_POST: (blogs.data ?? []).map((item) => ({
        id: item.id,
        label: item.title?.trim() ? item.title : `블로그 (${item.id.slice(0, 8)})`,
      })),
    });
  }

  async function loadLinks() {
    const response = await fetch("/api/app/domain-links?limit=100", { method: "GET" });
    const parsed = await parseApiResponse<DomainLinkDto[]>(response);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setLinks(parsed.data ?? []);
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setIsLoading(true);
      setError(null);

      await loadEntityOptions();
      await loadLinks();

      if (mounted) {
        setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleCreateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveSourceId || !effectiveTargetId) {
      setError("source/target 엔티티를 모두 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/app/domain-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceType,
        sourceId: effectiveSourceId,
        targetType,
        targetId: effectiveTargetId,
        context: context.trim() ? context.trim() : null,
      }),
    });
    const parsed = await parseApiResponse<DomainLinkDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setIsSubmitting(false);
      return;
    }

    setContext("");
    await loadLinks();
    setIsSubmitting(false);
  }

  async function handleDeleteLink(linkId: string) {
    setError(null);
    const response = await fetch(`/api/app/domain-links/${linkId}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    await loadLinks();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Graph</p>
        <h1 className="mt-2 text-3xl font-semibold">Cross-domain Links</h1>
        <p className="mt-3 text-sm text-white/65">
          프로젝트/경력/이력서/노트/블로그 간 연결을 생성하고 관리합니다.
        </p>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">링크 생성</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={(event) => void handleCreateLink(event)}>
          <label className="flex flex-col gap-2 text-sm text-white/80">
            Source 타입
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as DomainType)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white"
            >
              {Object.entries(DOMAIN_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Source 엔티티
            <select
              value={effectiveSourceId}
              onChange={(event) => setSourceId(event.target.value)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white"
              disabled={sourceOptions.length === 0}
            >
              {sourceOptions.length === 0 ? (
                <option value="">선택 가능한 항목 없음</option>
              ) : (
                sourceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Target 타입
            <select
              value={targetType}
              onChange={(event) => setTargetType(event.target.value as DomainType)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white"
            >
              {Object.entries(DOMAIN_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Target 엔티티
            <select
              value={effectiveTargetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white"
              disabled={targetOptions.length === 0}
            >
              {targetOptions.length === 0 ? (
                <option value="">선택 가능한 항목 없음</option>
              ) : (
                targetOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80 md:col-span-2">
            연결 설명 (선택)
            <input
              value={context}
              onChange={(event) => setContext(event.target.value)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white"
              placeholder="예: 프로젝트 구현 배경 노트"
              maxLength={200}
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {isSubmitting ? "생성 중..." : "링크 생성"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">링크 목록</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-white/60">링크를 불러오는 중입니다.</p>
        ) : links.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">등록된 링크가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {links.map((link) => (
              <article key={link.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">
                  {DOMAIN_TYPE_LABEL[link.sourceType]}: {findLabel(options, link.sourceType, link.sourceId)}
                </p>
                <p className="mt-1 text-sm text-white/75">
                  → {DOMAIN_TYPE_LABEL[link.targetType]}: {findLabel(options, link.targetType, link.targetId)}
                </p>
                {link.context ? <p className="mt-2 text-xs text-white/65">{link.context}</p> : null}
                <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                  <span>수정: {formatDate(link.updatedAt)}</span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteLink(link.id)}
                    className="rounded border border-white/25 px-2 py-1 text-white/80 hover:bg-white/10"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
