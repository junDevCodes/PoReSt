import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const DEFAULT_SITE_URL = "http://localhost:3000";

function getBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return siteUrl && siteUrl.length > 0 ? siteUrl : DEFAULT_SITE_URL;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/projects`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/users`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const portfolios = await prisma.portfolioSettings.findMany({
    where: { isPublic: true },
    select: { publicSlug: true, updatedAt: true },
  });

  const portfolioPages: MetadataRoute.Sitemap = portfolios.flatMap((p) => [
    {
      url: `${baseUrl}/portfolio/${p.publicSlug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/portfolio/${p.publicSlug}/projects`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]);

  const projects = await prisma.project.findMany({
    where: { owner: { portfolioSettings: { isPublic: true } } },
    select: {
      slug: true,
      updatedAt: true,
      owner: {
        select: { portfolioSettings: { select: { publicSlug: true } } },
      },
    },
  });

  const projectPages: MetadataRoute.Sitemap = projects
    .filter((p) => p.owner.portfolioSettings?.publicSlug)
    .map((p) => ({
      url: `${baseUrl}/portfolio/${p.owner.portfolioSettings!.publicSlug}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...portfolioPages, ...projectPages];
}
