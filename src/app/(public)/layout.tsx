import type { Metadata } from "next";
import { getMetadataBase } from "@/lib/site-url";
import "./globals.css";

const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "PoReSt 포트폴리오",
    template: "%s | PoReSt",
  },
  description: "공개 포트폴리오와 개인 작업공간을 함께 제공하는 PoReSt 서비스입니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "PoReSt",
    url: "/",
    title: "PoReSt 포트폴리오",
    description: "공개 포트폴리오와 개인 작업공간을 함께 제공하는 PoReSt 서비스입니다.",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoReSt 포트폴리오",
    description: "공개 포트폴리오와 개인 작업공간을 함께 제공하는 PoReSt 서비스입니다.",
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
