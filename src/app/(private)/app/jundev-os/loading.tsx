export default function JundevOsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="h-28 animate-pulse rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-80 animate-pulse rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5" />
        <div className="h-80 animate-pulse rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5" />
      </div>
    </div>
  );
}
