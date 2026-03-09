"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppSidebar } from "./AppSidebar";
import { SignOutButton } from "@/components/auth/SignOutButton";

type AppShellWrapperProps = {
  userName: string | null;
  children: React.ReactNode;
};

export function AppShellWrapper({ userName, children }: AppShellWrapperProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(localStorage.getItem("portfolio-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("portfolio-theme", next ? "dark" : "light");
  }

  return (
    <div
      data-theme={dark ? "dark" : "light"}
      className="min-h-screen bg-[#f6f5f2] text-[#1a1a1a] dark:bg-[#111111] dark:text-[#ededed]"
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-black/10 bg-white/70 px-6 py-6 lg:border-b-0 lg:border-r dark:border-white/10 dark:bg-[#1a1a1a]">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Workspace</p>
          <h1 className="mt-2 text-xl font-semibold">PoReSt</h1>
          <p className="mt-2 text-xs text-black/55">개인 작업공간</p>
          <div className="mt-6">
            <AppSidebar />
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-white/70 px-6 py-4 dark:border-white/10 dark:bg-[#1a1a1a]">
            <div>
              <p className="text-sm font-semibold text-black/85">{userName ?? "사용자"}</p>
              <p className="text-xs text-black/55">로그인된 작업공간</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-black transition hover:border-black/40 hover:bg-black/5"
              >
                서비스 홈
              </Link>
              <SignOutButton className="inline-flex items-center justify-center rounded-full border border-black/20 px-4 py-2 text-sm font-semibold text-black transition hover:border-black/40 hover:bg-black/5" />
              <button
                type="button"
                onClick={toggle}
                className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black"
                aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              >
                {dark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
