# Home Hosting Daily Ops (RentItOut)

Quick reference for bringing **https://rentitout.in** online or offline from your laptop.

> First-time setup? See [docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md](docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md).  
> Local dev / env vars? See [docs/SETUP.md](docs/SETUP.md).

All of these must be running for the public site to work:

1. **Local PostgreSQL** on `127.0.0.1:5432` (database: `rentitout`)
2. **Next.js app** (PM2, port 3000)
3. **Cloudflare Tunnel** (`cloudflared`, tunnel name: `rentitout-laptop`)

If either is stopped, visitors will see a Cloudflare error (502 / tunnel unavailable).

---

## After shutting down or closing your laptop

When you open the laptop again and want the site **live on the internet**, run these in order:

### Window 1 — Start local PostgreSQL

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D C:\PostgreSQLData\17 -l "$env:USERPROFILE\.rentitout\postgres.log" -o "-p 5432" start
```

### Window 2 — Start the web app

```powershell
cd C:\RentAPP
pm2 start ecosystem.config.js
```

If PM2 already knows the app from a previous session:

```powershell
cd C:\RentAPP
pm2 resurrect
```

### Window 3 — Start the Cloudflare tunnel

```powershell
cloudflared tunnel run rentitout-laptop
```

Leave this window open unless you installed cloudflared as a Windows service (see below).

### Verify the site is live

```powershell
pm2 status
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U rentitout -d rentitout -tAc "select 1"
curl.exe -I http://127.0.0.1:3000/
curl.exe -I https://rentitout.in/
cloudflared tunnel info rentitout-laptop
```

Then open **https://rentitout.in** in your browser.

---

## Take the site offline (stop app + tunnel)

Use this when you want the site **down** and to free CPU/RAM for other programs.

### Stop the web app

```powershell
pm2 stop next-app
```

To fully remove it from PM2’s process list:

```powershell
pm2 delete next-app
pm2 save
```

### Stop the Cloudflare tunnel

**If tunnel is running in a terminal window:** press `Ctrl+C` in that window.

**If tunnel is running as a background process:**

```powershell
Stop-Process -Name cloudflared -Force
```

**If you installed cloudflared as a Windows service:**

```powershell
cloudflared service stop
```

### Stop local PostgreSQL (optional)

Use this only if you want to free memory while the site is down.

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D C:\PostgreSQLData\17 stop
```

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
| **Go live** | `pg_ctl start` → `pm2 start ecosystem.config.js` → `cloudflared tunnel run rentitout-laptop` |
| **Go offline** | `pm2 stop next-app` → stop cloudflared (`Ctrl+C` or `Stop-Process -Name cloudflared -Force`) |
| **Stop local DB** | `pg_ctl stop -D C:\PostgreSQLData\17` |
| **Check app** | `pm2 status` |
| **Check DB** | `psql -h 127.0.0.1 -U rentitout -d rentitout -tAc "select 1"` |
| **Check tunnel** | `cloudflared tunnel info rentitout-laptop` |
| **Check local site** | `curl.exe -I http://127.0.0.1:3000/` |
| **Check public site** | `curl.exe -I https://rentitout.in/` |
| **App logs** | `pm2 logs next-app` |
| **Restart app only** | `pm2 restart next-app` |

---

## App resource usage

The app runs **1 PM2 instance** (1 CPU core footprint) to leave headroom for other programs.

Config file: `ecosystem.config.js`

To apply config changes:

```powershell
cd C:\RentAPP
pm2 delete next-app
pm2 start ecosystem.config.js
pm2 save
```

---

## After code or env changes

If you change `.env.local` or pull new code:

```powershell
cd C:\RentAPP
npm run build
pm2 restart next-app
```

Tunnel does **not** need a restart for app-only changes.

---

## Optional: auto-start on Windows reboot

Run once in **Admin PowerShell** if you want the site to come back after a reboot without manual commands:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" register -N postgresql-x64-17-local -D C:\PostgreSQLData\17 -S auto
Start-Service postgresql-x64-17-local

pm2 startup
# Run the command PM2 prints, then:
cd C:\RentAPP
pm2 start ecosystem.config.js
pm2 save

cloudflared service install
cloudflared service start
```

To disable auto-start later:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" unregister -N postgresql-x64-17-local
pm2 unstartup
cloudflared service stop
cloudflared service uninstall
```

**Note:** Closing the laptop lid (sleep) still pauses everything until the machine wakes up.

---

## Local database

PostgreSQL runs on this PC at `127.0.0.1:5432` (database `rentitout`). It is not published through the Cloudflare tunnel. Do not forward port 5432 on the router.

In this setup PostgreSQL is started with `pg_ctl` from the Go Live commands above.

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
| `C:\PostgreSQLData\17` | Local PostgreSQL data directory |
| `C:\Users\apexd\.cloudflared\config.yml` | Tunnel hostnames and local port |
| `C:\Users\apexd\.cloudflared\abf2b036-c718-4e22-876f-496f63e1eb21.json` | Tunnel credentials |
| `C:\RentAPP\public\uploads\listing-images` | Uploaded listing images (back up regularly) |

---

## reCAPTCHA reminder

If contact reveal shows **"Invalid domain for site key"**, add `rentitout.in` and `www.rentitout.in` in [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin). No rebuild needed for domain-only changes.

## What happens when you close the laptop?

Sleep or shutdown stops both PM2 and cloudflared. The public site goes offline until you run the **Go live** commands again (or install auto-start services in the optional section above).

## More detail

- [README.md](README.md) — project overview and doc index
- [docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md](docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md) — full tunnel setup, reCAPTCHA, security
- [docs/SETUP.md](docs/SETUP.md) — local PostgreSQL, Resend, env vars
