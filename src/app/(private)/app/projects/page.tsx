"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type VisibilityFilter = "ALL" | Visibility;
type FeaturedFilter = "ALL" | "FEATURED" | "NORMAL";
type SortOption = "UPDATED_DESC" | "UPDATED_ASC" | "TITLE_ASC" | "TITLE_DESC";

type OwnerProjectDto = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  visibility: Visibility;
  isFeatured: boolean;
  updatedAt: string;
};

function formatUpdatedAtLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }

  return parsed.toISOString().slice(0, 10);
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<OwnerProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("ALL");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("UPDATED_DESC");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function requestProjects() {
    const response = await fetch("/api/app/projects", { method: "GET" });
    return parseApiResponse<OwnerProjectDto[]>(response);
  }

  async function reloadProjects() {
    setIsLoading(true);
    setError(null);
    const parsed = await requestProjects();
    if (parsed.error) {
      setError(parsed.error);
      setIsLoading(false);
      return;
    }

    setProjects(parsed.data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialProjects() {
      const parsed = await requestProjects();
      if (!mounted) {
        return;
      }

      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }

      setProjects(parsed.data ?? []);
      setIsLoading(false);
    }

    void loadInitialProjects();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(project: OwnerProjectDto) {
    const shouldDelete = confirm(`"${project.title}" 프로젝트를 삭제하시겠습니까?`);
    if (!shouldDelete) {
      return;
    }

    setDeletingId(project.id);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/projects/${project.id}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setDeletingId(null);
      return;
    }

    setMessage("프로젝트가 삭제되었습니다.");
    setDeletingId(null);
    await reloadProjects();
  }

  const filteredProjects = useMemo(() => {
    const visibilityMatched = projects.filter((project) => {
      if (visibilityFilter === "ALL") {
        return true;
      }
      return project.visibility === visibilityFilter;
    });

    const featuredMatched = visibilityMatched.filter((project) => {
      if (featuredFilter === "ALL") {
        return true;
      }
      if (featuredFilter === "FEATURED") {
        return project.isFeatured;
      }
      return !project.isFeatured;
    });

    return featuredMatched.sort((a, b) => {
      if (sortOption === "UPDATED_DESC") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortOption === "UPDATED_ASC") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sortOption === "TITLE_ASC") {
        return a.title.localeCompare(b.title, "ko");
      }
      return b.title.localeCompare(a.title, "ko");
    });
  }, [featuredFilter, projects, sortOption, visibilityFilter]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">프로젝트 관리</h1>
          <p className="mt-3 text-sm text-white/65">
            목록에서 검색 조건을 조정하고, 생성/편집 페이지로 이동해 작업합니다.
          </p>
        </div>
        <Link href="/app/projects/new" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
          새 프로젝트
        </Link>
      </header>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">정렬/필터</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span>공개 상태</span>
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            >
              <option value="ALL">전체</option>
              <option value="PUBLIC">PUBLIC</option>
              <option value="UNLISTED">UNLISTED</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>대표 여부</span>
            <select
              value={featuredFilter}
              onChange={(event) => setFeaturedFilter(event.target.value as FeaturedFilter)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            >
              <option value="ALL">전체</option>
              <option value="FEATURED">대표만</option>
              <option value="NORMAL">일반만</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>정렬 기준</span>
            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
            >
              <option value="UPDATED_DESC">최근 수정순</option>
              <option value="UPDATED_ASC">오래된 수정순</option>
              <option value="TITLE_ASC">제목 오름차순</option>
              <option value="TITLE_DESC">제목 내림차순</option>
            </select>
          </label>
        </div>
      </section>

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
        <h2 className="text-lg font-semibold">프로젝트 목록</h2>

        {isLoading ? (
          <p className="mt-4 text-sm text-white/65">프로젝트 목록을 불러오는 중입니다.</p>
        ) : filteredProjects.length === 0 ? (
          <p className="mt-4 text-sm text-white/65">조건에 맞는 프로젝트가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredProjects.map((project) => (
              <article key={project.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/50">slug: {project.slug}</p>
                    <h3 className="mt-1 text-lg font-semibold">{project.title}</h3>
                    <p className="mt-2 text-xs text-white/60">
                      수정일: {formatUpdatedAtLabel(project.updatedAt)} · 공개상태: {project.visibility} ·
                      {project.isFeatured ? " 대표 프로젝트" : " 일반 프로젝트"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/90"
                    >
                      공개 보기
                    </Link>
                    <Link
                      href={`/app/projects/${project.id}/edit`}
                      className="rounded-lg border border-emerald-400/50 px-3 py-2 text-sm text-emerald-200"
                    >
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm text-rose-200 disabled:opacity-60"
                    >
                      {deletingId === project.id ? "삭제 중..." : "삭제"}
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
