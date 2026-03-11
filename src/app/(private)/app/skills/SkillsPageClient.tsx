"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerSkillDto } from "@/app/(private)/app/_lib/server-serializers";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type Visibility = "PUBLIC" | "PRIVATE";

type SkillEditor = {
  name: string;
  category: string;
  level: string;
  visibility: Visibility;
};

type SkillsPageClientProps = {
  initialSkills: SerializedOwnerSkillDto[];
};

const DEFAULT_CREATE_FORM = {
  name: "",
  category: "",
  level: "",
  visibility: "PUBLIC" as Visibility,
};

function createEditor(item: SerializedOwnerSkillDto): SkillEditor {
  return {
    name: item.name,
    category: item.category ?? "",
    level: item.level !== null ? String(item.level) : "",
    visibility: item.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
  };
}

function buildEditors(items: SerializedOwnerSkillDto[]): Record<string, SkillEditor> {
  return items.reduce<Record<string, SkillEditor>>((acc, item) => {
    acc[item.id] = createEditor(item);
    return acc;
  }, {});
}

function groupByCategory(items: SerializedOwnerSkillDto[]): Map<string, SerializedOwnerSkillDto[]> {
  const map = new Map<string, SerializedOwnerSkillDto[]>();
  for (const item of items) {
    const key = item.category ?? "기타";
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

function extractCategories(items: SerializedOwnerSkillDto[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.category) {
      set.add(item.category);
    }
  }
  return Array.from(set).sort();
}

export function SkillsPageClient({ initialSkills }: SkillsPageClientProps) {
  const [skills, setSkills] = useState<SerializedOwnerSkillDto[]>(initialSkills);
  const [editors, setEditors] = useState<Record<string, SkillEditor>>(buildEditors(initialSkills));
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const categories = extractCategories(skills);
  const grouped = groupByCategory(skills);

  async function requestSkills() {
    const response = await fetch("/api/app/skills", { method: "GET" });
    return parseApiResponse<SerializedOwnerSkillDto[]>(response);
  }

  function applySkills(items: SerializedOwnerSkillDto[]) {
    setSkills(items);
    setEditors(buildEditors(items));
  }

  async function reloadSkills() {
    setIsLoading(true);
    setError(null);
    const parsed = await requestSkills();

    if (parsed.error) {
      setError(parsed.error);
      setIsLoading(false);
      return;
    }

    applySkills(parsed.data ?? []);
    setIsLoading(false);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: createForm.name,
      visibility: createForm.visibility,
    };

    if (createForm.category.trim()) {
      payload.category = createForm.category.trim();
    }

    if (createForm.level) {
      payload.level = Number(createForm.level);
    }

    const response = await fetch("/api/app/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const parsed = await parseApiResponse<SerializedOwnerSkillDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setIsCreating(false);
      return;
    }

    setCreateForm(DEFAULT_CREATE_FORM);
    toast.success("기술을 추가했습니다.");
    setIsCreating(false);
    await reloadSkills();
  }

  async function handleUpdate(skillId: string) {
    const editor = editors[skillId];
    if (!editor) {
      return;
    }

    setError(null);

    const payload: Record<string, unknown> = {
      name: editor.name,
      visibility: editor.visibility,
    };

    if (editor.category.trim()) {
      payload.category = editor.category.trim();
    } else {
      payload.category = null;
    }

    if (editor.level) {
      payload.level = Number(editor.level);
    } else {
      payload.level = null;
    }

    const response = await fetch(`/api/app/skills/${skillId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const parsed = await parseApiResponse<SerializedOwnerSkillDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    toast.success("기술을 수정했습니다.");
    await reloadSkills();
  }

  async function handleDelete(skillId: string) {
    setError(null);

    const response = await fetch(`/api/app/skills/${skillId}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    toast.success("기술을 삭제했습니다.");
    await reloadSkills();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
        <h1 className="mt-2 text-3xl font-semibold">기술 스택</h1>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">새 기술 추가</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_100px_120px_auto]">
          <input
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="기술명 (예: React, TypeScript)"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <div>
            <input
              list="category-suggestions"
              value={createForm.category}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, category: event.target.value }))
              }
              placeholder="카테고리 (예: Frontend)"
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            />
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <select
            value={createForm.level}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, level: event.target.value }))
            }
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">레벨</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <select
            value={createForm.visibility}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, visibility: event.target.value as Visibility }))
            }
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          >
            <option value="PUBLIC">PUBLIC</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isCreating ? "추가 중..." : "추가"}
          </button>
        </form>
      </section>

      {error ? <ErrorBanner message={error} className="mt-6" /> : null}

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">기술 목록</h2>

        {isLoading ? (
          <LoadingBlock message="기술 목록을 불러오는 중입니다." className="mt-4" />
        ) : skills.length === 0 ? (
          <EmptyBlock message="등록된 기술이 없습니다." className="mt-4" />
        ) : (
          <div className="mt-4 space-y-6">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-semibold text-black/60">{category}</h3>
                <div className="space-y-2">
                  {items.map((skill) => {
                    const editor = editors[skill.id] ?? createEditor(skill);
                    return (
                      <article
                        key={skill.id}
                        className="grid items-center gap-2 rounded-xl border border-black/10 bg-[#faf9f6] p-3 md:grid-cols-[1fr_1fr_80px_100px_60px_60px]"
                      >
                        <input
                          value={editor.name}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, name: event.target.value },
                            }))
                          }
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        />
                        <input
                          list="category-suggestions-edit"
                          value={editor.category}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, category: event.target.value },
                            }))
                          }
                          placeholder="카테고리"
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        />
                        <select
                          value={editor.level}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, level: event.target.value },
                            }))
                          }
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                        <select
                          value={editor.visibility}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, visibility: event.target.value as Visibility },
                            }))
                          }
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        >
                          <option value="PUBLIC">PUBLIC</option>
                          <option value="PRIVATE">PRIVATE</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleUpdate(skill.id)}
                          className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(skill.id)}
                          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800"
                        >
                          삭제
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <datalist id="category-suggestions-edit">
          {categories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </section>
    </div>
  );
}
