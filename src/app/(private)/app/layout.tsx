import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { AppShellWrapper } from "@/components/app/AppShellWrapper";
import { ToastProvider } from "@/components/ui/ToastProvider";

function WorkspaceSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-80 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}

export default async function AppWorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const userName = user?.name ?? user?.email ?? null;

  return (
    <ToastProvider>
      <AppShellWrapper userName={userName}>
        <Suspense fallback={<WorkspaceSkeleton />}>
          {children}
        </Suspense>
      </AppShellWrapper>
    </ToastProvider>
  );
}
