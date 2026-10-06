/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  trailingSlash: false,

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

module.exports = nextConfig;