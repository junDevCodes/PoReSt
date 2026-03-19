import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";
import { toPublicProjectsListViewModel } from "@/view-models/public-portfolio";

type PublicProjectsPageProps = {
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

const projectsService = createProjectsService({ prisma });

export async function generateMetadata({ params }: PublicProjectsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalPath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/projects`;

  return {
    metadataBase: getMetadataBase(),
    title: "프로젝트 목록",
    description: "사용자의 공개 프로젝트 목록",
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      siteName: "PoReSt",
      url: canonicalPath,
      title: "프로젝트 목록 | PoReSt",
      description: "사용자의 공개 프로젝트 목록",
    },
    twitter: {
      card: "summary_large_image",
      title: "프로젝트 목록 | PoReSt",
      description: "사용자의 공개 프로젝트 목록",
    },
  };
}

export const revalidate = 60;

export default async function PublicProjectsByUserPage({ params }: PublicProjectsPageProps) {
  const resolvedParams = await params;
  const profilePath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}`;

  let projects: Awaited<ReturnType<typeof projectsService.listPublicProjectsByPublicSlug>>;
  try {
    projects = await projectsService.listPublicProjectsByPublicSlug(resolvedParams.publicSlug);
  } catch (error) {
    if (isProjectServiceError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const viewModels = toPublicProjectsListViewModel(projects);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">프로젝트</h1>
        <Link
          href={profilePath}
          className="group inline-flex items-center gap-1 text-sm text-black/70 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white"
        >
          <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">&larr;</span>
          프로필로 이동
        </Link>
      </div>

      {viewModels.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/65 shadow-sm dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white/65 dark:shadow-none">
          공개 프로젝트가 없습니다.
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {viewModels.map((project) => (
            <Link
              key={project.id}
              href={project.publicPath}
              className="group block rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-none dark:hover:border-white/20 dark:focus-visible:ring-white/20"
            >
              <h2 className="text-xl font-semibold transition-colors group-hover:text-black/80 dark:group-hover:text-white/90">
                {project.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-black/65 dark:text-white/65">
                {project.description ?? "설명 정보가 없습니다."}
              </p>

              {project.techStack.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/70 dark:bg-white/10 dark:text-white/70"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-3 text-xs text-black/65 dark:text-white/65">
                {project.updatedAtLabel || "날짜 정보 없음"}
              </p>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-black/80 transition-colors group-hover:text-black dark:text-white/80 dark:group-hover:text-white">
                상세 보기
                <svg aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
