"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerExperienceDto } from "@/app/(private)/app/_lib/server-serializers";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

type MetricItem = { label: string; value: string };

type ExperienceEditor = {
  role: string;
  visibility: Visibility;
  isFeatured: boolean;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  summary: string;
  bulletsText: string;
  metrics: MetricItem[];
  techTagsText: string;
  expanded: boolean;
};

type ExperiencesPageClientProps = {
  initialExperiences: SerializedOwnerExperienceDto[];
};

const DEFAULT_CREATE_FORM = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  visibility: "PUBLIC" as Visibility,
  isFeatured: false,
  isCurrent: false,
};

function parseBulletsToText(json: unknown): string {
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === "string").join("\n");
  }
  return "";
}

function parseMetricsToList(json: unknown): MetricItem[] {
  if (!Array.isArray(json)) {
    return [];
  }
  return json.filter(
    (item): item is MetricItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).label === "string" &&
      typeof (item as Record<string, unknown>).value === "string",
  );
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function createEditor(item: SerializedOwnerExperienceDto): ExperienceEditor {
  return {
    role: item.role,
    visibility: item.visibility,
    isFeatured: item.isFeatured,
    isCurrent: item.isCurrent,
    startDate: toDateInputValue(item.startDate),
    endDate: toDateInputValue(item.endDate),
    summary: item.summary ?? "",
    bulletsText: parseBulletsToText(item.bulletsJson),
    metrics: parseMetricsToList(item.metricsJson),
    techTagsText: item.techTags.join(", "),
    expanded: false,
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
      endDate:
        createForm.endDate && !createForm.isCurrent
          ? new Date(`${createForm.endDate}T00:00:00.000Z`).toISOString()
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

    const bulletsJson = editor.bulletsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const metricsJson = editor.metrics.filter((m) => m.label.trim() && m.value.trim());
    const techTags = editor.techTagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const response = await fetch(`/api/app/experiences/${experienceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: editor.role,
        visibility: editor.visibility,
        isFeatured: editor.isFeatured,
        isCurrent: editor.isCurrent,
        startDate: editor.startDate
          ? new Date(`${editor.startDate}T00:00:00.000Z`).toISOString()
          : undefined,
        endDate:
          editor.endDate && !editor.isCurrent
            ? new Date(`${editor.endDate}T00:00:00.000Z`).toISOString()
            : null,
        summary: editor.summary || null,
        bulletsJson: bulletsJson.length > 0 ? bulletsJson : null,
        metricsJson: metricsJson.length > 0 ? metricsJson : null,
        techTags,
      }),
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
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">시작일</label>
            <input
              type="date"
              value={createForm.startDate}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">종료일</label>
            <input
              type="date"
              value={createForm.isCurrent ? "" : createForm.endDate}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, endDate: event.target.value }))
              }
              disabled={createForm.isCurrent}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm disabled:opacity-40"
            />
          </div>
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
                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_120px_120px_140px_80px_80px_72px_72px]">
                    <input
                      value={editor.role}
                      onChange={(event) =>
                        setEditors((prev) => ({
                          ...prev,
                          [experience.id]: { ...editor, role: event.target.value },
                        }))
                      }
                      placeholder="역할"
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={editor.startDate}
                      onChange={(event) =>
                        setEditors((prev) => ({
                          ...prev,
                          [experience.id]: { ...editor, startDate: event.target.value },
                        }))
                      }
                      title="시작일"
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={editor.isCurrent ? "" : editor.endDate}
                      onChange={(event) =>
                        setEditors((prev) => ({
                          ...prev,
                          [experience.id]: { ...editor, endDate: event.target.value },
                        }))
                      }
                      disabled={editor.isCurrent}
                      title="종료일"
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm disabled:opacity-40"
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
                  <button
                    type="button"
                    onClick={() =>
                      setEditors((prev) => ({
                        ...prev,
                        [experience.id]: { ...editor, expanded: !editor.expanded },
                      }))
                    }
                    className="mt-2 text-xs text-black/50 hover:text-black"
                  >
                    {editor.expanded ? "▲ 상세 접기" : "▼ 상세 펼치기"}
                  </button>
                  {editor.expanded ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-black/60">요약</label>
                        <input
                          value={editor.summary}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [experience.id]: { ...editor, summary: event.target.value },
                            }))
                          }
                          placeholder="한 줄 요약"
                          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-black/60">기술 태그 (쉼표 구분)</label>
                        <input
                          value={editor.techTagsText}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [experience.id]: { ...editor, techTagsText: event.target.value },
                            }))
                          }
                          placeholder="React, TypeScript, PostgreSQL"
                          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-black/60">주요 업무 (줄바꿈 = 각 항목)</label>
                        <textarea
                          value={editor.bulletsText}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [experience.id]: { ...editor, bulletsText: event.target.value },
                            }))
                          }
                          rows={4}
                          placeholder={"결제 시스템 API 설계 및 구현\n팀 코드리뷰 주도 및 PR 처리 시간 단축"}
                          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-black/60">성과 지표</label>
                        {editor.metrics.map((metric, idx) => (
                          <div key={idx} className="mb-2 flex items-center gap-2">
                            <input
                              value={metric.label}
                              onChange={(event) => {
                                const next = [...editor.metrics];
                                next[idx] = { ...metric, label: event.target.value };
                                setEditors((prev) => ({
                                  ...prev,
                                  [experience.id]: { ...editor, metrics: next },
                                }));
                              }}
                              placeholder="라벨 (예: API 응답시간 개선)"
                              className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                            />
                            <input
                              value={metric.value}
                              onChange={(event) => {
                                const next = [...editor.metrics];
                                next[idx] = { ...metric, value: event.target.value };
                                setEditors((prev) => ({
                                  ...prev,
                                  [experience.id]: { ...editor, metrics: next },
                                }));
                              }}
                              placeholder="값 (예: 40%)"
                              className="w-32 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = editor.metrics.filter((_, i) => i !== idx);
                                setEditors((prev) => ({
                                  ...prev,
                                  [experience.id]: { ...editor, metrics: next },
                                }));
                              }}
                              className="text-xs text-rose-500 hover:text-rose-700"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setEditors((prev) => ({
                              ...prev,
                              [experience.id]: {
                                ...editor,
                                metrics: [...editor.metrics, { label: "", value: "" }],
                              },
                            }))
                          }
                          className="text-xs text-black/50 hover:text-black"
                        >
                          + 지표 추가
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
