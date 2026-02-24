import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService } from "@/modules/projects";

const DEFAULT_OG_IMAGE_PATH = "/og-default.png";
const SHOWCASE_LIMIT = 5;

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "PoReSt | 공개 포트폴리오와 개인 워크스페이스",
  description: "PoReSt에서 공개 포트폴리오를 발행하고 개인 워크스페이스에서 프로젝트와 경력을 관리하세요.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "PoReSt",
    url: "/",
    title: "PoReSt | 공개 포트폴리오와 개인 워크스페이스",
    description: "PoReSt에서 공개 포트폴리오를 발행하고 개인 워크스페이스에서 프로젝트와 경력을 관리하세요.",
    images: [{ url: DEFAULT_OG_IMAGE_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoReSt | 공개 포트폴리오와 개인 워크스페이스",
    description: "PoReSt에서 공개 포트폴리오를 발행하고 개인 워크스페이스에서 프로젝트와 경력을 관리하세요.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export const revalidate = 60;

const projectsService = createProjectsService({ prisma });

function formatDateLabel(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default async function HomePage() {
  let recommended: Awaited<ReturnType<typeof projectsService.getHomeShowcase>>["recommended"] = [];
  let latest: Awaited<ReturnType<typeof projectsService.getHomeShowcase>>["latest"] = [];

  try {
    const showcase = await projectsService.getHomeShowcase();
    recommended = showcase.recommended.slice(0, SHOWCASE_LIMIT);
    latest = showcase.latest.slice(0, SHOWCASE_LIMIT);
  } catch {
    recommended = [];
    latest = [];
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f5f2] text-[#1a1a1a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-300/40 blur-[120px]" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/40 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-200/40 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-20">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">PoReSt</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            공개 포트폴리오를 운영하고
            <br />
            개인 워크스페이스로 성장 기록을 관리하세요
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/65">
            PoReSt는 공개 URL 포트폴리오와 개인 작업공간을 한 앱으로 제공합니다. 프로젝트, 경력, 이력서,
            노트, 블로그를 관리하고 공유 가능한 링크로 바로 발행할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
            >
              회원가입
            </Link>
            <Link
              href="/projects"
              className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
            >
              공개 프로젝트 탐색
            </Link>
            <Link
              href="/users"
              className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
            >
              사용자 디렉토리
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">추천 Top 5</h2>
              <span className="text-xs text-black/50">휴리스틱 점수 기반</span>
            </div>
            {recommended.length === 0 ? (
              <p className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/60">
                추천 포트폴리오를 준비 중입니다.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recommended.map((item) => (
                  <li key={`recommended-${item.publicSlug}`} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">
                          {item.displayName ?? item.publicSlug}
                        </h3>
                        <p className="mt-1 text-xs text-black/60">{item.headline ?? "헤드라인이 없습니다."}</p>
                        <p className="mt-2 text-xs text-black/50">
                          공개 프로젝트 {item.publicProjectCount}개 · 대표 {item.featuredPublicProjectCount}개 · 업데이트{" "}
                          {formatDateLabel(item.updatedAt)}
                        </p>
                      </div>
                      <Link
                        href={`/u/${encodeURIComponent(item.publicSlug)}`}
                        className="rounded-lg border border-black/20 px-3 py-1.5 text-xs font-semibold text-black/80"
                      >
                        보기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">최근 업데이트</h2>
              <span className="text-xs text-black/50">포트폴리오 수정일 기준</span>
            </div>
            {latest.length === 0 ? (
              <p className="mt-4 rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/60">
                최근 업데이트 데이터가 없습니다.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {latest.map((item) => (
                  <li key={`latest-${item.publicSlug}`} className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">
                          {item.displayName ?? item.publicSlug}
                        </h3>
                        <p className="mt-1 text-xs text-black/60">{item.headline ?? "헤드라인이 없습니다."}</p>
                        <p className="mt-2 text-xs text-black/50">
                          업데이트 {formatDateLabel(item.updatedAt)} · 공개 프로젝트 {item.publicProjectCount}개
                        </p>
                      </div>
                      <Link
                        href={`/u/${encodeURIComponent(item.publicSlug)}/projects`}
                        className="rounded-lg border border-black/20 px-3 py-1.5 text-xs font-semibold text-black/80"
                      >
                        프로젝트
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="mt-14 rounded-2xl border border-black/10 bg-white/75 p-6">
          <h2 className="text-2xl font-semibold">시작 방법</h2>
          <ol className="mt-4 grid gap-3 text-sm text-black/70 md:grid-cols-3">
            <li className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
              1. GitHub로 로그인 또는 회원가입
            </li>
            <li className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
              2. 워크스페이스에서 포트폴리오/프로젝트 작성
            </li>
            <li className="rounded-xl border border-black/10 bg-[#faf9f6] p-4">
              3. 공개 URL(`/u/[publicSlug]`) 발행 후 공유
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
