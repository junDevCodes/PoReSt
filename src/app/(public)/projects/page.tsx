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
  description: "공개된 프로젝트 목록과 핵심 기술 스택을 확인할 수 있습니다.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    type: "website",
    siteName: "Dev OS",
    url: "/projects",
    title: "프로젝트 목록 | Dev OS",
    description: "공개된 프로젝트 목록과 핵심 기술 스택을 확인할 수 있습니다.",
    images: [{ url: DEFAULT_OG_IMAGE_PATH }],
  },
  twitter: {
    card: "summary",
    title: "프로젝트 목록 | Dev OS",
    description: "공개된 프로젝트 목록과 핵심 기술 스택을 확인할 수 있습니다.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export const revalidate = 60;

const projectsService = createProjectsService({ prisma });

type ProjectsPageProps = {
  searchParams:
    | Promise<{
        q?: string;
        tag?: string;
        publicSlug?: string;
        limit?: string;
        cursor?: string;
      }>
    | {
        q?: string;
        tag?: string;
        publicSlug?: string;
        limit?: string;
        cursor?: string;
      };
};

function toNumberOrUndefined(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPageHref(
  params: {
    q?: string;
    tag?: string;
    publicSlug?: string;
    limit?: string;
  },
  cursor: string,
): string {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.tag) {
    search.set("tag", params.tag);
  }
  if (params.publicSlug) {
    search.set("publicSlug", params.publicSlug);
  }
  if (params.limit) {
    search.set("limit", params.limit);
  }
  search.set("cursor", cursor);
  return `/projects?${search.toString()}`;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolvedSearchParams = await searchParams;
  let projects: unknown = [];
  let nextCursor: string | null = null;

  try {
    const result = await projectsService.searchPublicProjects({
      q: resolvedSearchParams.q,
      tag: resolvedSearchParams.tag,
      publicSlug: resolvedSearchParams.publicSlug,
      cursor: resolvedSearchParams.cursor,
      limit: toNumberOrUndefined(resolvedSearchParams.limit),
    });
    projects = result.items;
    nextCursor = result.nextCursor;
  } catch {
    projects = [];
    nextCursor = null;
  }

  const viewModels = toPublicProjectsListViewModel(projects);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold">프로젝트</h1>
      <p className="mt-3 max-w-2xl text-sm text-black/60">
        공개 프로젝트를 문제 정의, 접근 방식, 결과 관점으로 정리했습니다.
      </p>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
        <form className="grid gap-3 md:grid-cols-4" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={resolvedSearchParams.q ?? ""}
            placeholder="검색어"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="tag"
            defaultValue={resolvedSearchParams.tag ?? ""}
            placeholder="태그 (예: react)"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="publicSlug"
            defaultValue={resolvedSearchParams.publicSlug ?? ""}
            placeholder="작성자 publicSlug"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex rounded-lg border border-black px-3 py-2 text-sm font-semibold text-black"
            >
              필터 적용
            </button>
            <Link href="/projects" className="text-sm text-black/60 hover:text-black">
              초기화
            </Link>
          </div>
        </form>
      </section>

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
                {project.description ?? "설명이 아직 없습니다."}
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

      {nextCursor ? (
        <div className="mt-8">
          <Link
            href={buildPageHref(
              {
                q: resolvedSearchParams.q,
                tag: resolvedSearchParams.tag,
                publicSlug: resolvedSearchParams.publicSlug,
                limit: resolvedSearchParams.limit,
              },
              nextCursor,
            )}
            className="inline-flex rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black"
          >
            다음 페이지 보기
          </Link>
        </div>
      ) : null}
    </main>
  );
}
