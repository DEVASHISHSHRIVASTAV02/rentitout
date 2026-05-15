const DEFAULT_WEB_CONCURRENCY = 2;

function parseWebConcurrency(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return DEFAULT_WEB_CONCURRENCY;
  }

  if (value.toLowerCase() === "max") {
    return "max";
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_WEB_CONCURRENCY;
  }

  return parsed;
}

const instances = parseWebConcurrency(process.env.WEB_CONCURRENCY);

module.exports = {
  apps: [
    {
      name: "rent-bridge",
      script: "./node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      cwd: "/var/www/rent-bridge",
      instances,
      exec_mode: instances === 1 ? "fork" : "cluster",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        APP_ROOT: "/var/www/rent-bridge",
      },
    },
  ],
};
