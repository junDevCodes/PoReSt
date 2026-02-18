import type { Metadata } from "next";
import "../(public)/globals.css";

export const metadata: Metadata = {
  title: "Dev OS — Workspace",
  description: "Dev OS 사용자 워크스페이스입니다.",
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
      <body className="min-h-screen bg-[#0c0f14] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
