"use client";

import { Suspense } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "오너 대시보드에 접근하려면 로그인해야 합니다.",
  owner: "이 계정은 오너로 승인되지 않았습니다.",
  AccessDenied: "접근이 거부되었습니다. 오너 계정으로 로그인하세요.",
};

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "";
  const message = ERROR_MESSAGES[error];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b10] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-amber-400/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-[160px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Image src="/globe.svg" alt="Dev OS" width={24} height={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Dev OS</p>
              <h1 className="text-2xl font-semibold">오너 로그인</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-white/70">
            비공개 대시보드는 오너 계정만 접근할 수 있습니다. Auth.js와 데이터베이스에
            등록된 오너 계정으로 로그인해주세요.
          </p>

          {message ? (
            <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              const next = searchParams.get("next");
              const callbackUrl = next && next.startsWith("/") ? next : "/app";
              signIn("github", { callbackUrl });
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            GitHub로 로그인
          </button>

          <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">
            접근 권한이 필요하신가요? 팀장에게 오너 권한을 요청하거나 OWNER_EMAIL
            허용 목록을 설정해주세요.
          </div>
        </div>
      </main>
    </div>
  );
}

export function OwnerSignInView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0b10]" />}>
      <SignInContent />
    </Suspense>
  );
}
