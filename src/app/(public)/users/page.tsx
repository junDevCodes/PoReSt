import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService } from "@/modules/projects";
import {
  buildUsersPageHref,
  parsePublicUsersSearchParams,
} from "@/app/(public)/users/_lib/directory";

const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "공개 사용자",
  description: "publicSlug 기반으로 공개 사용자와 프로젝트를 탐색할 수 있습니다.",
  alternates: {
    canonical: "/users",
  },
  openGraph: {
    type: "website",
    siteName: "PoReSt",
    url: "/users",
    title: "공개 사용자 | PoReSt",
    description: "공개 사용자 디렉토리에서 프로필과 프로젝트를 탐색해 보세요.",
    images: [{ url: DEFAULT_OG_IMAGE_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: "공개 사용자 | PoReSt",
    description: "공개 사용자 디렉토리에서 프로필과 프로젝트를 탐색해 보세요.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export const revalidate = 60;

const projectsService = createProjectsService({ prisma });

type UsersPageProps = {
  searchParams:
    | Promise<{
        q?: string;
        limit?: string;
        cursor?: string;
      }>
    | {
        q?: string;
        limit?: string;
        cursor?: string;
      };
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const parsedSearchParams = parsePublicUsersSearchParams(resolvedSearchParams);

  let items: Awaited<ReturnType<typeof projectsService.searchPublicUsersDirectory>>["items"] = [];
  let nextCursor: string | null = null;

  try {
    const result = await projectsService.searchPublicUsersDirectory(parsedSearchParams);
    items = result.items;
    nextCursor = result.nextCursor;
  } catch {
    items = [];
    nextCursor = null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold">공개 사용자 디렉토리</h1>
      <p className="mt-3 max-w-2xl text-sm text-black/60">
        publicSlug를 기준으로 공개 프로필을 탐색하고 프로젝트 목록으로 바로 이동할 수 있습니다.
      </p>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
        <form className="grid gap-3 md:grid-cols-3" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={resolvedSearchParams.q ?? ""}
            placeholder="publicSlug 또는 이름 검색"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            max={50}
            name="limit"
            defaultValue={resolvedSearchParams.limit ?? "20"}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex rounded-lg border border-black px-3 py-2 text-sm font-semibold text-black"
            >
              검색
            </button>
            <Link href="/users" className="text-sm text-black/60 hover:text-black">
              초기화
            </Link>
          </div>
        </form>
      </section>

      {items.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/60">
          검색 조건에 맞는 공개 사용자가 없습니다.
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {items.map((item) => {
            const profilePath = `/u/${encodeURIComponent(item.publicSlug)}`;
            const projectsPath = `/u/${encodeURIComponent(item.publicSlug)}/projects`;
            return (
              <article
                key={item.publicSlug}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">{item.publicSlug}</p>
                <h2 className="mt-2 text-xl font-semibold">{item.displayName ?? item.publicSlug}</h2>
                <p className="mt-2 text-sm text-black/60">
                  {item.headline ?? "소개 문구가 아직 등록되지 않았습니다."}
                </p>
                <p className="mt-3 text-xs text-black/50">
                  공개 프로젝트 {item.projectCount}개 · 업데이트 {new Date(item.updatedAt).toISOString().slice(0, 10)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={profilePath}
                    className="inline-flex rounded-lg border border-black px-3 py-2 text-sm font-semibold text-black"
                  >
                    프로필 보기
                  </Link>
                  <Link
                    href={projectsPath}
                    className="inline-flex rounded-lg border border-black/20 px-3 py-2 text-sm text-black/80"
                  >
                    프로젝트
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {nextCursor ? (
        <div className="mt-8">
          <Link
            href={buildUsersPageHref(
              {
                q: resolvedSearchParams.q,
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
