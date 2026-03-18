import type { NextConfig } from "next";

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

export default nextConfig;
