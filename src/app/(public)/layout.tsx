import type { Metadata } from "next";
import { getMetadataBase } from "@/lib/site-url";
import "./globals.css";

const DEFAULT_OG_IMAGE_PATH = "/favicon.ico";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Dev OS 포트폴리오",
    template: "%s | Dev OS",
  },
  description: "공개 포트폴리오와 오너 전용 대시보드를 제공하는 Dev OS 프로젝트입니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Dev OS",
    url: "/",
    title: "Dev OS 포트폴리오",
    description: "공개 포트폴리오와 오너 전용 대시보드를 제공하는 Dev OS 프로젝트입니다.",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Dev OS 포트폴리오",
    description: "공개 포트폴리오와 오너 전용 대시보드를 제공하는 Dev OS 프로젝트입니다.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
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
