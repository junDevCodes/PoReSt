"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerExperienceDto } from "@/app/(private)/app/_lib/server-serializers";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

type ExperienceEditor = {
  role: string;
  visibility: Visibility;
  isFeatured: boolean;
  isCurrent: boolean;
};

type ExperiencesPageClientProps = {
  initialExperiences: SerializedOwnerExperienceDto[];
};

const DEFAULT_CREATE_FORM = {
  company: "",
  role: "",
  startDate: "",
  visibility: "PUBLIC" as Visibility,
  isFeatured: false,
  isCurrent: false,
};

function createEditor(item: SerializedOwnerExperienceDto): ExperienceEditor {
  return {
    role: item.role,
    visibility: item.visibility,
    isFeatured: item.isFeatured,
    isCurrent: item.isCurrent,
  };
}

function buildEditors(items: SerializedOwnerExperienceDto[]): Record<string, ExperienceEditor> {
  return items.reduce<Record<string, ExperienceEditor>>((acc, item) => {
    acc[item.id] = createEditor(item);
    return acc;
  }, {});
}

export function ExperiencesPageClient({ initialExperiences }: ExperiencesPageClientProps) {
  const [experiences, setExperiences] = useState<SerializedOwnerExperienceDto[]>(initialExperiences);
  const [editors, setEditors] = useState<Record<string, ExperienceEditor>>(
    buildEditors(initialExperiences),
  );
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function requestExperiences() {
    const response = await fetch("/api/app/experiences", { method: "GET" });
    return parseApiResponse<SerializedOwnerExperienceDto[]>(response);
  }

  function applyExperiences(items: SerializedOwnerExperienceDto[]) {
    setExperiences(items);
    setEditors(buildEditors(items));
  }

  async function reloadExperiences() {
    setIsLoading(true);
    setError(null);
    const parsed = await requestExperiences();

    if (parsed.error) {
      setError(parsed.error);
      setIsLoading(false);
      return;
    }

    applyExperiences(parsed.data ?? []);
    setIsLoading(false);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    const payload = {
      company: createForm.company,
      role: createForm.role,
      startDate: createForm.startDate
        ? new Date(`${createForm.startDate}T00:00:00.000Z`).toISOString()
        : null,
      visibility: createForm.visibility,
      isFeatured: createForm.isFeatured,
      isCurrent: createForm.isCurrent,
    };

    const response = await fetch("/api/app/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const parsed = await parseApiResponse<SerializedOwnerExperienceDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setIsCreating(false);
      return;
    }

    setCreateForm(DEFAULT_CREATE_FORM);
    toast.success("경력을 생성했습니다.");
    setIsCreating(false);
    await reloadExperiences();
  }

  async function handleUpdate(experienceId: string) {
    const editor = editors[experienceId];
    if (!editor) {
      return;
    }

    setError(null);

    const response = await fetch(`/api/app/experiences/${experienceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editor),
    });
    const parsed = await parseApiResponse<SerializedOwnerExperienceDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    toast.success("경력을 수정했습니다.");
    await reloadExperiences();
  }

  async function handleDelete(experienceId: string) {
    setError(null);

    const response = await fetch(`/api/app/experiences/${experienceId}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    toast.success("경력을 삭제했습니다.");
    await reloadExperiences();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
        <h1 className="mt-2 text-3xl font-semibold">경력 관리</h1>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">새 경력 생성</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={createForm.company}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, company: event.target.value }))
            }
            placeholder="회사명"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <input
            value={createForm.role}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value }))}
            placeholder="역할"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={createForm.startDate}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, startDate: event.target.value }))
            }
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <select
            value={createForm.visibility}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, visibility: event.target.value as Visibility }))
            }
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
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
            <span>대표 경력</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createForm.isCurrent}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, isCurrent: event.target.checked }))
              }
            />
            <span>현재 재직 중</span>
          </label>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2 md:justify-self-start"
          >
            {isCreating ? "생성 중..." : "경력 생성"}
          </button>
        </form>
      </section>

      {error ? <ErrorBanner message={error} className="mt-6" /> : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">경력 목록</h2>

        {isLoading ? (
          <LoadingBlock message="경력 목록을 불러오는 중입니다." className="mt-4" />
        ) : experiences.length === 0 ? (
          <EmptyBlock message="등록된 경력이 없습니다." className="mt-4" />
        ) : (
          <div className="mt-4 space-y-3">
            {experiences.map((experience) => {
              const editor = editors[experience.id] ?? createEditor(experience);

              return (
                <article key={experience.id} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                  <p className="text-sm font-medium">{experience.company}</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-[1.2fr_160px_96px_96px_80px_80px]">
                    <input
                      value={editor.role}
                      onChange={(event) =>
                        setEditors((prev) => ({
                          ...prev,
                          [experience.id]: { ...editor, role: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                    />
                    <select
                      value={editor.visibility}
                      onChange={(event) =>
                        setEditors((prev) => ({
                          ...prev,
                          [experience.id]: {
                            ...editor,
                            visibility: event.target.value as Visibility,
                          },
                        }))
                      }
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="UNLISTED">UNLISTED</option>
                      <option value="PRIVATE">PRIVATE</option>
                    </select>
                    <label className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editor.isFeatured}
                        onChange={(event) =>
                          setEditors((prev) => ({
                            ...prev,
                            [experience.id]: {
                              ...editor,
                              isFeatured: event.target.checked,
                            },
                          }))
                        }
                      />
                      대표
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editor.isCurrent}
                        onChange={(event) =>
                          setEditors((prev) => ({
                            ...prev,
                            [experience.id]: {
                              ...editor,
                              isCurrent: event.target.checked,
                            },
                          }))
                        }
                      />
                      현재
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleUpdate(experience.id)}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(experience.id)}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800"
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
    </div>
  );
}
