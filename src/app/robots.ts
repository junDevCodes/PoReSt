import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";

function getBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return siteUrl && siteUrl.length > 0 ? siteUrl : DEFAULT_SITE_URL;
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/projects", "/projects/"],
        disallow: ["/app/", "/api/app/"],
      },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
