import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { prisma } from "@/lib/prisma";

export default async function AppHome() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  const workspace = user?.id
    ? await prisma.portfolioSettings.findUnique({
        where: {
          ownerId: user.id,
        },
        select: {
          publicSlug: true,
          isPublic: true,
        },
      })
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Private</p>
          <h1 className="text-3xl font-semibold">내 워크스페이스</h1>
          <p className="mt-2 text-sm text-white/60">
            {user?.name ?? user?.email ?? "사용자"} 계정으로 로그인되어 있습니다.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">서비스 상태</h2>
          <p className="mt-2 text-sm text-white/60">
            인증과 API 접근 제어가 적용된 대시보드입니다. 아래 관리 메뉴에서 데이터를 생성하고 수정할 수 있습니다.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <p>publicSlug: {workspace?.publicSlug ?? "미설정"}</p>
            <p>공개 상태: {workspace?.isPublic ? "PUBLIC" : "PRIVATE"}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">빠른 이동</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link href="/app/portfolio/settings" className="hover:text-white">
                /app/portfolio/settings
              </Link>
            </li>
            <li>
              <Link href="/app/projects" className="hover:text-white">
                /app/projects
              </Link>
            </li>
            <li>
              <Link href="/app/projects/new" className="hover:text-white">
                /app/projects/new
              </Link>
            </li>
            <li>
              <Link href="/app/experiences" className="hover:text-white">
                /app/experiences
              </Link>
            </li>
            <li>
              <Link href="/app/experience-stories" className="hover:text-white">
                /app/experience-stories
              </Link>
            </li>
            <li>
              <Link href="/app/company-targets" className="hover:text-white">
                /app/company-targets
              </Link>
            </li>
            <li>
              <Link href="/app/resumes" className="hover:text-white">
                /app/resumes
              </Link>
            </li>
            <li>
              <Link href="/app/notes" className="hover:text-white">
                /app/notes
              </Link>
            </li>
            <li>
              <Link href="/app/domain-links" className="hover:text-white">
                /app/domain-links
              </Link>
            </li>
            <li>
              <Link href="/app/blog" className="hover:text-white">
                /app/blog
              </Link>
            </li>
            <li>
              <Link href="/app/feedback" className="hover:text-white">
                /app/feedback
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
