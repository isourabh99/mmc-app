import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
  trailingSlash: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "mmcclub.co.uk",
      },
      {
        protocol: "https",
        hostname: "**.mmcclub.co.uk",
      },
      {
        protocol: "https",
        hostname: "motormatesclub.co.uk",
      },
      {
        protocol: "https",
        hostname: "**.motormatesclub.co.uk",
      },
    ],
  },
};

export default nextConfig;