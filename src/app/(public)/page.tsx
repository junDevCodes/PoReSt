import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService } from "@/modules/projects";
import { toPublicHomeViewModel } from "@/view-models/public-portfolio";

const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "PoReSt 포트폴리오",
  description: "프로젝트와 경력을 중심으로 문제 해결 과정을 공개하는 포트폴리오입니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "PoReSt",
    url: "/",
    title: "PoReSt 포트폴리오",
    description: "프로젝트와 경력을 중심으로 문제 해결 과정을 공개하는 포트폴리오입니다.",
    images: [{ url: DEFAULT_OG_IMAGE_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoReSt 포트폴리오",
    description: "프로젝트와 경력을 중심으로 문제 해결 과정을 공개하는 포트폴리오입니다.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export const revalidate = 60;

const projectsService = createProjectsService({ prisma });

function buildPublicLinks(publicSlug: string | null) {
  if (!publicSlug) {
    return {
      profilePath: "/projects",
      projectsPath: "/projects",
    };
  }

  const encoded = encodeURIComponent(publicSlug);
  return {
    profilePath: `/u/${encoded}`,
    projectsPath: `/u/${encoded}/projects`,
  };
}

function getPrimaryTitle(displayName: string | null) {
  return displayName ?? "문제 해결을 기록하는 개발자 포트폴리오";
}

function getPrimaryHeadline(headline: string | null) {
  return headline ?? "프로젝트의 맥락, 설계, 결과를 명확하게 전달합니다.";
}

function getPrimaryBio(bio: string | null) {
  return (
    bio ??
    "PoReSt는 공개 포트폴리오와 개인 작업공간을 함께 제공하는 서비스입니다. 프로젝트와 경력을 구조화해 빠르게 공유할 수 있습니다."
  );
}

export default async function HomePage() {
  let portfolio: unknown = {
    profile: null,
    featuredProjects: [],
    featuredExperiences: [],
  };

  try {
    portfolio = await projectsService.getPublicPortfolio();
  } catch {
    portfolio = {
      profile: null,
      featuredProjects: [],
      featuredExperiences: [],
    };
  }

  const viewModel = toPublicHomeViewModel(portfolio);
  const links = buildPublicLinks(viewModel.publicSlug);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f5f2] text-[#1a1a1a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-300/40 blur-[120px]" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/40 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-200/40 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Portfolio</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
          {getPrimaryTitle(viewModel.profile.displayName)}
        </h1>
        <p className="mt-2 text-xl text-black/70">{getPrimaryHeadline(viewModel.profile.headline)}</p>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/60">{getPrimaryBio(viewModel.profile.bio)}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90"
            href={links.projectsPath}
          >
            프로젝트 보기
          </Link>
          <Link
            className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black/40"
            href="/users"
          >
            사용자 디렉토리
          </Link>
        </div>

        {viewModel.profile.links.length > 0 ? (
          <section className="mt-6 flex flex-wrap gap-3">
            {viewModel.profile.links.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/15 px-4 py-2 text-sm text-black/70 transition hover:border-black/35 hover:text-black"
              >
                {link.label}
              </a>
            ))}
          </section>
        ) : null}

        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">대표 프로젝트</h2>
            <Link className="text-sm font-medium text-black/60 hover:text-black" href={links.projectsPath}>
              전체 보기
            </Link>
          </div>

          {viewModel.featuredProjects.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6 text-sm text-black/60">
              아직 공개된 대표 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {viewModel.featuredProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border border-black/10 bg-white/75 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur"
                >
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-black/60">
                    {project.description ?? "설명이 아직 등록되지 않았습니다."}
                  </p>
                  <p className="mt-3 text-xs text-black/50">
                    {project.techStack.length > 0 ? project.techStack.join(" · ") : "기술 스택 정보 없음"}
                  </p>
                  <Link
                    href={project.publicPath}
                    className="mt-4 inline-flex text-sm font-semibold text-black/80 hover:text-black"
                  >
                    상세 보기
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">연락 링크</h2>
          <p className="mt-3 text-sm text-black/60">
            협업, 기술 논의, 인터뷰 제안은 아래 링크로 연락해 주세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {viewModel.profile.links.length === 0 ? (
              <p className="text-sm text-black/60">공개된 연락 링크가 없습니다.</p>
            ) : (
              viewModel.profile.links.map((link) => (
                <a
                  key={`contact-${link.label}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-black px-4 py-2 text-sm text-white"
                >
                  {link.label}
                </a>
              ))
            )}
          </div>
          {viewModel.publicSlug ? (
            <div className="mt-4">
              <Link className="text-sm font-medium text-black/70 hover:text-black" href={links.profilePath}>
                개인 공개 페이지로 이동
              </Link>
            </div>
          ) : null}
        </section>

        <footer className="mt-16 border-t border-black/10 pt-6 text-sm text-black/55">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>워크스페이스 로그인이 필요한 경우 아래 링크를 사용하세요.</p>
            <Link href="/login" className="font-semibold text-black/70 hover:text-black">
              로그인
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
