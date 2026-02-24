"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "로그인이 필요합니다.",
  owner: "운영 권한이 필요한 기능입니다.",
  AccessDenied: "로그인 접근이 거부되었습니다. 다시 시도해 주세요.",
};

type OwnerSignInViewProps = {
  mode?: "login" | "signup";
};

function resolveContent(mode: "login" | "signup") {
  if (mode === "signup") {
    return {
      title: "회원가입",
      description: "GitHub 계정으로 시작하면 개인 작업공간과 공개 포트폴리오 URL이 자동으로 생성됩니다.",
      actionLabel: "GitHub로 회원가입",
      switchText: "이미 계정이 있다면",
      switchHref: "/login",
      switchLabel: "로그인으로 이동",
    };
  }

  return {
    title: "로그인",
    description: "GitHub 계정으로 로그인하면 개인 작업공간과 공개 포트폴리오 URL이 자동으로 준비됩니다.",
    actionLabel: "GitHub로 로그인",
    switchText: "처음이라면",
    switchHref: "/signup",
    switchLabel: "회원가입으로 이동",
  };
}

function SignInContent({ mode = "login" }: OwnerSignInViewProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "";
  const message = ERROR_MESSAGES[error];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = resolveContent(mode);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f5f2] text-[#1a1a1a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-300/40 blur-[120px]" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/40 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-200/40 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-black/10 bg-white/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5">
              <Image src="/brand-mark.svg" alt="PoReSt" width={24} height={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/50">PoReSt</p>
              <h1 className="text-2xl font-semibold">{content.title}</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-black/70">{content.description}</p>

          {message ? (
            <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-100 px-4 py-3 text-sm text-amber-900">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              if (isSubmitting) {
                return;
              }

              setIsSubmitting(true);
              const next = searchParams.get("next");
              const callbackUrl = next && next.startsWith("/") ? next : "/app";

              try {
                await signIn("github", { callbackUrl });
              } catch {
                setIsSubmitting(false);
              }
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#0e7490] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#155e75] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
            )}
            {isSubmitting ? "GitHub로 이동 중..." : content.actionLabel}
          </button>

          <div className="mt-6 space-y-1 text-center text-sm text-black/55">
            <div>
              {content.switchText}
              <Link href={content.switchHref} className="ml-1 font-semibold text-black/75 hover:text-black">
                {content.switchLabel}
              </Link>
            </div>
            <div>
              공개 포트폴리오를 먼저 보고 싶다면
              <Link href="/" className="ml-1 font-semibold text-black/75 hover:text-black">
                홈으로 이동
              </Link>
            </div>
          </div>

          <div className="mt-3 text-center text-xs text-black/45">
            버튼을 누르면 즉시 GitHub 인증 페이지로 이동합니다.
          </div>
        </div>
      </main>
    </div>
  );
}

export function OwnerSignInView({ mode = "login" }: OwnerSignInViewProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f5f2]" />}>
      <SignInContent mode={mode} />
    </Suspense>
  );
}
