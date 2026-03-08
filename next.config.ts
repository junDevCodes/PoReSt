import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
