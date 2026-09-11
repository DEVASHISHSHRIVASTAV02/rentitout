# Home Hosting Daily Ops (RentItOut)

Quick reference for bringing **https://rentitout.in** online or offline from your laptop.

Both of these must be running for the public site to work:

1. **Next.js app** (PM2, port 3000)
2. **Cloudflare Tunnel** (`cloudflared`, tunnel name: `rentitout-laptop`)

If either is stopped, visitors will see a Cloudflare error (502 / tunnel unavailable).

---

## After shutting down or closing your laptop

When you open the laptop again and want the site **live on the internet**, run these in **two separate PowerShell windows** (or one after the other):

### Window 1 — Start the web app

```powershell
cd C:\RentAPP
pm2 start ecosystem.config.js
```

If PM2 already knows the app from a previous session:

```powershell
cd C:\RentAPP
pm2 resurrect
```

### Window 2 — Start the Cloudflare tunnel

```powershell
cloudflared tunnel run rentitout-laptop
```

Leave this window open unless you installed cloudflared as a Windows service (see below).

### Verify the site is live

```powershell
pm2 status
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

### Confirm everything is stopped

```powershell
pm2 status
Get-Process cloudflared -ErrorAction SilentlyContinue
curl.exe -I https://rentitout.in/
```

- PM2 should show no running `next-app` (or status `stopped`).
- `Get-Process cloudflared` should return nothing (unless the service is still running).
- Public URL should fail or show a Cloudflare error — that means the site is offline.

---

## One-page cheat sheet

| Goal | Command |
|------|---------|
| **Go live** | `cd C:\RentAPP` → `pm2 start ecosystem.config.js` → `cloudflared tunnel run rentitout-laptop` |
| **Go offline** | `pm2 stop next-app` → stop cloudflared (`Ctrl+C` or `Stop-Process -Name cloudflared -Force`) |
| **Check app** | `pm2 status` |
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
pm2 unstartup
cloudflared service stop
cloudflared service uninstall
```

**Note:** Closing the laptop lid (sleep) still pauses everything until the machine wakes up.

---

## Important files (do not delete)

| Path | Purpose |
|------|---------|
| `C:\RentAPP\.env.local` | Production secrets and config |
| `C:\Users\apexd\.cloudflared\config.yml` | Tunnel hostnames and local port |
| `C:\Users\apexd\.cloudflared\abf2b036-c718-4e22-876f-496f63e1eb21.json` | Tunnel credentials |
| `C:\RentAPP\public\uploads\listing-images` | Uploaded listing images (back up regularly) |

---

## Load testing (optional)

From `C:\RentAPP` while the app is running:

```powershell
npm run perf:max-rps:home
npm run perf:max-rps:browse
```

---

## More detail

- Full tunnel setup: [docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md](docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md)
- App setup: [docs/SETUP.md](docs/SETUP.md)
