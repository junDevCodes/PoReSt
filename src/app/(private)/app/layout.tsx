import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default async function AppWorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f6f5f2] text-[#1a1a1a]">
        <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[260px_1fr]">
          <aside className="border-b border-black/10 bg-white/70 px-6 py-6 lg:border-b-0 lg:border-r">
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">Workspace</p>
            <h1 className="mt-2 text-xl font-semibold">PoReSt</h1>
            <p className="mt-2 text-xs text-black/55">개인 작업공간</p>
            <div className="mt-6">
              <AppSidebar />
            </div>
          </aside>

          <div className="flex min-h-screen flex-col">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-white/70 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-black/85">{user?.name ?? user?.email ?? "사용자"}</p>
                <p className="text-xs text-black/55">로그인된 작업공간</p>
              </div>
              <SignOutButton className="inline-flex items-center justify-center rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-black transition hover:border-black/40 hover:bg-black/5" />
            </header>
            <main className="flex-1 px-6 py-8">{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
