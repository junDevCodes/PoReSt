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

type CompanyTargetStatus =
  | "INTERESTED"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "ARCHIVED";

type OwnerCompanyTargetDto = {
  id: string;
  company: string;
  role: string;
  status: CompanyTargetStatus;
  priority: number;
  summary: string | null;
  analysisMd: string | null;
  tags: string[];
  updatedAt: string;
};

type CompanyTargetsListResult = {
  items: OwnerCompanyTargetDto[];
  nextCursor: string | null;
};

const STATUS_LABELS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "관심",
  APPLIED: "지원",
  INTERVIEWING: "면접",
  OFFER: "오퍼",
  REJECTED: "탈락/거절",
  ARCHIVED: "보관",
};

const DEFAULT_CREATE_FORM = {
  company: "",
  role: "",
  status: "INTERESTED" as CompanyTargetStatus,
  priority: 0,
  summary: "",
  analysisMd: "",
  tags: "",
};

type TargetEditor = {
  company: string;
  role: string;
  status: CompanyTargetStatus;
  priority: number;
  summary: string;
  analysisMd: string;
  tags: string;
};

function normalizeTags(raw: string): string[] {
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export default function CompanyTargetsPage() {
  const [targets, setTargets] = useState<OwnerCompanyTargetDto[]>([]);
  const [editors, setEditors] = useState<Record<string, TargetEditor>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [status, setStatus] = useState<CompanyTargetStatus | "">( "");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const statusLabel = useMemo(() => (status ? STATUS_LABELS[status] : "전체"), [status]);

  async function requestTargets() {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    if (q.trim()) {
      params.set("q", q.trim());
    }
    const response = await fetch(`/api/app/company-targets?${params.toString()}`, { method: "GET" });
    return parseApiResponse<CompanyTargetsListResult>(response);
  }

  function applyTargets(items: OwnerCompanyTargetDto[]) {
    setTargets(items);
    setEditors(
      items.reduce<Record<string, TargetEditor>>((acc, item) => {
        acc[item.id] = {
          company: item.company,
          role: item.role,
          status: item.status,
          priority: item.priority,
          summary: item.summary ?? "",
          analysisMd: item.analysisMd ?? "",
          tags: item.tags.join(", "),
        };
        return acc;
      }, {}),
    );
  }

  async function reloadTargets() {
    setIsLoading(true);
    setError(null);
    setFields(null);
    setMessage(null);

    const parsed = await requestTargets();
    if (parsed.error) {
      setError(parsed.error);
      setFields(parsed.fields);
      setIsLoading(false);
      return;
    }

    applyTargets(parsed.data?.items ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    void reloadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void reloadTargets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    setFields(null);
    setMessage(null);

    const response = await fetch("/api/app/company-targets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        company: createForm.company,
        role: createForm.role,
        status: createForm.status,
        priority: createForm.priority,
        summary: createForm.summary || null,
        analysisMd: createForm.analysisMd || null,
        tags: normalizeTags(createForm.tags),
      }),
    });

    const parsed = await parseApiResponse<OwnerCompanyTargetDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setFields(parsed.fields);
      setIsCreating(false);
      return;
    }

    setCreateForm(DEFAULT_CREATE_FORM);
    setIsCreating(false);
    setMessage("기업 분석 카드를 생성했습니다.");
    await reloadTargets();
  }

  async function handleUpdate(id: string) {
    const editor = editors[id];
    if (!editor) {
      return;
    }

    setError(null);
    setFields(null);
    setMessage(null);

    const response = await fetch(`/api/app/company-targets/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        company: editor.company,
        role: editor.role,
        status: editor.status,
        priority: editor.priority,
        summary: editor.summary || null,
        analysisMd: editor.analysisMd || null,
        tags: normalizeTags(editor.tags),
      }),
    });

    const parsed = await parseApiResponse<OwnerCompanyTargetDto>(response);
    if (parsed.error) {
      setError(parsed.error);
      setFields(parsed.fields);
      return;
    }

    setMessage("기업 분석 카드를 수정했습니다.");
    await reloadTargets();
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제할까요?")) {
      return;
    }

    setError(null);
    setFields(null);
    setMessage(null);

    const response = await fetch(`/api/app/company-targets/${id}`, { method: "DELETE" });
    const parsed = await parseApiResponse<{ id: string }>(response);
    if (parsed.error) {
      setError(parsed.error);
      setFields(parsed.fields);
      return;
    }

    setMessage("기업 분석 카드를 삭제했습니다.");
    await reloadTargets();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Private</p>
          <h1 className="text-3xl font-semibold">기업 분석 목록</h1>
          <p className="mt-2 text-sm text-white/60">
            회사+직무 단위로 타겟 카드를 만들고 파이프라인 상태를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:text-white">
            /app
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">필터</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm text-white/70">
              <span>상태</span>
              <select
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                value={status}
                onChange={(e) => setStatus(e.target.value as CompanyTargetStatus | "")}
              >
                <option value="">(전체)</option>
                {Object.keys(STATUS_LABELS).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABELS[key as CompanyTargetStatus]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-white/70 md:col-span-2">
              <span>검색</span>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  placeholder="회사/직무/요약/분석에서 검색"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 hover:text-white"
                  onClick={() => void reloadTargets()}
                >
                  새로고침
                </button>
              </div>
            </label>
          </div>
          <p className="mt-4 text-sm text-white/60">현재 필터: {statusLabel}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">새 카드</h2>
          <form onSubmit={(e) => void handleCreate(e)} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-white/70">
                <span>회사명</span>
                <input
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.company}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, company: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm text-white/70">
                <span>직무</span>
                <input
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm text-white/70">
                <span>상태</span>
                <select
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, status: e.target.value as CompanyTargetStatus }))
                  }
                >
                  {Object.keys(STATUS_LABELS).map((key) => (
                    <option key={key} value={key}>
                      {STATUS_LABELS[key as CompanyTargetStatus]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-white/70">
                <span>우선순위</span>
                <input
                  type="number"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.priority}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, priority: Number(e.target.value) }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm text-white/70">
                <span>태그(쉼표로 구분)</span>
                <input
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm text-white/70">
              <span>요약(선택)</span>
              <textarea
                className="min-h-[80px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                value={createForm.summary}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, summary: e.target.value }))}
              />
            </label>

            <label className="grid gap-1 text-sm text-white/70">
              <span>분석 메모(선택)</span>
              <textarea
                className="min-h-[140px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                value={createForm.analysisMd}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, analysisMd: e.target.value }))}
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
          <h2 className="text-lg font-semibold">카드 목록</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-white/60">로딩 중...</p>
          ) : targets.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">아직 카드가 없습니다.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {targets.map((target) => {
                const editor = editors[target.id];
                return (
                  <div key={target.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white/60">updatedAt: {new Date(target.updatedAt).toLocaleString()}</p>
                        <h3 className="mt-1 text-base font-semibold">
                          {target.company} / {target.role}
                        </h3>
                        <p className="mt-1 text-sm text-white/60">
                          상태: {STATUS_LABELS[target.status]} | 우선순위: {target.priority}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 hover:text-white"
                          onClick={() => void handleUpdate(target.id)}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-white/10 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:text-red-100"
                          onClick={() => void handleDelete(target.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {editor ? (
                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>회사명</span>
                            <input
                              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.company}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: { ...prev[target.id]!, company: e.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>직무</span>
                            <input
                              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.role}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: { ...prev[target.id]!, role: e.target.value },
                                }))
                              }
                            />
                          </label>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>상태</span>
                            <select
                              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.status}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: { ...prev[target.id]!, status: e.target.value as CompanyTargetStatus },
                                }))
                              }
                            >
                              {Object.keys(STATUS_LABELS).map((key) => (
                                <option key={key} value={key}>
                                  {STATUS_LABELS[key as CompanyTargetStatus]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>우선순위</span>
                            <input
                              type="number"
                              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.priority}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: { ...prev[target.id]!, priority: Number(e.target.value) },
                                }))
                              }
                            />
                          </label>
                          <label className="grid gap-1 text-sm text-white/70">
                            <span>태그(쉼표로 구분)</span>
                            <input
                              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                              value={editor.tags}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: { ...prev[target.id]!, tags: e.target.value },
                                }))
                              }
                            />
                          </label>
                        </div>

                        <label className="grid gap-1 text-sm text-white/70">
                          <span>요약(선택)</span>
                          <textarea
                            className="min-h-[80px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                            value={editor.summary}
                            onChange={(e) =>
                              setEditors((prev) => ({
                                ...prev,
                                [target.id]: { ...prev[target.id]!, summary: e.target.value },
                              }))
                            }
                          />
                        </label>

                        <label className="grid gap-1 text-sm text-white/70">
                          <span>분석 메모(선택)</span>
                          <textarea
                            className="min-h-[140px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                            value={editor.analysisMd}
                            onChange={(e) =>
                              setEditors((prev) => ({
                                ...prev,
                                [target.id]: { ...prev[target.id]!, analysisMd: e.target.value },
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

