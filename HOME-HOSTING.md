# Home Hosting Daily Ops (RentItOut)

Quick reference for bringing **https://rentitout.in** online or offline from your laptop.

> First-time setup? See [docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md](docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md).  
> Local dev / env vars? See [docs/SETUP.md](docs/SETUP.md).

All of these must be running for the public site to work:

1. **Local PostgreSQL** on `127.0.0.1:5432` (database: `rentitout`)
2. **Next.js app** (PM2, port 3000)
3. **Cloudflare Tunnel** (`cloudflared`, tunnel name: `rentitout-laptop`)

If any one of them is stopped, visitors see a Cloudflare error (502 / tunnel unavailable).

---

## After shutting down or closing your laptop

Open PowerShell and run these in order. Approve the Windows prompt when it appears for the database.

### 1. Start PostgreSQL

The database is the Windows service `postgresql-x64-17`. It does not start when the laptop boots. Check first:

```powershell
Get-Service postgresql-x64-17
```

If `Status` is `Stopped`, start it:

```powershell
Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -Command Start-Service postgresql-x64-17"
Get-Service postgresql-x64-17
```

`Status` should be `Running`.

### 2. Start the web app

This builds the latest code, replaces any app already running, and then starts one app process plus the cache. The build takes a few minutes.

```powershell
cd C:\RentAPP
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-app.ps1
```

`next-app` should show one process `online`, and `public-cache` should show one process `online`.

### 3. Start the Cloudflare tunnel

This starts the tunnel outside the current window, so closing Cursor does not take the public site offline.

```powershell
cd C:\RentAPP
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-tunnel.ps1
```

Wait until `%USERPROFILE%\.cloudflared\tunnel.log` says `Registered tunnel connection`.

### 4. Confirm the site is live

In a second PowerShell window:

```powershell
$env:PGPASSWORD = (Get-Content "$env:USERPROFILE\.rentitout\pg-app.txt" -Raw).Trim()
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U rentitout -d rentitout -tAc "select 1"
curl.exe -I http://127.0.0.1:3000/
curl.exe -I https://rentitout.in/
```

The database check should print `1`. Both `curl` commands should show `HTTP/1.1 200 OK`. Then open **https://rentitout.in**.

---

## Take the site offline (stop app + tunnel)

Use this when you want the site **down** and to free CPU/RAM for other programs.

### Stop the web app

```powershell
pm2 stop all
```

To fully remove it from PM2’s process list:

```powershell
pm2 delete all
pm2 save
```

### Stop the Cloudflare tunnel

The tunnel is not tied to a window. Stop it with:

```powershell
Stop-Process -Name cloudflared -Force
```

**If you installed cloudflared as a Windows service:**

```powershell
cloudflared service stop
```

### Stop local PostgreSQL (optional)

Use this only if you want to free memory while the site is down. Approve the Windows prompt.

```powershell
Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -Command Stop-Service postgresql-x64-17 -Force"
Get-Service postgresql-x64-17
```

`Status` should be `Stopped`.

### Confirm everything is stopped

```powershell
pm2 status
Get-Process cloudflared -ErrorAction SilentlyContinue
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U rentitout -d rentitout -tAc "select 1"
curl.exe -I https://rentitout.in/
```

- PM2 should show no running `next-app` (or status `stopped`).
- `Get-Process cloudflared` should return nothing (unless the service is still running).
- Local DB check should fail only if you intentionally stopped PostgreSQL.
- Public URL should fail or show a Cloudflare error — that means the site is offline.

---

## One-page cheat sheet

| Goal | Command |
|------|---------|
| **Go live** | Start service `postgresql-x64-17` → `powershell -ExecutionPolicy Bypass -File .\scripts\start-app.ps1` → `powershell -ExecutionPolicy Bypass -File .\scripts\start-tunnel.ps1` |
| **Go offline** | `pm2 stop all` → stop cloudflared (`Ctrl+C` or `Stop-Process -Name cloudflared -Force`) |
| **Stop local DB** | `Stop-Service postgresql-x64-17` (Admin PowerShell) |
| **Check app** | `pm2 status` |
| **Check DB** | `psql -h 127.0.0.1 -U rentitout -d rentitout -tAc "select 1"` |
| **Check tunnel** | `cloudflared tunnel info rentitout-laptop` |
| **Check local site** | `curl.exe -I http://127.0.0.1:3000/` |
| **Check public site** | `curl.exe -I https://rentitout.in/` |
| **App logs** | `pm2 logs next-app` |
| **Restart app and cache** | `powershell -ExecutionPolicy Bypass -File .\scripts\start-app.ps1` |
| **Start load-test graphs** | `powershell -ExecutionPolicy Bypass -File .\scripts\start-metrics.ps1` |
| **Run a load test** | `powershell -ExecutionPolicy Bypass -File .\scripts\loadtest.ps1 -Profile browse` |
| **Stop load-test graphs** | `powershell -ExecutionPolicy Bypass -File .\scripts\stop-metrics.ps1` |

---

## App resource usage

The public site listens on port 3000. That port is a small cache. Anonymous pages are kept for 2 minutes. Static files are kept for a day, and public listing images are kept for 10 minutes. Signed-in visitors skip the page cache. Browsers that accept Brotli get a smaller copy.

Behind it, the app runs **1 PM2 process** on port 3002. That process builds a page when the cache misses.

Config file: `ecosystem.config.js`

To apply config changes:

