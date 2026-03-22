import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/u/:publicSlug",
        destination: "/portfolio/:publicSlug",
        permanent: true,
      },
      {
        source: "/u/:publicSlug/projects",
        destination: "/portfolio/:publicSlug/projects",
        permanent: true,
      },
      {
        source: "/u/:publicSlug/projects/:slug",
        destination: "/portfolio/:publicSlug/projects/:slug",
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
