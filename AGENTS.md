<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Project history and product-flow updates are documented in `README.md` and `docs/`.

Production runs on home hardware via Cloudflare Tunnel. Key docs:

- `HOME-HOSTING.md` — daily start/stop commands
- `docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md` — tunnel setup
- `docs/SETUP.md` — local dev and env vars
- `ecosystem.config.js` — PM2 config for this machine (1 app process plus a public page cache on port 3000)
- `scripts/start-metrics.ps1` — Grafana on port 3030 and Prometheus on port 9090, started only when you ask. k6 load tests are `scripts/loadtest.ps1`. The Grafana Windows service stays disabled so it cannot take port 3000.
