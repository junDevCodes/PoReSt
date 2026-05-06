"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

// V1.2 (jundev-os v3.0.0) — dashboard live refresh
// dev: fs read fresh / prod: build-time snapshot (push 후 deploy까지)
// 동작: router.refresh() → server component 재실행 → snapshot lib re-evaluate
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const onClick = () => {
    startTransition(() => {
      router.refresh();
      setLastRefresh(new Date().toISOString().slice(11, 19));
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-black/70 transition hover:border-black/30 hover:bg-white disabled:opacity-50"
        aria-label="snapshot refresh"
      >
        <span className={isPending ? "animate-spin" : ""}>🔄</span>
        {isPending ? "갱신 중…" : "Refresh"}
      </button>
      {lastRefresh ? (
        <span className="text-[10px] text-black/40">last: {lastRefresh}</span>
      ) : null}
    </div>
  );
}
