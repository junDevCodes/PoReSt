import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMetadataBase } from "@/lib/site-url";
import { createProjectsService, isProjectServiceError } from "@/modules/projects";
import { toPublicHomeViewModel } from "@/view-models/public-portfolio";

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case "GITHUB":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
      );
    case "LINKEDIN":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
        </svg>
      );
    case "INSTAGRAM":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
        </svg>
      );
    case "TWITTER":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
        </svg>
      );
    case "YOUTUBE":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
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
const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

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
      title: "포트폴리오",
      description: "공개 포트폴리오",
      alternates: {
        canonical: canonicalPath,
      },
    };
  }
}

export const revalidate = 60;

export default async function PublicPortfolioPage({ params }: PublicPortfolioPageProps) {
  const resolvedParams = await params;
  const userProjectsPath = `/portfolio/${encodeURIComponent(resolvedParams.publicSlug)}/projects`;

  let portfolio: Awaited<ReturnType<typeof projectsService.getPublicPortfolioBySlug>>;
  try {
    portfolio = await projectsService.getPublicPortfolioBySlug(resolvedParams.publicSlug);
  } catch (error) {
    if (isProjectServiceError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const viewModel = toPublicHomeViewModel(portfolio);

  const displayName = getProfileTitle(viewModel.profile.displayName, resolvedParams.publicSlug);
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      <div className="flex items-start gap-5">
        {viewModel.profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewModel.profile.avatarUrl}
            alt={`${displayName} 프로필 이미지`}
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-black/10 text-2xl font-semibold text-black/65 dark:bg-white/10 dark:text-white/65">
            {avatarInitial}
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/65 dark:text-white/65">Portfolio</p>
          <h1 className="mt-1 text-4xl font-semibold">{displayName}</h1>
          <p className="mt-2 text-lg text-black/75 dark:text-white/75">
            {getProfileDescription(viewModel.profile.headline)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {viewModel.profile.availabilityStatus === "OPEN" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                채용 제안 환영합니다
              </span>
            ) : null}
            {viewModel.profile.location ? (
              <span className="flex items-center gap-1 text-xs text-black/65 dark:text-white/65">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M8 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2.5 7a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Zm5 2.25a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5h-1ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Z" clipRule="evenodd" />
                </svg>
                {viewModel.profile.location}
              </span>
            ) : null}
            {viewModel.profile.isEmailPublic && viewModel.profile.email ? (
              <a
                href={`mailto:${viewModel.profile.email}`}
                className="flex items-center gap-1 text-xs text-black/65 hover:text-black dark:text-white/65 dark:hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
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
        <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/70 dark:text-white/70">
          {viewModel.profile.bio}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={userProjectsPath}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          프로젝트 보기
        </Link>
        {viewModel.profile.featuredResumeShareToken ? (
          <a
            href={`/resume/share/${viewModel.profile.featuredResumeShareToken}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black/80 hover:bg-black/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/5"
          >
            이력서 보기
          </a>
        ) : viewModel.profile.resumeUrl ? (
          <a
            href={viewModel.profile.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black/80 hover:bg-black/5 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/5"
          >
            이력서 다운로드
          </a>
        ) : null}
      </div>

      {viewModel.profile.links.length > 0 ? (
        <section className="mt-6 flex flex-wrap gap-3">
          {viewModel.profile.links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-black/20 px-4 py-2 text-sm text-black/75 hover:text-black dark:border-white/20 dark:text-white/75 dark:hover:text-white"
            >
              <SocialIcon type={link.type} />
              {link.label}
            </a>
          ))}
        </section>
      ) : null}

      <section className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">대표 프로젝트</h2>
          <Link className="text-sm font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white" href={userProjectsPath}>
            전체 보기
          </Link>
        </div>

        {viewModel.featuredProjects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/65 dark:border-white/10 dark:bg-[#1e1e1e] dark:text-white/65">
            공개된 대표 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {viewModel.featuredProjects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1e1e1e]">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-black/65 dark:text-white/65">
                  {project.description ?? "설명 정보가 없습니다."}
                </p>
                <p className="mt-3 text-xs text-black/60 dark:text-white/60">
                  {project.techStack.length > 0 ? project.techStack.join(" · ") : "기술 스택 정보 없음"}
                </p>
                <Link href={project.publicPath} className="mt-4 inline-flex text-sm font-semibold text-black/80 hover:text-black dark:text-white/80 dark:hover:text-white">
                  상세 보기
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
