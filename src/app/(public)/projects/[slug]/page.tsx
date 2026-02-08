import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createProjectsService,
  isProjectServiceError,
} from "@/modules/projects";
import { toPublicProjectDetailViewModel } from "@/view-models/public-portfolio";

type ProjectDetailProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export const revalidate = 60;

const projectsService = createProjectsService({ prisma });

export async function generateMetadata({
  params,
}: ProjectDetailProps): Promise<Metadata> {
  const resolvedParams = await params;

  try {
    const project = await projectsService.getPublicProjectBySlug(resolvedParams.slug);
    return {
      title: `${project.title} | Dev OS`,
      description: project.subtitle ?? "프로젝트 상세 페이지",
    };
  } catch {
    return {
      title: "프로젝트 상세 | Dev OS",
      description: "프로젝트 상세 페이지",
    };
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const resolvedParams = await params;

  let detail;
  try {
    detail = await projectsService.getPublicProjectBySlug(resolvedParams.slug);
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
      {viewModel.subtitle ? (
        <p className="mt-3 text-base text-black/65">{viewModel.subtitle}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/55">
        <span>업데이트: {viewModel.updatedAtLabel || "날짜 정보 없음"}</span>
        {viewModel.techStack.length > 0 ? (
          <span>기술: {viewModel.techStack.join(" · ")}</span>
        ) : null}
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
            {viewModel.sections.approach || "접근 방법을 준비 중입니다."}
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
            {viewModel.sections.results || "성과 설명을 준비 중입니다."}
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
              <p className="text-sm text-black/60">
                외부 링크를 준비 중입니다.
              </p>
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
        <Link href="/projects" className="text-sm font-semibold text-black/70 hover:text-black">
          프로젝트 목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
