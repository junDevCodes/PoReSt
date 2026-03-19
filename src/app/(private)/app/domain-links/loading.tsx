export default function DomainLinksLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      {/* 헤더 */}
      <header>
        <div className="h-3 w-12 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-9 w-52 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </header>

      {/* 링크 생성 폼 */}
      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <div className="h-5 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          <div className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
        </div>
      </section>

      {/* 링크 목록 */}
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
        <div className="h-5 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-black/10 bg-[#faf9f6] p-4"
            >
              <div className="h-4 w-48 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-4 w-56 rounded bg-black/5 dark:bg-white/5" />
              <div className="mt-3 flex items-center justify-between">
                <div className="h-3 w-32 rounded bg-black/5 dark:bg-white/5" />
                <div className="h-7 w-12 rounded bg-black/5 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
