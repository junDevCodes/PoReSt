import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev OS — 포트폴리오",
  description: "공개 포트폴리오와 오너 전용 대시보드를 분리한 프로젝트입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
