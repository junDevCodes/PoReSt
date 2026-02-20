import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

export type RequiredOwnerSession = {
  session: Session;
  ownerId: string;
};

export async function getRequiredOwnerSession(nextPath: string): Promise<RequiredOwnerSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const search = new URLSearchParams({ next: nextPath });
    redirect(`/login?${search.toString()}`);
  }

  return {
    session,
    ownerId: session.user.id,
  };
}
