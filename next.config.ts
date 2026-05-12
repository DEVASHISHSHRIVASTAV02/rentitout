import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],
    qualities: [72, 75],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
