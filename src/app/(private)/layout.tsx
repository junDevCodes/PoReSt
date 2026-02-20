import type { Metadata } from "next";
import "../(public)/globals.css";

export const metadata: Metadata = {
  title: "PoReSt Workspace",
  description: "PoReSt 사용자 작업공간입니다.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#f6f5f2] text-[#1a1a1a] antialiased">{children}</body>
    </html>
  );
}
