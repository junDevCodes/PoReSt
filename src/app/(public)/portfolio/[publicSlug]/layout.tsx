import { ThemeWrapper } from "@/components/portfolio/ThemeWrapper";

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
    <ThemeWrapper publicSlug={resolvedParams.publicSlug}>
      {children}
    </ThemeWrapper>
  );
}
