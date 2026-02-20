type LoadingBlockProps = {
  message?: string;
  className?: string;
};

type EmptyBlockProps = {
  message: string;
  className?: string;
};

type ErrorBannerProps = {
  message: string;
  className?: string;
};

export function LoadingBlock({
  message = "데이터를 불러오는 중입니다.",
  className,
}: LoadingBlockProps) {
  return (
    <p className={`rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/65 ${className ?? ""}`}>
      {message}
    </p>
  );
}

export function EmptyBlock({ message, className }: EmptyBlockProps) {
  return (
    <p className={`rounded-xl border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm text-black/65 ${className ?? ""}`}>
      {message}
    </p>
  );
}

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  return (
    <p className={`rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 ${className ?? ""}`}>
      {message}
    </p>
  );
}
