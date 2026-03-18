import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainLinkEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";

type ExperiencesPageProps = {
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

export async function generateMetadata({ params }: ExperiencesPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalPath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/experiences`;

  const settings = await prisma.portfolioSettings.findFirst({
    where: { publicSlug: resolvedParams.publicSlug, isPublic: true },
    select: { displayName: true },
  });

  const displayName = settings?.displayName ?? resolvedParams.publicSlug;

  return {
    metadataBase: getMetadataBase(),
    title: `${displayName}의 경력 | PoReSt`,
    description: `${displayName}의 경력 정보`,
    alternates: { canonical: canonicalPath },
  };
}

export const revalidate = 60;

export default async function PublicExperiencesPage({ params }: ExperiencesPageProps) {
  const resolvedParams = await params;
  const profilePath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}`;

  const settings = await prisma.portfolioSettings.findFirst({
    where: { publicSlug: resolvedParams.publicSlug, isPublic: true },
    select: { ownerId: true, displayName: true },
  });

  if (!settings) {
    notFound();
  }

  // 병렬 페칭: experiences + entityLinks + publicProjects 동시 실행
  const [experiences, entityLinks, publicProjects] = await Promise.all([
    prisma.experience.findMany({
      where: {
        ownerId: settings.ownerId,
        visibility: "PUBLIC",
      },
      orderBy: [{ startDate: "desc" }, { order: "asc" }],
      select: {
        id: true,
        company: true,
        role: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
        summary: true,
        bulletsJson: true,
        metricsJson: true,
        techTags: true,
      },
    }),
    prisma.domainLink.findMany({
      where: {
        ownerId: settings.ownerId,
        OR: [
          { sourceType: DomainLinkEntityType.EXPERIENCE, targetType: DomainLinkEntityType.PROJECT },
          { sourceType: DomainLinkEntityType.PROJECT, targetType: DomainLinkEntityType.EXPERIENCE },
        ],
      },
      select: { sourceType: true, sourceId: true, targetType: true, targetId: true },
    }),
    prisma.project.findMany({
      where: { ownerId: settings.ownerId, visibility: "PUBLIC" },
      select: { id: true, slug: true, title: true },
    }),
  ]);
  const projectMap = new Map(publicProjects.map((p) => [p.id, p]));

  const experienceProjectMap = new Map<string, Array<{ id: string; slug: string; title: string }>>();
  for (const link of entityLinks) {
    const expId = link.sourceType === DomainLinkEntityType.EXPERIENCE ? link.sourceId : link.targetId;
    const projId = link.sourceType === DomainLinkEntityType.PROJECT ? link.sourceId : link.targetId;
    const proj = projectMap.get(projId);
    if (!proj) continue;
    const arr = experienceProjectMap.get(expId) ?? [];
    if (!arr.some((p) => p.id === proj.id)) arr.push(proj);
    experienceProjectMap.set(expId, arr);
  }

  function formatPeriod(startDate: Date, endDate: Date | null) {
    const start = startDate.toISOString().slice(0, 7);
    if (endDate) {
      return `${start} ~ ${endDate.toISOString().slice(0, 7)}`;
    }
    return `${start} ~ 현재`;
  }

  function parseBullets(json: unknown): string[] {
    if (Array.isArray(json)) {
      return json.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
    return [];
  }

  function parseMetrics(json: unknown): Array<{ label: string; value: string }> {
    if (!Array.isArray(json)) {
      return [];
    }
    return json.filter(
      (item): item is { label: string; value: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).label === "string" &&
        typeof (item as Record<string, unknown>).value === "string",
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      <Link
        href={profilePath}
        className="group mb-8 inline-flex w-fit items-center gap-1 text-sm text-black/65 transition-colors hover:text-black dark:text-white/65 dark:hover:text-white"
      >
        <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">&larr;</span>
        프로필로
      </Link>

      <h1 className="text-3xl font-semibold">경력</h1>

      {experiences.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/65 shadow-sm dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white/65 dark:shadow-none">
          공개된 경력 정보가 없습니다.
        </div>
      ) : (
        <div className="relative mt-8">
          {/* 타임라인 세로 연결선 */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-black/10 dark:bg-white/10" />

          <div className="space-y-6">
            {experiences.map((exp, index) => {
              const bullets = parseBullets(exp.bulletsJson);
              const metrics = parseMetrics(exp.metricsJson);
              const isLast = index === experiences.length - 1;

              return (
                <div key={exp.id} className="relative pl-10">
                  {/* 타임라인 도트 */}
                  <div
                    className={`absolute left-0 top-6 h-[22px] w-[22px] rounded-full border-[3px] ${
                      exp.isCurrent
                        ? "border-emerald-500 bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-900/40"
                        : "border-black/20 bg-white dark:border-white/30 dark:bg-[#1e1e1e]"
                    }`}
                  />
                  {/* 현재 재직 중 도트 내부 펄스 */}
                  {exp.isCurrent && (
                    <div className="absolute left-[7px] top-[31px] h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  )}

                  <article
                    className={`rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-none dark:hover:border-white/20 ${
                      isLast ? "" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">{exp.company}</h2>
                      {exp.isCurrent ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          재직 중
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-medium text-black/75 dark:text-white/75">{exp.role}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatPeriod(exp.startDate, exp.endDate)}
                    </p>

                    {exp.summary ? (
                      <p className="mt-3 text-sm leading-relaxed text-black/70 dark:text-white/70">{exp.summary}</p>
                    ) : null}

                    {bullets.length > 0 ? (
                      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-black/70 dark:text-white/70">
                        {bullets.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}

                    {metrics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {metrics.map((metric, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {metric.label}: {metric.value}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {exp.techTags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {exp.techTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/70 dark:bg-white/10 dark:text-white/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {(experienceProjectMap.get(exp.id) ?? []).length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-black/50 dark:text-white/50">관련 프로젝트:</span>
                        {(experienceProjectMap.get(exp.id) ?? []).map((proj) => (
                          <Link
                            key={proj.id}
                            href={`/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/projects/${encodeURIComponent(proj.slug)}`}
                            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                          >
                            {proj.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
