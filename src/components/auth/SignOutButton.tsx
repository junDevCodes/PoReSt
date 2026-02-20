"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <button
      className={
        className ??
        "inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      }
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      로그아웃
    </button>
  );
}
