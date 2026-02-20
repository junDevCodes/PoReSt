import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";
import { toPublicHomeViewModel } from "@/view-models/public-portfolio";

type PublicPortfolioPageProps = {
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

const projectsService = createProjectsService({ prisma });
const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

function getProfileTitle(displayName: string | null, publicSlug: string) {
  return displayName ?? publicSlug;
}

function getProfileDescription(headline: string | null) {
  return headline ?? "공개 포트폴리오";
}

export async function generateMetadata({ params }: PublicPortfolioPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalPath = `/u/${encodeURIComponent(resolvedParams.publicSlug)}`;

  try {
    const portfolio = await projectsService.getPublicPortfolioBySlug(resolvedParams.publicSlug);
    const viewModel = toPublicHomeViewModel(portfolio);
    const profileTitle = getProfileTitle(viewModel.profile.displayName, resolvedParams.publicSlug);
    const socialTitle = `${profileTitle} | PoReSt`;
    const description = getProfileDescription(viewModel.profile.headline);

    return {
      metadataBase: getMetadataBase(),
      title: profileTitle,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        type: "website",
        siteName: "PoReSt",
        url: canonicalPath,
        title: socialTitle,
        description,
        images: [{ url: DEFAULT_OG_IMAGE_PATH }],
      },
      twitter: {
        card: "summary_large_image",
        title: socialTitle,
        description,
        images: [DEFAULT_OG_IMAGE_PATH],
      },
    };
  } catch {
    return {
      metadataBase: getMetadataBase(),
      title: "포트폴리오",
      description: "공개 포트폴리오",
      alternates: {
        canonical: canonicalPath,
      },
    };
  }
}

export const revalidate = 60;

export default async function PublicPortfolioPage({ params }: PublicPortfolioPageProps) {
  const resolvedParams = await params;
  const userProjectsPath = `/u/${encodeURIComponent(resolvedParams.publicSlug)}/projects`;

  let portfolio: Awaited<ReturnType<typeof projectsService.getPublicPortfolioBySlug>>;
  try {
    portfolio = await projectsService.getPublicPortfolioBySlug(resolvedParams.publicSlug);
  } catch (error) {
    if (isProjectServiceError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const viewModel = toPublicHomeViewModel(portfolio);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-black/50">Portfolio</p>
      <h1 className="mt-3 text-4xl font-semibold">
        {getProfileTitle(viewModel.profile.displayName, resolvedParams.publicSlug)}
      </h1>
      <p className="mt-2 text-lg text-black/70">{getProfileDescription(viewModel.profile.headline)}</p>
      {viewModel.profile.bio ? (
        <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/65">{viewModel.profile.bio}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={userProjectsPath}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          프로젝트 보기
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
              className="rounded-full border border-black/15 px-4 py-2 text-sm text-black/70"
            >
              {link.label}
            </a>
          ))}
        </section>
      ) : null}

      <section className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">대표 프로젝트</h2>
          <Link className="text-sm font-medium text-black/60 hover:text-black" href={userProjectsPath}>
            전체 보기
          </Link>
        </div>

        {viewModel.featuredProjects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/60">
            공개된 대표 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {viewModel.featuredProjects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-black/10 bg-white p-5">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-black/60">
                  {project.description ?? "설명 정보가 없습니다."}
                </p>
                <p className="mt-3 text-xs text-black/55">
                  {project.techStack.length > 0 ? project.techStack.join(" · ") : "기술 스택 정보 없음"}
                </p>
                <Link href={project.publicPath} className="mt-4 inline-flex text-sm font-semibold text-black/80">
                  상세 보기
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
