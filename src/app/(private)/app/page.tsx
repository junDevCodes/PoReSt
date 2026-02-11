import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AppHome() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">비공개</p>
          <h1 className="text-3xl font-semibold">오너 대시보드</h1>
          <p className="mt-2 text-sm text-white/60">
            {user?.name ?? user?.email ?? "오너"} 계정으로 로그인되어 있습니다.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Foundation 상태</h2>
          <p className="mt-2 text-sm text-white/60">
            Auth.js와 API 권한 정책이 적용되었습니다. 아래 관리 화면에서 M1 데이터를
            직접 생성/수정할 수 있습니다.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">빠른 링크</h2>
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
