"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { parseBullets, parseMetrics } from "@/app/(private)/app/resumes/_lib/format-resume-data";

type PublicResumePreviewDto = {
  resume: {
    id: string;
    title: string;
    targetCompany: string | null;
    targetRole: string | null;
    level: string | null;
    summaryMd: string | null;
    updatedAt: string;
  };
  items: Array<{
    itemId: string;
    sortOrder: number;
    notes: string | null;
    resolvedBulletsJson: unknown;
    resolvedMetricsJson: unknown;
    resolvedTechTags: string[];
    experience: {
      company: string;
      role: string;
      summary: string | null;
    };
  }>;
};

type ApiEnvelope<T> = {
  data?: T;
  error?:
    | string
    | {
        message?: string;
      };
};

function extractErrorMessage(payload: ApiEnvelope<unknown>, status: number): string {
  if (typeof payload.error === "string") {
    return payload.error;
  }
  if (payload.error?.message) {
    return payload.error.message;
  }
  return `요청 처리에 실패했습니다. (HTTP ${status})`;
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "날짜 정보 없음";
  }
  return parsed.toISOString().slice(0, 10);
}

export default function PublicResumeSharePage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";

  const [preview, setPreview] = useState<PublicResumePreviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSharedResume() {
      if (!token) {
        setError("공유 링크가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/public/resume/share/${token}`, { method: "GET" });
      const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<PublicResumePreviewDto>;

      if (!mounted) {
        return;
      }

      if (!response.ok || !payload.data) {
        setError(extractErrorMessage(payload, response.status));
        setIsLoading(false);
        return;
      }

      setPreview(payload.data);
      setIsLoading(false);
    }

    void loadSharedResume();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-[#fdfcf9] print:bg-white">
      {/* 상단 네비 (인쇄 시 숨김) */}
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">Shared Resume</p>
          <Link
            href="/"
            className="rounded-full border border-stone-300 px-4 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
          >
            홈으로
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* 로딩 */}
        {isLoading ? (
          <p className="text-sm text-stone-500">공유 이력서를 불러오는 중입니다...</p>
        ) : null}

        {/* 에러 */}
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* 이력서 콘텐츠 */}
        {!isLoading && !error && preview ? (
          <>
            {/* 헤더 */}
            <header className="mb-8 border-b border-stone-200 pb-6">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                {preview.resume.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
                {preview.resume.targetCompany ? (
                  <span className="font-medium text-stone-700">{preview.resume.targetCompany}</span>
                ) : null}
                {preview.resume.targetRole ? (
                  <>
                    <span className="text-stone-300">/</span>
                    <span>{preview.resume.targetRole}</span>
                  </>
                ) : null}
                {preview.resume.level ? (
                  <>
                    <span className="text-stone-300">/</span>
                    <span className="capitalize">{preview.resume.level}</span>
                  </>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-stone-400">
                마지막 수정: {formatDateLabel(preview.resume.updatedAt)}
              </p>
            </header>

            {/* 요약 */}
            {preview.resume.summaryMd ? (
              <section className="mb-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
                  요약
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                  {preview.resume.summaryMd}
                </p>
              </section>
            ) : null}

            {/* 경력 항목 */}
            {preview.items.length > 0 ? (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
                  경력 항목
                </h2>
                <div className="space-y-4">
                  {preview.items.map((item, idx) => {
                    const bullets = parseBullets(item.resolvedBulletsJson);
                    const metrics = parseMetrics(item.resolvedMetricsJson);

                    return (
                      <article
                        key={item.itemId}
                        className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:shadow-none print:border-stone-300"
                      >
                        {/* 카드 헤더 */}
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-stone-900">
                              {item.experience.company}
                            </h3>
                            <p className="text-sm text-stone-500">{item.experience.role}</p>
                          </div>
                        </div>

                        {/* 경력 요약 */}
                        {item.experience.summary ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                            {item.experience.summary}
                          </p>
                        ) : null}

                        {/* 기술 태그 */}
                        {item.resolvedTechTags.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.resolvedTechTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 print:border print:border-stone-300 print:bg-transparent"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {/* 성과 (Bullets) */}
                        {bullets.length > 0 ? (
                          <div className="mt-4">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                              주요 성과
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-stone-700">
                              {bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {/* 성과 지표 (Metrics) */}
                        {metrics.length > 0 ? (
                          <div className="mt-4">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                              성과 지표
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {metrics.map((m) => (
                                <span
                                  key={m.key}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs print:border print:border-emerald-300 print:bg-transparent"
                                >
                                  <span className="font-medium text-emerald-700">{m.key}</span>
                                  <span className="text-emerald-600">{m.value}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {/* 메모 */}
                        {item.notes ? (
                          <p className="mt-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
                            {item.notes}
                          </p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* 풋터 */}
            <footer className="mt-10 border-t border-stone-200 pt-4 text-center text-xs text-stone-400 print:hidden">
              PoReSt로 생성된 이력서
            </footer>
          </>
        ) : null}
      </div>
    </main>
  );
}
