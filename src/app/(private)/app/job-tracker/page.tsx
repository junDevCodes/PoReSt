"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

const JobCardDetailModal = dynamic(
  () => import("./JobCardDetailModal"),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-xl mx-4">
          <div className="h-6 w-48 animate-pulse rounded bg-black/10" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-black/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-black/10" />
            <div className="h-32 w-full animate-pulse rounded bg-black/10" />
          </div>
        </div>
      </div>
    ),
  },
);

type CompanyTargetStatus =
  | "INTERESTED"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "ARCHIVED";

type BoardCardDto = {
  id: string;
  company: string;
  role: string;
  status: CompanyTargetStatus;
  priority: number;
  summary: string | null;
  tags: string[];
  jobDescriptionMd: string | null;
  appliedAt: string | null;
  matchScoreJson: JdMatchResult | null;
  eventCount: number;
  updatedAt: string;
};

type BoardColumnDto = {
  status: CompanyTargetStatus;
  label: string;
  cards: BoardCardDto[];
};

type BoardDto = {
  columns: BoardColumnDto[];
  totalCount: number;
};

type ApplicationEventDto = {
  id: string;
  fromStatus: CompanyTargetStatus | null;
  toStatus: CompanyTargetStatus;
  note: string | null;
  createdAt: string;
};

type JdMatchResult = {
  score: number;
  matchedSkills: string[];
  gaps: string[];
  summary: string;
};

const STATUS_ORDER: CompanyTargetStatus[] = [
  "INTERESTED",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
  "ARCHIVED",
];

const STATUS_COLORS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "border-blue-300 bg-blue-50",
  APPLIED: "border-indigo-300 bg-indigo-50",
  INTERVIEWING: "border-amber-300 bg-amber-50",
  OFFER: "border-emerald-300 bg-emerald-50",
  REJECTED: "border-rose-300 bg-rose-50",
  ARCHIVED: "border-gray-300 bg-gray-50",
};

const STATUS_LABELS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "관심",
  APPLIED: "지원 완료",
  INTERVIEWING: "면접 진행",
  OFFER: "오퍼 수령",
  REJECTED: "탈락/거절",
  ARCHIVED: "보관",
};

