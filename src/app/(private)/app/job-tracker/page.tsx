"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";

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

const STATUS_BADGE_COLORS: Record<CompanyTargetStatus, string> = {
  INTERESTED: "bg-blue-100 text-blue-800",
  APPLIED: "bg-indigo-100 text-indigo-800",
  INTERVIEWING: "bg-amber-100 text-amber-800",
  OFFER: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
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

      {/* 상세 모달 */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-start justify-between border-b border-black/10 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{selectedCard.company}</h2>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[selectedCard.status]}`}>
                    {STATUS_LABELS[selectedCard.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-black/60">{selectedCard.role}</p>
                {selectedCard.appliedAt && (
                  <p className="mt-1 text-xs text-black/40">
                    지원일: {new Date(selectedCard.appliedAt).toLocaleDateString("ko-KR")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-6">
                {/* 상태 변경 */}
                <div>
                  <h3 className="text-sm font-semibold text-black/80">상태 변경</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STATUS_ORDER.filter((s) => s !== selectedCard.status).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void handleStatusChange(selectedCard.id, status)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:shadow-sm ${STATUS_BADGE_COLORS[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="상태 변경 메모 (선택)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                  />
                </div>

                {/* 요약 */}
                {selectedCard.summary && (
                  <div>
                    <h3 className="text-sm font-semibold text-black/80">요약</h3>
                    <p className="mt-1 text-sm text-black/70 whitespace-pre-wrap">{selectedCard.summary}</p>
                  </div>
                )}

                {/* JD 매칭 */}
                <div>
                  <h3 className="text-sm font-semibold text-black/80">JD 매칭 분석</h3>
                  <textarea
                    className="mt-2 min-h-[120px] w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                    placeholder="채용 공고(JD)를 붙여넣으세요..."
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={matchLoading || !jdInput.trim()}
                    onClick={() => void handleJdMatch(selectedCard.id)}
                    className="mt-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90 disabled:opacity-50"
                  >
                    {matchLoading ? "분석 중..." : "AI 매칭 분석"}
                  </button>

                  {matchResult && (
                    <div className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-3xl font-bold ${getScoreColor(matchResult.score)}`}>
                          {matchResult.score}
                        </span>
                        <span className="text-sm text-black/60">/ 100점</span>
                      </div>
                      <p className="mt-2 text-sm text-black/70">{matchResult.summary}</p>

                      {matchResult.matchedSkills.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-black/50">일치 기술</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {matchResult.matchedSkills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchResult.gaps.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-black/50">보완 필요</p>
                          <ul className="mt-1 list-disc pl-4">
                            {matchResult.gaps.map((gap, i) => (
                              <li key={i} className="text-xs text-black/60">{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 타임라인 */}
                <div>
                  <h3 className="text-sm font-semibold text-black/80">
                    상태 변경 이력 ({events.length})
                  </h3>
                  {eventsLoading ? (
                    <p className="mt-2 text-xs text-black/40">로딩 중...</p>
                  ) : events.length === 0 ? (
                    <p className="mt-2 text-xs text-black/40">아직 상태 변경 이력이 없습니다.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 rounded-lg border border-black/5 bg-[#faf9f6] p-3"
                        >
                          <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-black/20" />
                          <div className="flex-1">
                            <p className="text-xs text-black/70">
                              {event.fromStatus
                                ? `${STATUS_LABELS[event.fromStatus]} → ${STATUS_LABELS[event.toStatus]}`
                                : `${STATUS_LABELS[event.toStatus]} 설정`}
                            </p>
                            {event.note && (
                              <p className="mt-0.5 text-xs text-black/50">{event.note}</p>
                            )}
                            <p className="mt-0.5 text-[10px] text-black/30">
                              {new Date(event.createdAt).toLocaleString("ko-KR")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
