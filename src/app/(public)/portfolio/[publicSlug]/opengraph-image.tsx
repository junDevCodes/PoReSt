import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ publicSlug: string }> }) {
  const { publicSlug } = await params;

  const settings = await prisma.portfolioSettings.findFirst({
    where: { publicSlug, isPublic: true },
    select: { displayName: true, headline: true, avatarUrl: true },
  });

  const displayName = settings?.displayName ?? publicSlug;
  const headline = settings?.headline ?? "Portfolio";
  const avatarUrl = settings?.avatarUrl ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#f6f5f2",
          padding: "64px",
          alignItems: "center",
          gap: "48px",
        }}
      >
        {/* 아바타 */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: 160,
              height: 160,
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.1)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontWeight: 700,
              color: "rgba(0,0,0,0.6)",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
        )}

        {/* 텍스트 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.5)",
              marginBottom: 12,
            }}
          >
            Portfolio
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#111111",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "rgba(0,0,0,0.6)",
              lineHeight: 1.4,
            }}
          >
            {headline}
          </div>
        </div>

        {/* PoReSt 브랜딩 */}
        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 48,
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(0,0,0,0.3)",
            letterSpacing: "0.05em",
          }}
        >
          PoReSt
        </div>
      </div>
    ),
    { ...size },
  );
}
