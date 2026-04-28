const rawWebConcurrency = process.env.WEB_CONCURRENCY?.trim();
const parsedWebConcurrency =
  rawWebConcurrency === "max"
    ? "max"
    : Math.max(1, Number.parseInt(rawWebConcurrency ?? "2", 10) || 2);

module.exports = {
  apps: [
    {
      name: "rent-bridge",
      script: "npm",
      args: "start",
      instances: parsedWebConcurrency,
      exec_mode: parsedWebConcurrency === 1 ? "fork" : "cluster",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
