module.exports = {
  apps: [
    {
      name: "next-app",
      script: "./node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    },
    {
      name: "public-cache",
      script: "./scripts/public-cache-proxy.mjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 3000,
        ORIGIN_PORT: 3002,
        PUBLIC_CACHE_TTL_MS: 120000
      }
    }
  ]
};
