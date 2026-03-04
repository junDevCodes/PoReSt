"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import { splitEdgesByStatus, type NoteEdgeDto } from "@/app/(private)/app/notes/_lib/detail";
import { buildNoteGraph } from "@/app/(private)/app/notes/_lib/graph";

export type OwnerNoteDetailView = {
  id: string;
  notebookId: string;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  title: string;
  contentMd: string;
  summary: string | null;
  tags: string[];
  updatedAt: string;
  notebook: {
    id: string;
    name: string;
  };
};

type NoteDetailClientProps = {
  note: OwnerNoteDetailView;
  initialEdges: NoteEdgeDto[];
};

function formatUpdatedAtLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

export function NoteDetailClient({ note, initialEdges }: NoteDetailClientProps) {
  const [edges, setEdges] = useState<NoteEdgeDto[]>(initialEdges);
  const [error, setError] = useState<string | null>(null);
  const [pendingEdgeId, setPendingEdgeId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return splitEdgesByStatus(note.id, edges);
  }, [edges, note.id]);
  const graph = useMemo(
    () => buildNoteGraph(note.id, note.title, edges),
    [edges, note.id, note.title],
  );

  function nodeFillColor(kind: "CENTER" | "CONFIRMED" | "CANDIDATE") {
    if (kind === "CENTER") return "#22d3ee";
    if (kind === "CONFIRMED") return "#22c55e";
    return "#f59e0b";
  }

  function edgeStrokeColor(status: "CONFIRMED" | "CANDIDATE") {
    if (status === "CONFIRMED") return "rgba(34, 197, 94, 0.75)";
    return "rgba(245, 158, 11, 0.65)";
  }

  async function handleEdgeAction(action: "confirm" | "reject", edgeId: string) {
    setPendingEdgeId(edgeId);
    setError(null);

    const endpoint =
      action === "confirm" ? "/api/app/notes/edges/confirm" : "/api/app/notes/edges/reject";
    const parsed = await (async () => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ edgeId }),
        });
        return await parseApiResponse<NoteEdgeDto>(response);
      } catch (error) {
        return parseApiResponse<NoteEdgeDto>(error);
      }
    })();
    if (parsed.error) {
      setError(parsed.error);
      setPendingEdgeId(null);
      return;
    }

    const parsedEdges = await (async () => {
      try {
        const edgeResponse = await fetch(`/api/app/notes/${note.id}/edges`, { method: "GET" });
        return await parseApiResponse<NoteEdgeDto[]>(edgeResponse);
      } catch (error) {
        return parseApiResponse<NoteEdgeDto[]>(error);
      }
    })();
    if (parsedEdges.error) {
      setError(parsedEdges.error);
      setPendingEdgeId(null);
      return;
    }

    setEdges(parsedEdges.data ?? []);
    setPendingEdgeId(null);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <header className="rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/60">노트 상세</p>
        <h1 className="mt-2 text-3xl font-semibold">{note.title}</h1>
        <p className="mt-2 text-sm text-black/60">
          노트북: {note.notebook.name} · 수정일: {formatUpdatedAtLabel(note.updatedAt)} · 공개상태:{" "}
          {note.visibility}
        </p>
        {note.summary ? <p className="mt-4 text-sm text-black/70">{note.summary}</p> : null}
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-black/10 bg-white p-4 text-sm text-black/75">
          {note.contentMd}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/15 px-3 py-1 text-xs text-black/70"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
          <h2 className="text-lg font-semibold">연관 개념 (CONFIRMED)</h2>
          {grouped.confirmed.length === 0 ? (
            <p className="mt-3 text-sm text-black/60">확정된 연관 개념이 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {grouped.confirmed.map((item) => (
                <li
                  key={item.edge.id}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{item.counterpart.title}</span>
                    <Link
                      href={`/app/notes/${item.counterpart.id}`}
                      className="rounded-lg border border-black/15 px-3 py-1 text-xs text-black/70"
                    >
                      이동
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
          <h2 className="text-lg font-semibold">연관 후보 (CANDIDATE)</h2>
          {grouped.candidates.length === 0 ? (
            <p className="mt-3 text-sm text-black/60">연관 후보가 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {grouped.candidates.map((item) => (
                <li
                  key={item.edge.id}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm">{item.counterpart.title}</p>
                      <p className="mt-1 text-xs text-black/60">유사도: {item.edge.weight ?? 0}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleEdgeAction("confirm", item.edge.id)}
                        disabled={pendingEdgeId === item.edge.id}
                        className="rounded-lg border border-emerald-300 px-3 py-1 text-xs text-emerald-700 disabled:opacity-60"
                      >
                        확정
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleEdgeAction("reject", item.edge.id)}
                        disabled={pendingEdgeId === item.edge.id}
                        className="rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-700 disabled:opacity-60"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-[#faf9f6] p-6">
        <h2 className="text-lg font-semibold">노트 연결 그래프</h2>
        <p className="mt-2 text-xs text-black/60">
          중심 노트 기준으로 CONFIRMED/CANDIDATE 관계를 시각화합니다.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-white p-3">
          <svg
            width={graph.width}
            height={graph.height}
            viewBox={`0 0 ${graph.width} ${graph.height}`}
            role="img"
            aria-label="노트 연결 그래프"
          >
            {graph.edges.map((edge) => {
              const fromNode = graph.nodes.find((node) => node.id === edge.fromId);
              const toNode = graph.nodes.find((node) => node.id === edge.toId);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={edge.id}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={edgeStrokeColor(edge.status)}
                  strokeWidth={Math.max(1.5, edge.weight * 3)}
                />
              );
            })}
            {graph.nodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.kind === "CENTER" ? 18 : 14}
                  fill={nodeFillColor(node.kind)}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth={1.5}
                />
                <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={10} fill="#0b1220">
                  {node.kind === "CENTER" ? "ME" : "N"}
                </text>
                <text
                  x={node.x}
                  y={node.y + 28}
                  textAnchor="middle"
                  fontSize={11}
                  fill="rgba(0,0,0,0.8)"
                >
                  {node.title.length > 14 ? `${node.title.slice(0, 14)}…` : node.title}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </section>
    </main>
  );
}
