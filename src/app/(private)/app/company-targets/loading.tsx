export default function CompanyTargetsLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12" aria-busy="true" role="status" aria-label="페이지 로딩 중">
      {/* 헤더 */}
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="h-3 w-14 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-9 w-44 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />
      </header>

      <section className="mt-8 grid gap-6">
        {/* 필터 카드 */}
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-12 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5 md:col-span-2" />
          </div>
        </div>

        {/* 새 카드 생성 폼 */}
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          </div>
        </div>

        {/* 카드 목록 */}
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="h-5 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-black/10 bg-[#faf9f6] dark:bg-zinc-800 p-4"
              >
                <div className="h-3 w-40 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-2 h-5 w-52 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-1 h-3 w-44 rounded bg-black/5 dark:bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
