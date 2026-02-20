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
const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export async function generateMetadata({ params }: PublicProjectsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalPath = `/u/${encodeURIComponent(resolvedParams.publicSlug)}/projects`;

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
      images: [{ url: DEFAULT_OG_IMAGE_PATH }],
    },
    twitter: {
      card: "summary_large_image",
      title: "프로젝트 목록 | PoReSt",
      description: "사용자의 공개 프로젝트 목록",
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

export const revalidate = 60;

export default async function PublicProjectsByUserPage({ params }: PublicProjectsPageProps) {
  const resolvedParams = await params;
  const profilePath = `/u/${encodeURIComponent(resolvedParams.publicSlug)}`;

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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">프로젝트</h1>
        <Link href={profilePath} className="text-sm text-black/65">
          프로필로 이동
        </Link>
      </div>

      {viewModels.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/60">
          공개 프로젝트가 없습니다.
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {viewModels.map((project) => (
            <article key={project.id} className="rounded-2xl border border-black/10 bg-white p-5">
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-black/60">
                {project.description ?? "설명 정보가 없습니다."}
              </p>
              <p className="mt-3 text-xs text-black/45">
                업데이트: {project.updatedAtLabel || "날짜 정보 없음"}
              </p>
              <p className="mt-3 text-xs text-black/55">
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
        </section>
      )}
    </main>
  );
}
