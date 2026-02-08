"use client";

import { FormEvent, useEffect, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

type OwnerProjectDto = {
  id: string;
  slug: string;
  title: string;
  visibility: Visibility;
  isFeatured: boolean;
  contentMd: string;
  description: string | null;
  updatedAt: string;
};

type ProjectEditor = {
  title: string;
  visibility: Visibility;
  isFeatured: boolean;
};

const DEFAULT_CREATE_FORM = {
  title: "",
  slug: "",
  contentMd: "",
  visibility: "PUBLIC" as Visibility,
  isFeatured: false,
};

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<OwnerProjectDto[]>([]);
  const [editors, setEditors] = useState<Record<string, ProjectEditor>>({});
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function requestProjects() {
    const response = await fetch("/api/app/projects", { method: "GET" });
    return parseApiResponse<OwnerProjectDto[]>(response);
  }

  function applyProjects(items: OwnerProjectDto[]) {
    setProjects(items);
    setEditors(
      items.reduce<Record<string, ProjectEditor>>((acc, item) => {
        acc[item.id] = {
          title: item.title,
          visibility: item.visibility,
          isFeatured: item.isFeatured,
        };
        return acc;
      }, {}),
    );
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

    applyProjects(parsed.data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialProjects() {
      const parsed = await requestProjects();

      if (!isMounted) {
        return;
      }

      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }

      applyProjects(parsed.data ?? []);
      setIsLoading(false);
    }

    void loadInitialProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: createForm.title,
      slug: createForm.slug || undefined,
      contentMd: createForm.contentMd,
      visibility: createForm.visibility,
      isFeatured: createForm.isFeatured,
    };

    const response = await fetch("/api/app/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const parsed = await parseApiResponse<OwnerProjectDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      setIsCreating(false);
      return;
    }

    setCreateForm(DEFAULT_CREATE_FORM);
    setMessage("프로젝트가 생성되었습니다.");
    setIsCreating(false);
    await reloadProjects();
  }

  async function handleUpdate(projectId: string) {
    const editor = editors[projectId];
    if (!editor) {
      return;
    }

    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editor),
    });
    const parsed = await parseApiResponse<OwnerProjectDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    setMessage("프로젝트가 수정되었습니다.");
    await reloadProjects();
  }

  async function handleDelete(projectId: string) {
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/app/projects/${projectId}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);

    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    setMessage("프로젝트가 삭제되었습니다.");
    await reloadProjects();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">관리</p>
        <h1 className="mt-2 text-3xl font-semibold">프로젝트 관리</h1>
      </header>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">새 프로젝트 생성</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={createForm.title}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="제목"
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
          />
          <input
            value={createForm.slug}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))}
            placeholder="슬러그 (선택)"
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
          />
          <select
            value={createForm.visibility}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, visibility: event.target.value as Visibility }))
            }
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
          >
            <option value="PUBLIC">PUBLIC</option>
            <option value="UNLISTED">UNLISTED</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createForm.isFeatured}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, isFeatured: event.target.checked }))
              }
            />
            <span>대표 프로젝트</span>
          </label>
          <textarea
            value={createForm.contentMd}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, contentMd: event.target.value }))
            }
            placeholder="본문 Markdown"
            className="min-h-28 rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60 md:col-span-2 md:justify-self-start"
          >
            {isCreating ? "생성 중..." : "프로젝트 생성"}
          </button>
        </form>
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
        ) : projects.length === 0 ? (
          <p className="mt-4 text-sm text-white/65">등록된 프로젝트가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {projects.map((project) => {
              const editor = editors[project.id] ?? {
                title: project.title,
                visibility: project.visibility,
                isFeatured: project.isFeatured,
              };

              return (
                <article key={project.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/50">slug: {project.slug}</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-[1.4fr_180px_120px_80px_80px]">
                    <input
                      value={editor.title}
                      onChange={(event) =>
                        setEditors((prev) => ({
                          ...prev,
                          [project.id]: { ...editor, title: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
                    />
                    <select
                      value={editor.visibility}
                      onChange={(event) =>
                        setEditors((prev) => ({
                          ...prev,
                          [project.id]: {
                            ...editor,
                            visibility: event.target.value as Visibility,
                          },
                        }))
                      }
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="UNLISTED">UNLISTED</option>
                      <option value="PRIVATE">PRIVATE</option>
                    </select>
                    <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editor.isFeatured}
                        onChange={(event) =>
                          setEditors((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...editor,
                              isFeatured: event.target.checked,
                            },
                          }))
                        }
                      />
                      대표
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleUpdate(project.id)}
                      className="rounded-lg border border-emerald-400/50 px-3 py-2 text-sm text-emerald-200"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project.id)}
                      className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm text-rose-200"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
