// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   output: "export",
// };

// export default nextConfig;



/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export",

  images: {
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
  async rewrites() {
    return [
      {
        source: "/services/Alloy%20Refurbishment",
        destination: "/services/alloy-wheel",
      },
      {
        source: "/services/Alloy Refurbishment",
        destination: "/services/alloy-wheel",
      },
      {
        source: "/services/alloy-refurbishment",
        destination: "/services/alloy-wheel",
      },
    ];
  },
};

module.exports = nextConfig;