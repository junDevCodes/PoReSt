import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainLinkEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMetadataBase, getSiteUrl } from "@/lib/site-url";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";
import { createTestimonialService, type PublicTestimonialDto } from "@/modules/testimonials";
import { toPublicHomeViewModel, type PublicHomeViewModel } from "@/view-models/public-portfolio";
import { PrivatePortfolioPage } from "@/components/portfolio/PrivatePortfolioPage";
import { JsonLd } from "@/components/seo/JsonLd";
import type { LayoutSectionId } from "@/modules/portfolio-settings/interface";

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case "GITHUB":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
      );
    case "LINKEDIN":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
        </svg>
      );
    case "INSTAGRAM":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
        </svg>
      );
    case "TWITTER":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
        </svg>
      );
    case "YOUTUBE":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z" />
        </svg>
      );
    case "VELOG":
    case "TISTORY":
    case "WEBSITE":
    default:
      return null;
  }
}

type PublicPortfolioPageProps = {
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

const projectsService = createProjectsService({ prisma });
const testimonialService = createTestimonialService({ prisma });

function getProfileTitle(displayName: string | null, publicSlug: string) {
  return displayName ?? publicSlug;
}

function getProfileDescription(headline: string | null) {
  return headline ?? "공개 포트폴리오";
}

export async function generateMetadata({ params }: PublicPortfolioPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const canonicalPath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}`;

  try {
    const portfolio = await projectsService.getPublicPortfolioBySlug(resolvedParams.publicSlug);
    const viewModel = toPublicHomeViewModel(portfolio);
    const profileTitle = getProfileTitle(viewModel.profile.displayName, resolvedParams.publicSlug);
    const socialTitle = `${profileTitle} | PoReSt`;
    const description = getProfileDescription(viewModel.profile.headline);

    return {
      metadataBase: getMetadataBase(),
      title: profileTitle,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        type: "website",
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
      title: "포트폴리오",
      description: "공개 포트폴리오",
      alternates: {
        canonical: canonicalPath,
      },
    };
  }
}

export const revalidate = 60;

/* ── Section renderers ─────────────────────────────── */

function ProjectsSection({
  viewModel,
  userProjectsPath,
}: {
  viewModel: PublicHomeViewModel;
  userProjectsPath: string;
}) {
  return (
    <section className="animate-fade-in-up mt-16">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          <span className="mr-2 inline-block h-6 w-1 rounded-full bg-black/80 align-middle dark:bg-white/80" aria-hidden="true" />
          대표 프로젝트
        </h2>
        <Link className="group text-sm font-medium text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white" href={userProjectsPath}>
          전체 보기 <span className="link-arrow">→</span>
        </Link>
      </div>

      {viewModel.featuredProjects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/65 dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white/65">
          공개된 대표 프로젝트가 없습니다.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {viewModel.featuredProjects.map((project) => (
            <Link key={project.id} href={project.publicPath} className="group block">
              <article className="h-full rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-none dark:hover:border-white/20">
                <h3 className="text-lg font-semibold group-hover:text-black/90 dark:group-hover:text-white/90">{project.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-black/65 dark:text-white/65">
                  {project.description ?? "설명 정보가 없습니다."}
                </p>
                {project.techStack.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 5).map((tech) => (
                      <span key={tech} className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/60 dark:bg-white/10 dark:text-white/60">
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 5 ? (
                      <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/45 dark:bg-white/10 dark:text-white/45">
                        +{project.techStack.length - 5}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-black/70 transition-colors group-hover:text-black dark:text-white/70 dark:group-hover:text-white">
                  상세 보기 <span className="link-arrow ml-1">→</span>
                </span>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ExperiencesSection({
  viewModel,
  experiencesPath,
  experienceProjects,
  projectTitleMap,
  publicSlug,
}: {
  viewModel: PublicHomeViewModel;
  experiencesPath: string;
  experienceProjects: Map<string, string[]>;
  projectTitleMap: Map<string, string>;
  publicSlug: string;
}) {
  if (viewModel.featuredExperiences.length === 0) return null;

  return (
    <section className="animate-fade-in-up mt-16">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          <span className="mr-2 inline-block h-6 w-1 rounded-full bg-black/80 align-middle dark:bg-white/80" aria-hidden="true" />
          경력
        </h2>
        <Link className="group text-sm font-medium text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white" href={experiencesPath}>
          전체 보기 <span className="link-arrow">→</span>
        </Link>
      </div>
      <div className="relative mt-6 space-y-4 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-black/10 dark:before:bg-white/10">
        {viewModel.featuredExperiences.map((exp) => (
          <article key={exp.id} className="relative rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-none dark:hover:border-white/20">
            <span className="absolute -left-6 top-6 h-3 w-3 rounded-full border-2 border-black/20 bg-[#f6f5f2] dark:border-white/20 dark:bg-[#111111]" />
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{exp.company}</h3>
              {exp.isCurrent ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  재직 중
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-medium text-black/75 dark:text-white/75">{exp.role}</p>
            <p className="mt-1 text-xs text-black/65 dark:text-white/65">{exp.period}</p>
            {exp.summary ? (
              <p className="mt-2 text-sm text-black/65 dark:text-white/65">{exp.summary}</p>
            ) : null}
            {exp.techTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {exp.techTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/70 dark:bg-white/10 dark:text-white/70">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {(experienceProjects.get(exp.id) ?? []).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-xs font-medium text-black/65 dark:text-white/65">관련 프로젝트:</span>
                {(experienceProjects.get(exp.id) ?? []).map((projId) => (
                  <Link
                    key={projId}
                    href={`/portfolio/${encodeURIComponent(publicSlug)}/projects/${encodeURIComponent(viewModel.featuredProjects.find((p) => p.id === projId)?.slug ?? projId)}`}
                    className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    {projectTitleMap.get(projId) ?? projId}
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <Link
        href={experiencesPath}
        className="group mt-4 inline-flex text-sm font-semibold text-black/70 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white"
      >
        경력 전체 보기 <span className="link-arrow ml-1">→</span>
      </Link>
    </section>
  );
}

const CATEGORY_CLASS_MAP: Record<string, string> = {
  Frontend: "skill-cat-frontend",
  Backend: "skill-cat-backend",
  DevOps: "skill-cat-devops",
  Mobile: "skill-cat-mobile",
  Database: "skill-cat-database",
};

function getSkillCategoryClass(category: string): string {
  for (const [key, cls] of Object.entries(CATEGORY_CLASS_MAP)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return "skill-cat-other";
}

function SkillsSection({
  skillGroups,
}: {
  skillGroups: Map<string, Array<{ id: string; name: string; category: string | null; level: number | null }>>;
}) {
  if (skillGroups.size === 0) return null;

  return (
    <section className="animate-fade-in-up mt-16">
      <h2 className="text-2xl font-bold">
        <span className="mr-2 inline-block h-6 w-1 rounded-full bg-black/80 align-middle dark:bg-white/80" aria-hidden="true" />
        기술 스택
      </h2>
      <div className="mt-6 space-y-5">
        {Array.from(skillGroups.entries()).map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/65 dark:text-white/65">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((skill) => (
                <span
                  key={skill.id}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ${getSkillCategoryClass(category)}`}
                >
                  {skill.name}
                  {skill.level !== null ? (
                    <span className="text-xs opacity-50">
                      {"●".repeat(skill.level)}{"○".repeat(5 - skill.level)}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`평점 ${rating}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            fill={i < rating ? "#f59e0b" : "none"}
            stroke={i < rating ? "#f59e0b" : "#d1d5db"}
            strokeWidth="1"
          />
        </svg>
      ))}
    </div>
  );
}

function TestimonialsSection({
  testimonials,
}: {
  testimonials: PublicTestimonialDto[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="animate-fade-in-up mt-16">
      <h2 className="text-2xl font-bold">
        <span className="mr-2 inline-block h-6 w-1 rounded-full bg-black/80 align-middle dark:bg-white/80" aria-hidden="true" />
        추천서
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {testimonials.map((t) => (
          <div key={t.id} className="relative rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-none">
            <span className="absolute top-4 right-5 text-4xl leading-none text-black/5 dark:text-white/5">&ldquo;</span>
            <p className="relative whitespace-pre-wrap text-sm leading-relaxed text-black/70 dark:text-white/70">
              {t.content}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-black/60 dark:bg-white/10 dark:text-white/60">
                  {t.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{t.authorName}</h3>
                  <p className="text-xs text-black/65 dark:text-white/65">
                    {[t.authorCompany, t.authorTitle, t.relationship].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              {t.rating ? <StarRating rating={t.rating} /> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Page component ──────────────────────────────── */

export default async function PublicPortfolioPage({ params }: PublicPortfolioPageProps) {
  const resolvedParams = await params;
  const userProjectsPath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/projects`;

  let portfolio: Awaited<ReturnType<typeof projectsService.getPublicPortfolioBySlug>>;
  try {
    portfolio = await projectsService.getPublicPortfolioBySlug(resolvedParams.publicSlug);
  } catch (error) {
    if (isProjectServiceError(error)) {
      if (error.status === 404) notFound();
      if (error.status === 403) {
        return <PrivatePortfolioPage publicSlug={resolvedParams.publicSlug} />;
      }
    }
    throw error;
  }

  const viewModel = toPublicHomeViewModel(portfolio);

  // 병렬 페칭: skills + testimonials + entityLinks 동시 실행
  async function fetchEntityLinks() {
    const ownerSettings = await prisma.portfolioSettings.findUnique({
      where: { publicSlug: resolvedParams.publicSlug },
      select: { ownerId: true },
    });
    if (!ownerSettings) return [];
    return prisma.domainLink.findMany({
      where: {
        ownerId: ownerSettings.ownerId,
        sourceType: { in: [DomainLinkEntityType.PROJECT, DomainLinkEntityType.EXPERIENCE, DomainLinkEntityType.SKILL] },
        targetType: { in: [DomainLinkEntityType.PROJECT, DomainLinkEntityType.EXPERIENCE, DomainLinkEntityType.SKILL] },
      },
      select: { sourceType: true, sourceId: true, targetType: true, targetId: true },
    });
  }

  const [skills, testimonials, entityLinks] = await Promise.all([
    prisma.skill.findMany({
      where: {
        owner: { portfolioSettings: { publicSlug: resolvedParams.publicSlug, isPublic: true } },
        visibility: "PUBLIC",
      },
      orderBy: [{ category: "asc" }, { order: "asc" }],
      select: { id: true, name: true, category: true, level: true },
    }),
    testimonialService.listPublicBySlug(resolvedParams.publicSlug),
    fetchEntityLinks(),
  ]);

  const skillGroups = new Map<string, typeof skills>();
  for (const skill of skills) {
    const key = skill.category ?? "기타";
    const group = skillGroups.get(key);
    if (group) {
      group.push(skill);
    } else {
      skillGroups.set(key, [skill]);
    }
  }

  // 경력 → 관련 프로젝트 맵
  const experienceProjects = new Map<string, string[]>();
  // 프로젝트 ID → 제목 맵
  const projectTitleMap = new Map<string, string>();
  for (const p of viewModel.featuredProjects) {
    projectTitleMap.set(p.id, p.title);
  }
  // 스킬 ID → 이름 맵
  const skillNameMap = new Map<string, string>();
  for (const s of skills) {
    skillNameMap.set(s.id, s.name);
  }

  for (const link of entityLinks) {
    // Experience → Project
    if (link.sourceType === DomainLinkEntityType.EXPERIENCE && link.targetType === DomainLinkEntityType.PROJECT) {
      const arr = experienceProjects.get(link.sourceId) ?? [];
      if (projectTitleMap.has(link.targetId)) arr.push(link.targetId);
      experienceProjects.set(link.sourceId, arr);
    }
    if (link.sourceType === DomainLinkEntityType.PROJECT && link.targetType === DomainLinkEntityType.EXPERIENCE) {
      const arr = experienceProjects.get(link.targetId) ?? [];
      if (projectTitleMap.has(link.sourceId)) arr.push(link.sourceId);
      experienceProjects.set(link.targetId, arr);
    }
  }

  const displayName = getProfileTitle(viewModel.profile.displayName, resolvedParams.publicSlug);
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const experiencesPath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/experiences`;

  const siteUrl = getSiteUrl();
  const portfolioUrl = `${siteUrl}/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}`;
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    description: getProfileDescription(viewModel.profile.headline),
    url: portfolioUrl,
    ...(viewModel.profile.avatarUrl ? { image: viewModel.profile.avatarUrl } : {}),
    ...(viewModel.profile.links.length > 0
      ? { sameAs: viewModel.profile.links.map((l) => l.url) }
      : {}),
  };

  // Build section renderers map
  const sectionRenderers: Record<LayoutSectionId, React.ReactNode> = {
    projects: <ProjectsSection key="projects" viewModel={viewModel} userProjectsPath={userProjectsPath} />,
    experiences: <ExperiencesSection key="experiences" viewModel={viewModel} experiencesPath={experiencesPath} experienceProjects={experienceProjects} projectTitleMap={projectTitleMap} publicSlug={resolvedParams.publicSlug} />,
    skills: <SkillsSection key="skills" skillGroups={skillGroups} />,
    testimonials: <TestimonialsSection key="testimonials" testimonials={testimonials} />,
  };

  return (
    <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      <JsonLd data={personJsonLd} />
      {/* Profile header — always first */}
      <div className="animate-fade-in-up flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {viewModel.profile.avatarUrl ? (
          <Image
            src={viewModel.profile.avatarUrl}
            alt={`${displayName} 프로필 이미지`}
            width={112}
            height={112}
            priority
            className="h-28 w-28 shrink-0 rounded-full object-cover ring-4 ring-black/5 shadow-lg dark:ring-white/10"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-black/10 text-3xl font-semibold text-black/65 ring-4 ring-black/5 shadow-lg dark:bg-white/10 dark:text-white/65 dark:ring-white/10">
            {avatarInitial}
          </div>
        )}
        <div className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-black/65 dark:text-white/65">Portfolio</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">{displayName}</h1>
          <p className="mt-2 text-xl text-black/75 dark:text-white/75">
            {getProfileDescription(viewModel.profile.headline)}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {viewModel.profile.availabilityStatus === "OPEN" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                채용 제안 환영합니다
              </span>
            ) : null}
            {viewModel.profile.location ? (
              <span className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2.5 7a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Zm5 2.25a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5h-1ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Z" clipRule="evenodd" />
                </svg>
                {viewModel.profile.location}
              </span>
            ) : null}
            {viewModel.profile.isEmailPublic && viewModel.profile.email ? (
              <a
                href={`mailto:${viewModel.profile.email}`}
                className="flex items-center gap-1.5 text-xs text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                  <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                </svg>
                {viewModel.profile.email}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {viewModel.profile.bio ? (
        <p className="animate-fade-in-up-delay-1 mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/70 dark:text-white/70">
          {viewModel.profile.bio}
        </p>
      ) : null}

      <div className="animate-fade-in-up-delay-2 mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
        <Link
          href={userProjectsPath}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-white dark:text-black"
        >
          프로젝트 보기
        </Link>
        {viewModel.profile.featuredResumeShareToken ? (
          <a
            href={`/resume/share/${viewModel.profile.featuredResumeShareToken}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black/80 transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black/30 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/5 dark:focus-visible:ring-white/30"
          >
            이력서 보기
          </a>
        ) : viewModel.profile.resumeUrl ? (
          <a
            href={viewModel.profile.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black/80 transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black/30 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/5 dark:focus-visible:ring-white/30"
          >
            이력서 다운로드
          </a>
        ) : null}
      </div>

      {viewModel.profile.links.length > 0 ? (
        <nav aria-label="소셜 링크" className="animate-fade-in-up-delay-3 mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
          {viewModel.profile.links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white/60 px-4 py-2 text-sm text-black/70 shadow-sm transition-all hover:shadow-md hover:text-black focus-visible:ring-2 focus-visible:ring-black/30 dark:border-white/15 dark:bg-white/5 dark:text-white/70 dark:shadow-none dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/30"
            >
              <SocialIcon type={link.type} />
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}

      {/* Dynamic sections — rendered in layoutJson order */}
      {viewModel.layout.sections
        .filter((s) => s.visible)
        .map((s) => sectionRenderers[s.id])}

      {/* Footer */}
      <footer className="mt-20 border-t border-black/8 pt-8 pb-6 dark:border-white/8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-black/65 dark:text-white/65">
            관심이 있으시다면 편하게 연락해 주세요
          </p>
          <div className="flex gap-3">
            {viewModel.profile.isEmailPublic && viewModel.profile.email ? (
              <a
                href={`mailto:${viewModel.profile.email}`}
                className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98] dark:bg-white dark:text-black"
              >
                이메일 보내기
              </a>
            ) : null}
            {viewModel.profile.links.length > 0 ? (
              <a
                href={viewModel.profile.links[0].url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold text-black/80 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/5"
              >
                {viewModel.profile.links[0].label}
              </a>
            ) : null}
          </div>
          <p className="mt-4 text-xs text-black/30 dark:text-white/30">
            이 포트폴리오는 PoReSt로 만들어졌습니다
          </p>
        </div>
      </footer>
    </main>
  );
}
