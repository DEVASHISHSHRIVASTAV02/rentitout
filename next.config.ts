import type { NextConfig } from "next";

const minimalPolyfillPath = "./src/polyfills/next-polyfill-module-minimal.js";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
  images: {
    // Next.js 16 requires an allowlist for quality values.
    qualities: [45, 50, 55, 75],
    // Tune responsive candidates so small mobile cards avoid large fallbacks.
    imageSizes: [32, 48, 64, 96, 128, 160, 192, 256, 320, 384, 448, 512, 560],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  turbopack: {
    // Replace Next's broad client polyfill bundle with a minimal shim.
    resolveAlias: {
      "../build/polyfills/polyfill-module": minimalPolyfillPath,
      "../build/polyfills/polyfill-module.js": minimalPolyfillPath,
      "next/dist/build/polyfills/polyfill-module": minimalPolyfillPath,
      "next/dist/build/polyfills/polyfill-module.js": minimalPolyfillPath,
      "next/dist/esm/build/polyfills/polyfill-module": minimalPolyfillPath,
      "next/dist/esm/build/polyfills/polyfill-module.js": minimalPolyfillPath,
    },
  },
};

export default nextConfig;
