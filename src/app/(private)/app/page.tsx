import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AppHome() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  const ownerId = user?.id ?? "";
  const [workspace, projectCount, publicProjectCount, resumeCount, noteCount, blogCount] = ownerId
    ? await Promise.all([
        prisma.portfolioSettings.findUnique({
          where: { ownerId },
          select: {
            publicSlug: true,
            isPublic: true,
            displayName: true,
            headline: true,
          },
        }),
        prisma.project.count({ where: { ownerId } }),
        prisma.project.count({ where: { ownerId, visibility: "PUBLIC" } }),
        prisma.resume.count({ where: { ownerId } }),
        prisma.note.count({ where: { ownerId } }),
        prisma.blogPost.count({ where: { ownerId } }),
      ])
    : [null, 0, 0, 0, 0, 0];

  const publishSteps = [
    {
      done: Boolean(workspace?.displayName && workspace?.headline),
      label: "프로필 기본 정보 입력",
      href: "/app/portfolio/settings",
    },
    {
      done: projectCount > 0,
      label: "첫 프로젝트 작성",
      href: "/app/projects/new",
    },
    {
      done: publicProjectCount > 0,
      label: "프로젝트 공개 전환",
      href: "/app/projects",
    },
    {
      done: Boolean(workspace?.isPublic && workspace?.publicSlug),
      label: "공개 포트폴리오 확인",
      href: workspace?.publicSlug ? `/u/${encodeURIComponent(workspace.publicSlug)}` : "/app/portfolio/settings",
    },
  ];

  const completedSteps = publishSteps.filter((step) => step.done).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold">내 워크스페이스</h1>
        <p className="mt-2 text-sm text-black/65">
          {user?.name ?? user?.email ?? "사용자"} 계정으로 로그인되어 있습니다. 공개 포트폴리오 발행 진행률을 먼저 확인하세요.
        </p>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">발행 체크리스트</h2>
          <span className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold text-black/70">
            {completedSteps} / {publishSteps.length} 완료
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {publishSteps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm"
            >
              <span>{step.label}</span>
              <span className={`text-xs font-semibold ${step.done ? "text-emerald-700" : "text-black/45"}`}>
                {step.done ? "완료" : "진행 필요"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Portfolio</p>
          <p className="mt-3 text-2xl font-semibold">{workspace?.isPublic ? "PUBLIC" : "PRIVATE"}</p>
          <p className="mt-2 text-xs text-black/55">publicSlug: {workspace?.publicSlug ?? "미설정"}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Projects</p>
          <p className="mt-3 text-2xl font-semibold">{projectCount}</p>
          <p className="mt-2 text-xs text-black/55">공개 프로젝트 {publicProjectCount}개</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Resumes</p>
          <p className="mt-3 text-2xl font-semibold">{resumeCount}</p>
          <p className="mt-2 text-xs text-black/55">맞춤 이력서 버전</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Knowledge</p>
          <p className="mt-3 text-2xl font-semibold">{noteCount + blogCount}</p>
          <p className="mt-2 text-xs text-black/55">노트 {noteCount} / 블로그 {blogCount}</p>
        </article>
      </section>
    </div>
  );
}
