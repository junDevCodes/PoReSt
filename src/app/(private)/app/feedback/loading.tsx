export default function FeedbackLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      {/* 헤더 */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-10 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-9 w-48 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
      </header>

      {/* 요청 목록 카드 */}
      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-black/10 bg-[#faf9f6] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="h-5 w-44 rounded bg-black/10 dark:bg-white/10" />
                  <div className="mt-2 h-3 w-52 rounded bg-black/5 dark:bg-white/5" />
                  <div className="mt-1 h-3 w-36 rounded bg-black/5 dark:bg-white/5" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-black/5 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
