import Link from "next/link";

type PortfolioPublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

export default async function PortfolioPublicLayout({
  children,
  params,
}: PortfolioPublicLayoutProps) {
  const resolvedParams = await params;

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      <header className="border-b border-black/8 bg-[#f6f5f2]">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-2 px-6 text-sm">
          <Link href="/" className="font-semibold text-black/70 hover:text-black">
            PoReSt
          </Link>
          <span className="text-black/30">/</span>
          <span className="text-black/55">{resolvedParams.publicSlug}</span>
        </div>
      </header>
      {children}
    </div>
  );
}
