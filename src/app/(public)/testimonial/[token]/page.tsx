"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ShareTokenInfo = {
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  status: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
  authorName: string | null;
};

const RELATIONSHIP_PRESETS = ["동료", "상사", "부하", "멘토", "멘티", "클라이언트", "협력사", "기타"];

export default function TestimonialSubmitPage() {
  const params = useParams();
  const token = params.token as string;

  const [info, setInfo] = useState<ShareTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 폼 상태
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(0);

  const loadInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/testimonials/${token}`);
      if (!res.ok) {
        const body = await res.json();
        setError(body?.error?.message ?? "유효하지 않은 링크입니다.");
        return;
      }
      const body = await res.json();
      const data = body.data as ShareTokenInfo;
      setInfo(data);
      if (data.authorName) {
        setAuthorName(data.authorName);
      }
    } catch {
      setError("정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/testimonials/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorTitle: authorTitle || null,
          authorCompany: authorCompany || null,
          authorEmail: authorEmail || null,
          relationship: relationship || null,
          content,
          rating: rating > 0 ? rating : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body?.error?.message ?? "제출에 실패했습니다.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <p className="text-sm text-black/50">불러오는 중...</p>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <p className="text-lg font-semibold text-black/80">{error}</p>
          <p className="mt-2 text-sm text-black/50">링크가 만료되었거나 잘못되었을 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (info && info.status !== "PENDING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <p className="text-lg font-semibold text-black/80">이미 작성된 추천서입니다.</p>
          <p className="mt-2 text-sm text-black/50">추천서가 제출되었습니다. 감사합니다!</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-emerald-600">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold">추천서가 제출되었습니다!</h2>
          <p className="mt-2 text-sm text-black/60">
            {info?.ownerDisplayName ?? "요청자"}님에게 전달됩니다. 소중한 시간 내주셔서 감사합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        {/* 요청자 정보 */}
        <div className="flex items-center gap-3">
          {info?.ownerAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.ownerAvatarUrl}
              alt="프로필"
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10 text-lg font-semibold text-black/60">
              {(info?.ownerDisplayName ?? "P").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{info?.ownerDisplayName ?? "포트폴리오 소유자"}</p>
            <p className="text-xs text-black/50">님에 대한 추천서를 작성해주세요</p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-black/70">
              이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="홍길동"
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-black/70">직책</label>
              <input
                type="text"
                value={authorTitle}
                onChange={(e) => setAuthorTitle(e.target.value)}
                placeholder="시니어 엔지니어"
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/70">회사</label>
              <input
                type="text"
                value={authorCompany}
                onChange={(e) => setAuthorCompany(e.target.value)}
                placeholder="테크회사"
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black/70">이메일</label>
            <input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="hong@company.com"
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black/70">관계</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {RELATIONSHIP_PRESETS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRelationship(r)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    relationship === r
                      ? "bg-black text-white"
                      : "bg-black/5 text-black/70 hover:bg-black/10"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black/70">
              평점
            </label>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className={`text-2xl transition ${
                    n <= rating ? "text-amber-500" : "text-black/20 hover:text-amber-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black/70">
              추천서 내용 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="함께 일한 경험, 강점, 업무 스타일 등을 자유롭게 작성해주세요."
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm leading-relaxed"
            />
            <p className="mt-1 text-right text-xs text-black/40">{content.length} / 5,000</p>
          </div>

          <button
            type="submit"
            disabled={submitting || !authorName || content.length < 10}
            className="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-50"
          >
            {submitting ? "제출 중..." : "추천서 제출"}
          </button>
        </form>
      </div>
    </div>
  );
}
