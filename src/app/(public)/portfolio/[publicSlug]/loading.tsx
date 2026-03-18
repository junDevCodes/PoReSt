export default function PortfolioLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-14">
      {/* 프로필 헤더 스켈레톤 */}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="h-28 w-28 shrink-0 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <div className="h-3 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-10 w-48 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-6 w-64 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      </div>

      {/* CTA 스켈레톤 */}
      <div className="mt-8 flex gap-3">
        <div className="h-12 w-32 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
        <div className="h-12 w-28 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
      </div>

      {/* 섹션 스켈레톤 */}
      <div className="mt-16 space-y-4">
        <div className="h-8 w-36 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
          ))}
        </div>
      </div>

      <div className="mt-16 space-y-4">
        <div className="h-8 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
          ))}
        </div>
      </div>
    </main>
  );
}
