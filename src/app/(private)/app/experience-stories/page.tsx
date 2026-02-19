"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ApiErrorPayload =
  | string
  | {
      message?: string;
      fields?: Record<string, string>;
    };

type ApiEnvelope<T> = { data?: T; error?: ApiErrorPayload };

type ApiResult<T> = { data: T | null; error: string | null; fields: Record<string, string> | null };

async function parseApiResponse<T>(response: Response): Promise<ApiResult<T>> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    return { data: null, error: "응답 본문을 해석할 수 없습니다.", fields: null };
  }

  const envelope = (payload ?? {}) as ApiEnvelope<T>;
  if (response.ok) {
    return { data: envelope.data ?? null, error: null, fields: null };
  }

  if (typeof envelope.error === "string") {
    return { data: null, error: envelope.error, fields: null };
  }

  return {
    data: null,
    error: envelope.error?.message ?? `요청 처리에 실패했습니다. (HTTP ${response.status})`,
    fields: envelope.error?.fields ?? null,
  };
}

type OwnerExperienceDto = {
  id: string;
  company: string;
  role: string;
  updatedAt: string;
};

type OwnerExperienceStoryDto = {
  id: string;
  experienceId: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  updatedAt: string;
};

type ExperienceStoriesListResult = {
  items: OwnerExperienceStoryDto[];
  nextCursor: string | null;
};

const DEFAULT_CREATE_FORM = {
  experienceId: "",
  title: "",
  situation: "",
  task: "",
  action: "",
  result: "",
  tags: "",
};

type StoryEditor = {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string;
};

