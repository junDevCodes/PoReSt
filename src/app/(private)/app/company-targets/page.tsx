"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

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
  const [status, setStatus] = useState<CompanyTargetStatus | "">("");
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
    // 네트워크 예외 포함 전체 오류를 공용 parseApiResponse로 처리
    try {
      const response = await fetch(`/api/app/company-targets?${params.toString()}`, {
        method: "GET",
      });
      return await parseApiResponse<CompanyTargetsListResult>(response);
    } catch (error) {
      return parseApiResponse<CompanyTargetsListResult>(error);
    }
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

    // 네트워크 예외 포함 전체 오류를 공용 parseApiResponse로 처리
    const parsed = await (async () => {
      try {
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
        return await parseApiResponse<OwnerCompanyTargetDto>(response);
      } catch (error) {
        return parseApiResponse<OwnerCompanyTargetDto>(error);
      }
    })();
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

    // 네트워크 예외 포함 전체 오류를 공용 parseApiResponse로 처리
    const parsed = await (async () => {
      try {
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
        return await parseApiResponse<OwnerCompanyTargetDto>(response);
      } catch (error) {
        return parseApiResponse<OwnerCompanyTargetDto>(error);
      }
    })();
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

    // 네트워크 예외 포함 전체 오류를 공용 parseApiResponse로 처리
    const parsed = await (async () => {
      try {
        const response = await fetch(`/api/app/company-targets/${id}`, { method: "DELETE" });
        return await parseApiResponse<{ id: string }>(response);
      } catch (error) {
        return parseApiResponse<{ id: string }>(error);
      }
    })();
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
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">Private</p>
          <h1 className="text-3xl font-semibold">기업 분석 목록</h1>
          <p className="mt-2 text-sm text-black/60">
            회사+직무 단위로 타겟 카드를 만들고 파이프라인 상태를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
          >
            워크스페이스
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">필터</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm text-black/70">
              <span>상태</span>
              <select
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
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
            <label className="grid gap-1 text-sm text-black/70 md:col-span-2">
              <span>검색</span>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                  placeholder="회사/직무/요약/분석에서 검색"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  type="button"
                  className="whitespace-nowrap rounded-lg border border-black/15 bg-black px-4 py-2 text-sm text-white hover:bg-black/90"
                  onClick={() => void reloadTargets()}
                >
                  새로고침
                </button>
              </div>
            </label>
          </div>
          <p className="mt-4 text-sm text-black/60">현재 필터: {statusLabel}</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">새 카드</h2>
          <form onSubmit={(e) => void handleCreate(e)} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-black/70">
                <span>회사명</span>
                <input
                  className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                  value={createForm.company}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, company: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm text-black/70">
                <span>직무</span>
                <input
                  className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm text-black/70">
                <span>상태</span>
                <select
                  className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: e.target.value as CompanyTargetStatus,
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
              <label className="grid gap-1 text-sm text-black/70">
                <span>우선순위</span>
                <input
                  type="number"
                  className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                  value={createForm.priority}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, priority: Number(e.target.value) }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm text-black/70">
                <span>태그(쉼표로 구분)</span>
                <input
                  className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm text-black/70">
              <span>요약(선택)</span>
              <textarea
                className="min-h-[80px] rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                value={createForm.summary}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, summary: e.target.value }))}
              />
            </label>

            <label className="grid gap-1 text-sm text-black/70">
              <span>분석 메모(선택)</span>
              <textarea
                className="min-h-[140px] rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                value={createForm.analysisMd}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, analysisMd: e.target.value }))}
              />
            </label>

            <button
              type="submit"
              disabled={isCreating}
              className="mt-2 inline-flex w-fit items-center rounded-lg border border-black/15 bg-black px-4 py-2 text-sm text-white hover:bg-black/90 disabled:opacity-50"
            >
              {isCreating ? "생성 중..." : "생성"}
            </button>
          </form>

          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
          {fields ? (
            <div className="mt-3 rounded-xl border border-black/10 bg-[#faf9f6] p-3 text-sm text-black/70">
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

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold">카드 목록</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-black/60">로딩 중...</p>
          ) : targets.length === 0 ? (
            <p className="mt-4 text-sm text-black/60">아직 카드가 없습니다.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {targets.map((target) => {
                const editor = editors[target.id];
                return (
                  <div
                    key={target.id}
                    className="rounded-xl border border-black/10 bg-[#faf9f6] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-black/60">
                          updatedAt: {new Date(target.updatedAt).toLocaleString()}
                        </p>
                        <h3 className="mt-1 text-base font-semibold">
                          {target.company} / {target.role}
                        </h3>
                        <p className="mt-1 text-sm text-black/60">
                          상태: {STATUS_LABELS[target.status]} | 우선순위: {target.priority}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800"
                          onClick={() => void handleUpdate(target.id)}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800"
                          onClick={() => void handleDelete(target.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {editor ? (
                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="grid gap-1 text-sm text-black/70">
                            <span>회사명</span>
                            <input
                              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                              value={editor.company}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: { ...prev[target.id]!, company: e.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className="grid gap-1 text-sm text-black/70">
                            <span>직무</span>
                            <input
                              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
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
                          <label className="grid gap-1 text-sm text-black/70">
                            <span>상태</span>
                            <select
                              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                              value={editor.status}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: {
                                    ...prev[target.id]!,
                                    status: e.target.value as CompanyTargetStatus,
                                  },
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
                          <label className="grid gap-1 text-sm text-black/70">
                            <span>우선순위</span>
                            <input
                              type="number"
                              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                              value={editor.priority}
                              onChange={(e) =>
                                setEditors((prev) => ({
                                  ...prev,
                                  [target.id]: {
                                    ...prev[target.id]!,
                                    priority: Number(e.target.value),
                                  },
                                }))
                              }
                            />
                          </label>
                          <label className="grid gap-1 text-sm text-black/70">
                            <span>태그(쉼표로 구분)</span>
                            <input
                              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
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

                        <label className="grid gap-1 text-sm text-black/70">
                          <span>요약(선택)</span>
                          <textarea
                            className="min-h-[80px] rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
                            value={editor.summary}
                            onChange={(e) =>
                              setEditors((prev) => ({
                                ...prev,
                                [target.id]: { ...prev[target.id]!, summary: e.target.value },
                              }))
                            }
                          />
                        </label>

                        <label className="grid gap-1 text-sm text-black/70">
                          <span>분석 메모(선택)</span>
                          <textarea
                            className="min-h-[140px] rounded-lg border border-black/15 bg-white px-3 py-2 text-black"
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
