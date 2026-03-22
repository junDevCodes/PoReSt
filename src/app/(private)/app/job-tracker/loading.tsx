export default function JobTrackerLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-12" aria-busy="true" role="status" aria-label="페이지 로딩 중">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-9 w-36 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
      </div>

      {/* 칸반 6열 — 실제 page.tsx의 flex overflow-x-auto 패턴 매칭 */}
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, col) => (
          <div key={col} className="w-64 min-w-[256px] flex-shrink-0 rounded-xl border-2 border-black/10 bg-white dark:bg-zinc-900 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
              <div className="h-5 w-8 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: col < 3 ? 2 : 1 }).map((_, card) => (
                <div
                  key={card}
                  className="animate-pulse rounded-lg border border-black/10 bg-white dark:bg-zinc-900 p-3"
                >
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                  <div className="mt-1 h-3 w-20 rounded bg-black/5 dark:bg-white/5" />
                  <div className="mt-2 h-3 w-16 rounded bg-black/5 dark:bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
