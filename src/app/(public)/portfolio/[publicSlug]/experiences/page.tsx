import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  const experiences = await prisma.experience.findMany({
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
  });

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
        className="mb-8 inline-flex items-center gap-1 text-sm text-black/65 hover:text-black dark:text-white/65 dark:hover:text-white"
      >
        ← 프로필로
      </Link>

      <h1 className="text-3xl font-semibold">경력</h1>

      {experiences.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/65 dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white/65">
          공개된 경력 정보가 없습니다.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {experiences.map((exp) => {
            const bullets = parseBullets(exp.bulletsJson);
            const metrics = parseMetrics(exp.metricsJson);

            return (
              <article
                key={exp.id}
                className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#1e1e1e]"
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
                <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                  {formatPeriod(exp.startDate, exp.endDate)}
                </p>

                {exp.summary ? (
                  <p className="mt-3 text-sm text-black/70 dark:text-white/70">{exp.summary}</p>
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
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
