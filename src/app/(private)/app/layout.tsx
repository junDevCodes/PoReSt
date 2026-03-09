import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { AppShellWrapper } from "@/components/app/AppShellWrapper";
import { ToastProvider } from "@/components/ui/ToastProvider";

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
      <AppShellWrapper userName={userName}>{children}</AppShellWrapper>
    </ToastProvider>
  );
}
