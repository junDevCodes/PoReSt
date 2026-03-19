import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMetadataBase, getSiteUrl } from "@/lib/site-url";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";
import { toPublicProjectDetailViewModel } from "@/view-models/public-portfolio";
import { JsonLd } from "@/components/seo/JsonLd";

type PublicProjectDetailByUserProps = {
  params: Promise<{ publicSlug: string; slug: string }> | { publicSlug: string; slug: string };
};

const projectsService = createProjectsService({ prisma });

export async function generateMetadata({
  params,
}: PublicProjectDetailByUserProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalPath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/projects/${encodeURIComponent(resolvedParams.slug)}`;

  try {
    const project = await projectsService.getPublicProjectByPublicSlugAndSlug(
      resolvedParams.publicSlug,
      resolvedParams.slug,
    );
    const socialTitle = `${project.title} | PoReSt`;
    const description = project.subtitle || "프로젝트 상세 페이지";

    return {
      metadataBase: getMetadataBase(),
      title: project.title,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        type: "article",
        siteName: "PoReSt",
        url: canonicalPath,
        title: socialTitle,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title: socialTitle,
        description,
      },
    };
  } catch {
    return {
      metadataBase: getMetadataBase(),
      title: "프로젝트 상세",
      description: "프로젝트 상세 페이지",
      alternates: {
        canonical: canonicalPath,
      },
    };
  }
}

export const revalidate = 60;

const sectionConfig: Record<string, { icon: string; label: string }> = {
  problem: { icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z", label: "Problem" },
  approach: { icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18", label: "Approach" },
  architecture: { icon: "M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z", label: "Architecture" },
  results: { icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z", label: "Results" },
};

export default async function PublicProjectDetailByUserPage({
  params,
}: PublicProjectDetailByUserProps) {
  const resolvedParams = await params;

  let detail: Awaited<ReturnType<typeof projectsService.getPublicProjectByPublicSlugAndSlug>>;
  try {
    detail = await projectsService.getPublicProjectByPublicSlugAndSlug(
      resolvedParams.publicSlug,
      resolvedParams.slug,
    );
  } catch (error) {
    if (isProjectServiceError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const viewModel = toPublicProjectDetailViewModel(detail);
  if (!viewModel) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: viewModel.title,
    ...(viewModel.subtitle ? { description: viewModel.subtitle } : {}),
    author: {
      "@type": "Person",
      url: `${siteUrl}/portfolio/${encodeURIComponent(detail.publicSlug)}`,
    },
    dateModified: detail.updatedAt.toISOString(),
    url: `${siteUrl}/portfolio/${encodeURIComponent(detail.publicSlug)}/projects/${encodeURIComponent(detail.slug)}`,
  };

  // 콘텐츠가 있는 섹션만 필터링
  const visibleSections = (["problem", "approach", "architecture", "results"] as const).filter(
    (key) => viewModel.sections[key]?.trim(),
  );

  // 링크 섹션: repoUrl 또는 demoUrl 또는 links 텍스트가 있어야 표시
  const hasLinks = viewModel.repoUrl || viewModel.demoUrl || viewModel.sections.links?.trim();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      <JsonLd data={articleJsonLd} />
      <p className="text-xs uppercase tracking-[0.3em] text-black/70 dark:text-white/70">Case Study</p>
      <h1 className="mt-2 text-3xl font-semibold">{viewModel.title}</h1>
      {viewModel.subtitle ? <p className="mt-3 text-base text-black/70 dark:text-white/70">{viewModel.subtitle}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-black/70 dark:text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {viewModel.updatedAtLabel || "날짜 정보 없음"}
        </span>
        {viewModel.techStack.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {viewModel.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/70 dark:bg-white/10 dark:text-white/70"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <section className="mt-10 grid gap-6">
        {visibleSections.map((key) => {
          const config = sectionConfig[key];
          return (
            <article
              key={key}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-none dark:hover:border-white/20"
            >
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <svg aria-hidden="true" className="h-5 w-5 text-black/40 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
                {config.label}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/75 dark:text-white/75">
                {viewModel.sections[key]}
              </p>
            </article>
          );
        })}

        {hasLinks ? (
          <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-none dark:hover:border-white/20">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <svg aria-hidden="true" className="h-5 w-5 text-black/40 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
              </svg>
              Links
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {viewModel.repoUrl ? (
                <a
                  href={viewModel.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-black px-4 py-2 text-sm text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 dark:bg-white dark:text-black dark:focus-visible:ring-white/50"
                >
                  GitHub
                </a>
              ) : null}
              {viewModel.demoUrl ? (
                <a
                  href={viewModel.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-black/20 px-4 py-2 text-sm text-black transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white dark:hover:bg-white/5 dark:focus-visible:ring-white/20"
                >
                  Demo
                </a>
              ) : null}
            </div>
            {viewModel.sections.links ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/70 dark:text-white/70">
                {viewModel.sections.links}
              </p>
            ) : null}
          </article>
        ) : null}
      </section>

      <div className="mt-10">
        <Link
          href={`/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/projects`}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-black/70 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white"
        >
          <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">&larr;</span>
          프로젝트 목록
        </Link>
      </div>
    </main>
  );
}