function normalizeTags(raw: string): string[] {
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export default function ExperienceStoriesPage() {
  const [experiences, setExperiences] = useState<OwnerExperienceDto[]>([]);
  const [stories, setStories] = useState<OwnerExperienceStoryDto[]>([]);
  const [editors, setEditors] = useState<Record<string, StoryEditor>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedExperience = useMemo(
    () => experiences.find((item) => item.id === selectedExperienceId) ?? null,
    [experiences, selectedExperienceId],
  );

  async function requestExperiences() {
    const response = await fetch("/api/app/experiences", { method: "GET" });
    return parseApiResponse<OwnerExperienceDto[]>(response);
  }

  async function requestStories() {
    const params = new URLSearchParams();
    if (selectedExperienceId) {
      params.set("experienceId", selectedExperienceId);
    }
    if (q.trim()) {
      params.set("q", q.trim());
    }
    const response = await fetch(`/api/app/experience-stories?${params.toString()}`, {
      method: "GET",
    });
    return parseApiResponse<ExperienceStoriesListResult>(response);
  }

  function applyStories(items: OwnerExperienceStoryDto[]) {
    setStories(items);
    setEditors(
      items.reduce<Record<string, StoryEditor>>((acc, item) => {
        acc[item.id] = {
          title: item.title,
          situation: item.situation,
          task: item.task,
          action: item.action,
          result: item.result,
          tags: item.tags.join(", "),
        };
        return acc;
      }, {}),
    );
  }

  async function reloadAll() {
    setIsLoading(true);
    setError(null);
    setFields(null);
    setMessage(null);

    const expParsed = await requestExperiences();
    if (expParsed.error) {
      setError(expParsed.error);
      setIsLoading(false);
      return;
    }
    setExperiences(expParsed.data ?? []);

    const storiesParsed = await requestStories();
    if (storiesParsed.error) {
      setError(storiesParsed.error);
      setFields(storiesParsed.fields);
      setIsLoading(false);
      return;
    }

    applyStories(storiesParsed.data?.items ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    void reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void (async () => {
        setError(null);
        setFields(null);
        setMessage(null);
        const parsed = await requestStories();
        if (parsed.error) {
          setError(parsed.error);
          setFields(parsed.fields);
          return;
        }
        applyStories(parsed.data?.items ?? []);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExperienceId]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    setFields(null);
    setMessage(null);

    const payload = {
      experienceId: createForm.experienceId || selectedExperienceId,
      title: createForm.title,
      situation: createForm.situation,
      task: createForm.task,
      action: createForm.action,
      result: createForm.result,
      tags: normalizeTags(createForm.tags),
    };

    const response = await fetch("/api/app/experience-stories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const parsed = await parseApiResponse<OwnerExperienceStoryDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      setFields(parsed.fields);
      setIsCreating(false);
      return;
    }

    setCreateForm({ ...DEFAULT_CREATE_FORM, experienceId: payload.experienceId ?? "" });
    setMessage("STAR 스토리를 생성했습니다.");
    setIsCreating(false);
    await reloadAll();
  }

  async function handleUpdate(storyId: string) {
    setError(null);
    setFields(null);
    setMessage(null);
    const editor = editors[storyId];
    if (!editor) {
      return;
    }

    const response = await fetch(`/api/app/experience-stories/${storyId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: editor.title,
        situation: editor.situation,
        task: editor.task,
        action: editor.action,
        result: editor.result,
        tags: normalizeTags(editor.tags),
      }),
    });
    const parsed = await parseApiResponse<OwnerExperienceStoryDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setFields(parsed.fields);
      return;
    }

    setMessage("STAR 스토리를 수정했습니다.");
    await reloadAll();
  }

  async function handleDelete(storyId: string) {
    if (!confirm("정말 삭제할까요?")) {
      return;
    }
    setError(null);
    setFields(null);
    setMessage(null);

    const response = await fetch(`/api/app/experience-stories/${storyId}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setFields(parsed.fields);
      return;
    }

    setMessage("STAR 스토리를 삭제했습니다.");
    await reloadAll();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Private</p>
          <h1 className="text-3xl font-semibold">경험 정리(STAR)</h1>
          <p className="mt-2 text-sm text-white/60">
            경험(Experience) 아래에 STAR 스토리를 누적해 스토리 뱅크를 만듭니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:text-white">
            /app
          </Link>
          <Link href="/app/experiences" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:text-white">
            경험 관리로 이동
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">필터</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm text-white/70">
              <span>경험 선택</span>
              <select
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                value={selectedExperienceId}
                onChange={(e) => setSelectedExperienceId(e.target.value)}
              >
                <option value="">(전체)</option>
                {experiences.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.company} / {exp.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-white/70 md:col-span-2">
              <span>검색</span>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  placeholder="제목/본문에서 검색"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 hover:text-white"
                  onClick={() => void reloadAll()}
                >
                  새로고침
                </button>
              </div>
            </label>
          </div>
          {selectedExperience ? (
            <p className="mt-4 text-sm text-white/60">
              선택된 경험: {selectedExperience.company} / {selectedExperience.role}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">새 STAR 스토리</h2>

          {experiences.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <p>먼저 경험을 만들고 STAR 스토리를 추가하세요.</p>
              <p className="mt-2">
                <Link href="/app/experiences" className="text-white underline">
                  /app/experiences
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleCreate(e)} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm text-white/70">
                <span>경험(Experience)</span>
                <select
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.experienceId || selectedExperienceId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, experienceId: e.target.value }))}
                >
                  <option value="">(선택)</option>
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.company} / {exp.role}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm text-white/70">
                <span>제목</span>
                <input
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-white/70">
                  <span>Situation</span>
                  <textarea
                    className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    value={createForm.situation}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, situation: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm text-white/70">
                  <span>Task</span>
                  <textarea
                    className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    value={createForm.task}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, task: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm text-white/70">
                  <span>Action</span>
                  <textarea
                    className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    value={createForm.action}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, action: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm text-white/70">
                  <span>Result</span>
                  <textarea
                    className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    value={createForm.result}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, result: e.target.value }))}
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm text-white/70">
                <span>태그(쉼표로 구분)</span>
                <input
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </label>

              <button
                type="submit"
                disabled={isCreating}
                className="mt-2 inline-flex w-fit items-center rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 hover:text-white disabled:opacity-50"
              >
                {isCreating ? "생성 중..." : "생성"}
              </button>
            </form>
          )}

          {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
          {fields ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              <p className="font-medium">필드 오류</p>
              <ul className="mt-2 list-disc pl-5">
                {Object.entries(fields).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">스토리 목록</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-white/60">로딩 중...</p>
          ) : stories.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">아직 스토리가 없습니다.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {stories.map((story) => {
                const editor = editors[story.id];
                return (
                  <div key={story.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white/60">updatedAt: {new Date(story.updatedAt).toLocaleString()}</p>
                        <h3 className="mt-1 text-base font-semibold">{story.title}</h3>
                        <p className="mt-1 text-sm text-white/60">
                          tags: {story.tags.length > 0 ? story.tags.join(", ") : "(없음)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 hover:text-white"
                          onClick={() => void handleUpdate(story.id)}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-white/10 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:text-red-100"
                          onClick={() => void handleDelete(story.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {editor ? (
                      <div className="mt-4 grid gap-3">
                        <label className="grid gap-1 text-sm text-white/70">
                          <span>제목</span>
                          <input
                            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                            value={editor.title}
                            onChange={(e) =>
                              setEditors((prev) => ({
                                ...prev,
                                [story.id]: { ...prev[story.id]!, title: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>Situation</span>
                            <textarea
                              className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.situation}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [story.id]: { ...prev[story.id]!, situation: e.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>Task</span>
                            <textarea
                              className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.task}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [story.id]: { ...prev[story.id]!, task: e.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>Action</span>
                            <textarea
                              className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.action}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [story.id]: { ...prev[story.id]!, action: e.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>Result</span>
                            <textarea
                              className="min-h-[120px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.result}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [story.id]: { ...prev[story.id]!, result: e.target.value },
                                }))
                              }
                            />
                          </label>
                        </div>
                        <label className="grid gap-1 text-sm text-white/70">
                          <span>태그(쉼표로 구분)</span>
                          <input
                            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                            value={editor.tags}
                            onChange={(e) =>
                              setEditors((prev) => ({
                                ...prev,
                                [story.id]: { ...prev[story.id]!, tags: e.target.value },
                              }))
                            }
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