export default function JobTrackerPage() {
  const [board, setBoard] = useState<BoardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 상세 모달 상태
  const [selectedCard, setSelectedCard] = useState<BoardCardDto | null>(null);
  const [events, setEvents] = useState<ApplicationEventDto[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // JD 매칭 상태
  const [jdInput, setJdInput] = useState("");
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JdMatchResult | null>(null);

  // 상태 변경 상태
  const [statusNote, setStatusNote] = useState("");

  async function loadBoard() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/app/job-tracker");
      const parsed = await parseApiResponse<BoardDto>(response);
      if (parsed.error) {
        setError(parsed.error);
      } else {
        setBoard(parsed.data);
      }
    } catch (err) {
      const parsed = await parseApiResponse<BoardDto>(err);
      setError(parsed.error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/app/job-tracker")
      .then((res) => parseApiResponse<BoardDto>(res))
      .then((parsed) => {
        if (!active) return;
        if (parsed.error) setError(parsed.error);
        else setBoard(parsed.data);
      })
      .catch(async (err) => {
        if (!active) return;
        const parsed = await parseApiResponse<BoardDto>(err);
        setError(parsed.error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function loadEvents(targetId: string) {
    setEventsLoading(true);
    try {
      const response = await fetch(`/api/app/job-tracker/${targetId}/events`);
      const parsed = await parseApiResponse<ApplicationEventDto[]>(response);
      if (!parsed.error && parsed.data) {
        setEvents(parsed.data);
      }
    } catch {
      // 이벤트 로딩 실패는 무시
    }
    setEventsLoading(false);
  }

  function openCardDetail(card: BoardCardDto) {
    setSelectedCard(card);
    setMatchResult(card.matchScoreJson ?? null);
    setJdInput(card.jobDescriptionMd ?? "");
    setStatusNote("");
    void loadEvents(card.id);
  }

  function closeModal() {
    setSelectedCard(null);
    setEvents([]);
    setMatchResult(null);
    setJdInput("");
    setStatusNote("");
  }

  async function handleStatusChange(targetId: string, newStatus: CompanyTargetStatus) {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/app/job-tracker/${targetId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: statusNote || null }),
      });
      const parsed = await parseApiResponse<BoardCardDto>(response);
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      setMessage(`${STATUS_LABELS[newStatus]}(으)로 상태를 변경했습니다.`);
      setStatusNote("");
      closeModal();
      await loadBoard();
    } catch (err) {
      const parsed = await parseApiResponse<BoardCardDto>(err);
      setError(parsed.error);
    }
  }

  async function handleJdMatch(targetId: string) {
    setMatchLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/app/job-tracker/${targetId}/match`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescriptionMd: jdInput }),
      });
      const parsed = await parseApiResponse<JdMatchResult>(response);
      if (parsed.error) {
        setError(parsed.error);
      } else if (parsed.data) {
        setMatchResult(parsed.data);
        setMessage("JD 매칭 분석이 완료되었습니다.");
        // 보드 갱신 (matchScoreJson 업데이트됨)
        await loadBoard();
      }
    } catch (err) {
      const parsed = await parseApiResponse<JdMatchResult>(err);
      setError(parsed.error);
    }
    setMatchLoading(false);
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-700";
    if (score >= 60) return "text-blue-700";
    if (score >= 40) return "text-amber-700";
    return "text-rose-700";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">Private</p>
          <h1 className="text-3xl font-semibold">지원 트래커</h1>
          <p className="mt-2 text-sm text-black/60">
            기업 분석 카드를 칸반 보드로 관리하고 JD 매칭 분석을 수행합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/company-targets"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
          >
            기업 분석
          </Link>
          <Link
            href="/app"
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black/75 hover:text-black"
          >
            워크스페이스
          </Link>
        </div>
      </header>

      {message && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="mt-8 text-sm text-black/60">보드를 불러오는 중...</p>
      ) : !board || board.totalCount === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-8 text-center">
          <p className="text-black/60">아직 기업 분석 카드가 없습니다.</p>
          <Link
            href="/app/company-targets"
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90"
          >
            기업 분석에서 카드 추가
          </Link>
        </div>
      ) : (
        <section className="mt-8 flex gap-4 overflow-x-auto pb-4">
          {board.columns
            .filter((col) => col.cards.length > 0 || STATUS_ORDER.indexOf(col.status) < 4)
            .map((column) => (
              <div
                key={column.status}
                className={`flex w-64 min-w-[256px] flex-shrink-0 flex-col rounded-xl border-2 ${STATUS_COLORS[column.status]} p-3`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{column.label}</h2>
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium">
                    {column.cards.length}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {column.cards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => openCardDetail(card)}
                      className="rounded-lg border border-black/10 bg-white p-3 text-left transition hover:shadow-md"
                    >
                      <p className="text-sm font-semibold text-black">{card.company}</p>
                      <p className="mt-0.5 text-xs text-black/60">{card.role}</p>

                      {card.priority > 0 && (
                        <span className="mt-1 inline-block rounded bg-black/5 px-1.5 py-0.5 text-xs text-black/50">
                          P{card.priority}
                        </span>
                      )}

                      {card.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {card.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-black/60"
                            >
                              {tag}
                            </span>
                          ))}
                          {card.tags.length > 3 && (
                            <span className="text-[10px] text-black/40">
                              +{card.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {card.matchScoreJson && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className={`text-xs font-bold ${getScoreColor((card.matchScoreJson as JdMatchResult).score)}`}>
                            {(card.matchScoreJson as JdMatchResult).score}점
                          </span>
                          <span className="text-[10px] text-black/40">매칭</span>
                        </div>
                      )}

                      {card.appliedAt && (
                        <p className="mt-1 text-[10px] text-black/40">
                          지원: {new Date(card.appliedAt).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </section>
      )}

      {/* 상세 모달 — dynamic lazy 로딩 */}
      {selectedCard && (
        <JobCardDetailModal
          card={selectedCard}
          events={events}
          eventsLoading={eventsLoading}
          jdInput={jdInput}
          onJdInputChange={setJdInput}
          matchLoading={matchLoading}
          matchResult={matchResult}
          statusNote={statusNote}
          onStatusNoteChange={setStatusNote}
          onStatusChange={(targetId, newStatus) => void handleStatusChange(targetId, newStatus)}
          onJdMatch={(targetId) => void handleJdMatch(targetId)}
          onClose={closeModal}
        />
      )}
    </main>
  );
}
