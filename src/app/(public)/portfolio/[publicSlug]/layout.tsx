import { ThemeWrapper } from "@/components/portfolio/ThemeWrapper";
import { prisma } from "@/lib/prisma";

type PortfolioPublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ publicSlug: string }> | { publicSlug: string };
};

export default async function PortfolioPublicLayout({
  children,
  params,
}: PortfolioPublicLayoutProps) {
  const resolvedParams = await params;

  // 비공개/미존재 포트폴리오 → ThemeWrapper 없이 렌더링 (PDF/인쇄 버튼 미노출)
  const settings = await prisma.portfolioSettings.findFirst({
    where: { publicSlug: resolvedParams.publicSlug, isPublic: true },
    select: { id: true },
  });

  if (!settings) {
    return <>{children}</>;
  }

  return (
    <ThemeWrapper publicSlug={resolvedParams.publicSlug}>
      {children}
    </ThemeWrapper>
  );
}
