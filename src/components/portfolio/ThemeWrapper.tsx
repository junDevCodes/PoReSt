"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ThemeWrapperProps = {
  publicSlug: string;
  children: React.ReactNode;
};

export function ThemeWrapper({ publicSlug, children }: ThemeWrapperProps) {
  const [dark, setDark] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("portfolio-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("portfolio-theme", next ? "dark" : "light");
  }

  async function handleDownloadPdf() {
    setIsDownloadingPdf(true);
    try {
      const mainEl = document.querySelector("main");
      if (!mainEl) return;
      const { downloadElementAsPdf } = await import("@/lib/pdf-download");
      await downloadElementAsPdf(mainEl as HTMLElement, `portfolio-${publicSlug}.pdf`, "#f6f5f2");
    } catch {
      // 실패 시 print fallback
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return (
    <div
      data-theme={dark ? "dark" : "light"}
      className="min-h-screen bg-[#f6f5f2] text-black dark:bg-[#111111] dark:text-white"
    >
      <header className="border-b border-black/8 bg-[#f6f5f2] dark:border-white/8 dark:bg-[#111111]">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-2 px-6 text-sm">
          <Link
            href="/"
            className="font-semibold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
          >
            PoReSt
          </Link>
          <span className="text-black/30 dark:text-white/30">/</span>
          <span className="text-black/55 dark:text-white/55">{publicSlug}</span>
          <div className="ml-auto flex items-center gap-1 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
              aria-label="인쇄"
            >
              <PrintIcon />
              <span>인쇄</span>
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white disabled:opacity-50"
              aria-label="PDF 저장"
            >
              <DownloadIcon />
              <span>{isDownloadingPdf ? "생성 중..." : "PDF 저장"}</span>
            </button>
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
              aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function PrintIcon() {
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
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
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
