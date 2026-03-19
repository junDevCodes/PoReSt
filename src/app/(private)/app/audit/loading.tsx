export default function AuditLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      {/* 헤더 */}
      <header>
        <div className="h-3 w-10 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-9 w-36 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      </header>

      {/* 테이블 카드 */}
      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-black/10 bg-[#faf9f6] p-3"
            >
              <div className="h-3 w-28 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-4 w-44 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-1 h-3 w-36 rounded bg-black/5 dark:bg-white/5" />
              <div className="mt-1 h-3 w-64 rounded bg-black/5 dark:bg-white/5" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
