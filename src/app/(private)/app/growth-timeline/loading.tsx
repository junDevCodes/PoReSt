export default function GrowthTimelineLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" aria-busy="true" role="status" aria-label="페이지 로딩 중">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-9 w-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="h-3 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-3 h-8 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          </div>
        ))}
      </div>

      {/* 히트맵 */}
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 grid grid-cols-[repeat(26,1fr)] gap-1">
          {Array.from({ length: 182 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-sm bg-black/5 dark:bg-white/5" />
          ))}
        </div>
      </div>

      {/* 월별 차트 + 타입 분포 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 flex items-end gap-2">
            {[55, 80, 40, 70, 35, 90].map((h, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse rounded-t bg-black/5 dark:bg-white/5"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
