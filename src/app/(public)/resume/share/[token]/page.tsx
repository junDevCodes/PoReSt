"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
  return parsed.toISOString().replace("T", " ").slice(0, 16);
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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Shared Resume</p>
          <h1 className="mt-2 text-3xl font-semibold">이력서 공유 보기</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/30 px-4 py-2 text-sm">
          홈으로
        </Link>
      </header>

      {isLoading ? <p className="mt-8 text-sm text-white/60">공유 이력서를 불러오는 중입니다.</p> : null}
      {error ? (
        <p className="mt-8 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && preview ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">{preview.resume.title}</h2>
          <p className="mt-2 text-sm text-white/70">
            {preview.resume.targetCompany ?? "회사 미지정"} / {preview.resume.targetRole ?? "직무 미지정"}
            {preview.resume.level ? ` / ${preview.resume.level}` : ""}
          </p>
          <p className="mt-1 text-xs text-white/50">업데이트: {formatDateLabel(preview.resume.updatedAt)}</p>

          {preview.resume.summaryMd ? (
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/80">
              {preview.resume.summaryMd}
            </pre>
          ) : null}

          <div className="mt-6 space-y-3">
            {preview.items.map((item) => (
              <article key={item.itemId} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium">
                  {item.sortOrder}. {item.experience.company} / {item.experience.role}
                </p>
                <p className="mt-1 text-xs text-white/65">
                  기술: {item.resolvedTechTags.length > 0 ? item.resolvedTechTags.join(", ") : "없음"}
                </p>
                <pre className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/70">
                  {`bullets: ${JSON.stringify(item.resolvedBulletsJson)}`}
                </pre>
                <pre className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/70">
                  {`metrics: ${JSON.stringify(item.resolvedMetricsJson)}`}
                </pre>
                {item.notes ? <p className="mt-2 text-xs text-white/70">메모: {item.notes}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
