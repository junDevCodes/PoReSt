import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService } from "@/modules/projects";
import { toPublicProjectsListViewModel } from "@/view-models/public-portfolio";

const DEFAULT_OG_IMAGE_PATH = "/favicon.ico";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "프로젝트 목록",
  description: "공개 프로젝트 목록과 주요 기술 스택을 확인할 수 있습니다.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    type: "website",
    siteName: "Dev OS",
    url: "/projects",
    title: "프로젝트 목록 | Dev OS",
    description: "공개 프로젝트 목록과 주요 기술 스택을 확인할 수 있습니다.",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "프로젝트 목록 | Dev OS",
    description: "공개 프로젝트 목록과 주요 기술 스택을 확인할 수 있습니다.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export const revalidate = 60;

const projectsService = createProjectsService({ prisma });

export default async function ProjectsPage() {
  let projects: unknown = [];

  try {
    projects = await projectsService.listPublicProjects();
  } catch {
    projects = [];
  }

  const viewModels = toPublicProjectsListViewModel(projects);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold">프로젝트</h1>
      <p className="mt-3 max-w-2xl text-sm text-black/60">
        공개된 프로젝트를 문제 정의, 접근 방법, 결과 중심으로 정리했습니다.
      </p>

      {viewModels.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/60">
          공개 프로젝트가 아직 없습니다.
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {viewModels.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-black/60">
                {project.description ?? "설명을 준비 중입니다."}
              </p>
              <p className="mt-3 text-xs text-black/45">
                업데이트: {project.updatedAtLabel || "날짜 정보 없음"}
              </p>
              <p className="mt-3 text-xs text-black/55">
                {project.techStack.length > 0
                  ? project.techStack.join(" · ")
                  : "기술 스택 정보 없음"}
              </p>
              <Link
                href={`/projects/${project.slug}`}
                className="mt-4 inline-flex text-sm font-semibold text-black/80 hover:text-black"
              >
                상세 보기
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
