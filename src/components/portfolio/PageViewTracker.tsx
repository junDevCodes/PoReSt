"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function derivePageInfo(
  pathname: string,
  publicSlug: string,
): { pageType: string; pageSlug?: string } | null {
  const base = `/portfolio/${encodeURIComponent(publicSlug)}`;

  if (pathname === base || pathname === `${base}/`) {
    return { pageType: "home" };
  }
  if (pathname === `${base}/experiences`) {
    return { pageType: "experiences" };
  }
  if (pathname === `${base}/projects`) {
    return { pageType: "projects" };
  }

  const projectMatch = pathname.match(
    new RegExp(`^/portfolio/[^/]+/projects/(.+)$`),
  );
  if (projectMatch) {
    return { pageType: "project_detail", pageSlug: projectMatch[1] };
  }

  return null;
}

export function PageViewTracker({ publicSlug }: { publicSlug: string }) {
  const pathname = usePathname();
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (tracked.current === pathname) return;
    tracked.current = pathname;

    const info = derivePageInfo(pathname, publicSlug);
    if (!info) return;

    fetch("/api/public/pageviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicSlug,
        pageType: info.pageType,
        pageSlug: info.pageSlug ?? null,
        referrer: document.referrer || null,
      }),
    }).catch(() => {
      // Fire-and-forget
    });
  }, [pathname, publicSlug]);

  return null;
}