```powershell
cd C:\RentAPP
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

---

## Load tests (Grafana, Prometheus, and k6)

These tools are for measuring the site. They are not required for https://rentitout.in to stay online. None of them start when the laptop boots. Start them yourself when you want a test.

| Piece | Port | What it does |
|-------|------|----------------|
| k6 | none | Sends the test traffic and measures speed and failures |
| Prometheus | `127.0.0.1:9090` | Stores those measurements |
| Grafana | `127.0.0.1:3030` | Draws the graphs |

Grafana is locked to port 3030. Port 3000 belongs to the website cache. The Windows service named `Grafana` is **Disabled**, so Windows will not start it and it cannot take port 3000. Do not enable that service. Use the script below, which starts Grafana and Prometheus only on this PC.

k6 does not listen on a port and does not keep its own data folder. It sends each sample to Prometheus while the test runs.

### Start the graphs

The website does not need to be running for the graphs to open. A test against the site does need the site up.

```powershell
cd C:\RentAPP
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-metrics.ps1
```

Open http://127.0.0.1:3030/d/rentitout-load/rentitout-load-test . The dashboard is **RentItOut load test** in the RentItOut folder. No login is required to view it. A phone cannot open this address.

### Run a test

The script only requests public pages with GET. It does not sign in, create listings, or delete accounts. `browse` and `capacity` stop early if p99 response time reaches 1 second or more than 1% of requests fail.

```powershell
cd C:\RentAPP
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\loadtest.ps1 -Profile smoke
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\loadtest.ps1 -Profile browse
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\loadtest.ps1 -Profile capacity
```

`smoke` is about 20 seconds with 2 users. `browse` ramps to 50 users at about 2 requests per second each. `capacity` does not pause between requests and ramps to 100 users.

A test of `http://127.0.0.1:3000` measures this laptop and the local cache. A test of the public site also crosses the home connection and Cloudflare:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\loadtest.ps1 -Profile browse -BaseUrl https://rentitout.in
```

The site, database, and tunnel must already be running for either target.

### Stop the graphs

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-metrics.ps1
```

This stops Prometheus and Grafana only. It does not stop the website, the tunnel, or PostgreSQL.

### Where the numbers are stored

| Path | What is there |
|------|----------------|
| `%USERPROFILE%\.rentitout\prometheus-data` | The measurements Grafana draws |
| `%USERPROFILE%\.rentitout\grafana-data\grafana.db` | Grafana's own dashboard file, not the samples |
| `%USERPROFILE%\.rentitout\tools\prometheus-3.15.0.windows-amd64` | The Prometheus program |
| `C:\Program Files\GrafanaLabs\grafana` | The Grafana program |
| `C:\Program Files\GrafanaLabs\grafana\conf\custom.ini` | Locks Grafana to `127.0.0.1:3030` |
| `C:\RentAPP\loadtests\public-pages.js` | The pages k6 requests |
| `C:\RentAPP\loadtests\grafana\dashboards\rentitout-load.json` | The graph layout |

## After code or env changes

Starting the app already builds the latest code. Run the same start command again:

```powershell
cd C:\RentAPP
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-app.ps1
```

Tunnel does **not** need a restart for app-only changes.

---

## Optional: auto-start on Windows reboot

Run once in **Admin PowerShell** if you want the site to come back after a reboot without manual commands:

```powershell
# PostgreSQL is manual. To make it start with Windows instead:
# Set-Service postgresql-x64-17 -StartupType Automatic
# Still confirm after a reboot:
Get-Service postgresql-x64-17

pm2 startup
# Run the command PM2 prints, then build and start once:
cd C:\RentAPP
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-app.ps1

cloudflared service install
cloudflared service start
```

To disable auto-start later:

```powershell
pm2 unstartup
cloudflared service stop
cloudflared service uninstall
```

**Note:** Closing the laptop lid (sleep) still pauses everything until the machine wakes up.

---

## Local database

PostgreSQL runs on this PC at `127.0.0.1:5432` (database `rentitout`, Windows service `postgresql-x64-17`). It is not published through the Cloudflare tunnel. Do not forward port 5432 on the router.

Data directory: `C:\Program Files\PostgreSQL\17\data`

Apply schema changes:

```powershell
cd C:\RentAPP
npm run db:schema
```

Backup (keep the dump off GitHub):

```powershell
New-Item -ItemType Directory -Force -Path C:\RentAPP\backups | Out-Null
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h 127.0.0.1 -U rentitout -d rentitout -F c -f C:\RentAPP\backups\rentitout.dump
```

## Important files (do not delete)

| Path | Purpose |
|------|---------|
| `C:\RentAPP\.env.local` | Production secrets and config |
| `C:\Program Files\PostgreSQL\17\data` | Local PostgreSQL data directory |
| `C:\Users\apexd\.cloudflared\config.yml` | Tunnel hostnames and local port |
| `C:\Users\apexd\.cloudflared\abf2b036-c718-4e22-876f-496f63e1eb21.json` | Tunnel credentials |
| `C:\RentAPP\public\uploads\listing-images` | Uploaded listing images (back up regularly) |
| `%USERPROFILE%\.rentitout\prometheus-data` | Load-test measurements shown in Grafana |
| `C:\Program Files\GrafanaLabs\grafana\conf\custom.ini` | Keeps Grafana on port 3030, off the website port |

---

## reCAPTCHA reminder

If contact reveal shows **"Invalid domain for site key"**, add `rentitout.in` and `www.rentitout.in` in [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin). No rebuild needed for domain-only changes.

## What happens when you close the laptop?

Sleep or shutdown stops PM2, cloudflared, Grafana, and Prometheus. The public site goes offline until you run the start steps above. PostgreSQL does not start with Windows. Grafana and Prometheus do not start with Windows. Start the database with the database command after you sign in, and start the load-test graphs only when you want a test. Closing Cursor does not stop the database, the website, or the tunnel.

## More detail

- [README.md](README.md) — project overview and doc index
- [docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md](docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md) — full tunnel setup, reCAPTCHA, security
- [docs/SETUP.md](docs/SETUP.md) — local PostgreSQL, Resend, env vars
