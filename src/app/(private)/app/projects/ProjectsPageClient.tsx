"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerProjectDto } from "@/app/(private)/app/_lib/server-serializers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type VisibilityFilter = "ALL" | Visibility;
type FeaturedFilter = "ALL" | "FEATURED" | "NORMAL";
type SortOption = "UPDATED_DESC" | "UPDATED_ASC" | "TITLE_ASC" | "TITLE_DESC";

type ProjectsPageClientProps = {
  initialProjects: SerializedOwnerProjectDto[];
};

function formatUpdatedAtLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }

  return parsed.toISOString().slice(0, 10);
}

export function ProjectsPageClient({ initialProjects }: ProjectsPageClientProps) {
  const [projects, setProjects] = useState<SerializedOwnerProjectDto[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("ALL");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("UPDATED_DESC");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] =
    useState<SerializedOwnerProjectDto | null>(null);
  const toast = useToast();

  async function requestProjects() {
    const response = await fetch("/api/app/projects", { method: "GET" });
    return parseApiResponse<SerializedOwnerProjectDto[]>(response);
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

  async function handleDeleteConfirmed() {
    if (!pendingDeleteProject) {
      return;
    }

    setDeletingId(pendingDeleteProject.id);
    setError(null);

    const response = await fetch(`/api/app/projects/${pendingDeleteProject.id}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setDeletingId(null);
      return;
    }

    toast.success("프로젝트를 삭제했습니다.");
    setDeletingId(null);
    setPendingDeleteProject(null);
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
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
          <h1 className="mt-2 text-3xl font-semibold">프로젝트 관리</h1>
          <p className="mt-3 text-sm text-black/65">
            목록에서 검색 조건을 조정하고, 생성/편집 페이지로 이동해 작업합니다.
          </p>
        </div>
        <Link
          href="/app/projects/new"
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
        >
          새 프로젝트
        </Link>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">정렬/필터</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span>공개 상태</span>
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
              className="rounded-lg border border-black/15 bg-white px-3 py-2"
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
              className="rounded-lg border border-black/15 bg-white px-3 py-2"
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
              className="rounded-lg border border-black/15 bg-white px-3 py-2"
            >
              <option value="UPDATED_DESC">최근 수정 순</option>
              <option value="UPDATED_ASC">오래된 수정 순</option>
              <option value="TITLE_ASC">제목 오름차순</option>
              <option value="TITLE_DESC">제목 내림차순</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <ErrorBanner message={error} className="mt-6" /> : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">프로젝트 목록</h2>

        {isLoading ? (
          <LoadingBlock message="프로젝트 목록을 불러오는 중입니다." className="mt-4" />
        ) : filteredProjects.length === 0 ? (
          <EmptyBlock message="조건에 맞는 프로젝트가 없습니다." className="mt-4" />
        ) : (
          <div className="mt-4 space-y-3">
            {filteredProjects.map((project) => (
              <article key={project.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-black/50">slug: {project.slug}</p>
                    <h3 className="mt-1 text-lg font-semibold">{project.title}</h3>
                    <p className="mt-2 text-xs text-black/60">
                      수정일 {formatUpdatedAtLabel(project.updatedAt)} · 공개상태: {project.visibility} ·
                      {project.isFeatured ? " 대표 프로젝트" : " 일반 프로젝트"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="rounded-lg border border-black/20 px-3 py-2 text-sm text-black/85"
                    >
                      공개 보기
                    </Link>
                    <Link
                      href={`/app/projects/${project.id}/edit`}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800"
                    >
                      편집
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteProject(project)}
                      disabled={deletingId === project.id}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800 disabled:opacity-60"
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

      <ConfirmDialog
        open={Boolean(pendingDeleteProject)}
        title="프로젝트를 삭제할까요?"
        description={
          pendingDeleteProject
            ? `"${pendingDeleteProject.title}" 프로젝트를 삭제하면 복구할 수 없습니다.`
            : "프로젝트를 삭제합니다."
        }
        confirmText="삭제"
        cancelText="취소"
        isDanger
        isLoading={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) {
            setPendingDeleteProject(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
      />
    </div>
  );
}
