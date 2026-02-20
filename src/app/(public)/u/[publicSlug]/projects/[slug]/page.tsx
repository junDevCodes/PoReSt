import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";
import { toPublicProjectDetailViewModel } from "@/view-models/public-portfolio";

type PublicProjectDetailByUserProps = {
  params: Promise<{ publicSlug: string; slug: string }> | { publicSlug: string; slug: string };
};

const projectsService = createProjectsService({ prisma });
const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export async function generateMetadata({
  params,
}: PublicProjectDetailByUserProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalPath = `/u/${encodeURIComponent(resolvedParams.publicSlug)}/projects/${encodeURIComponent(resolvedParams.slug)}`;

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
      title: "프로젝트 상세",
      description: "프로젝트 상세 페이지",
      alternates: {
        canonical: canonicalPath,
      },
    };
  }
}

export const revalidate = 60;

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-black/40">Case Study</p>
      <h1 className="mt-2 text-3xl font-semibold">{viewModel.title}</h1>
      {viewModel.subtitle ? <p className="mt-3 text-base text-black/65">{viewModel.subtitle}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/55">
        <span>업데이트: {viewModel.updatedAtLabel || "날짜 정보 없음"}</span>
        {viewModel.techStack.length > 0 ? <span>기술: {viewModel.techStack.join(" · ")}</span> : null}
      </div>

      <section className="mt-10 grid gap-6">
        <article className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Problem</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/70">
            {viewModel.sections.problem || "문제 정의를 준비 중입니다."}
          </p>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Approach</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/70">
            {viewModel.sections.approach || "해결 방법을 준비 중입니다."}
          </p>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Architecture</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/70">
            {viewModel.sections.architecture || "아키텍처 설명을 준비 중입니다."}
          </p>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Results</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/70">
            {viewModel.sections.results || "결과 설명을 준비 중입니다."}
          </p>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Links</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {viewModel.repoUrl ? (
              <a
                href={viewModel.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-black px-4 py-2 text-sm text-white"
              >
                GitHub
              </a>
            ) : null}
            {viewModel.demoUrl ? (
              <a
                href={viewModel.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/20 px-4 py-2 text-sm text-black"
              >
                Demo
              </a>
            ) : null}
            {!viewModel.repoUrl && !viewModel.demoUrl ? (
              <p className="text-sm text-black/60">등록된 링크가 없습니다.</p>
            ) : null}
          </div>
          {viewModel.sections.links ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/65">
              {viewModel.sections.links}
            </p>
          ) : null}
        </article>
      </section>

      <div className="mt-10">
        <Link
          href={`/u/${encodeURIComponent(resolvedParams.publicSlug)}/projects`}
          className="text-sm font-semibold text-black/70 hover:text-black"
        >
          프로젝트 목록으로 이동
        </Link>
      </div>
    </main>
  );
}
