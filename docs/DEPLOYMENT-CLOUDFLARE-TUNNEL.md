# Home Hosting with Cloudflare Tunnel

This guide runs RentItOut on your own hardware (Windows or Linux) and exposes it through a **Cloudflare Tunnel** (`cloudflared`). Traffic flows:

```text
Browser → Cloudflare edge (HTTPS) → cloudflared → http://127.0.0.1:3000 → Next.js (PM2)
```

You do **not** need:

- A VPS
- Router port forwarding
- Nginx or Certbot (Cloudflare terminates TLS at the edge)

You **do** still use cloud services for Postgres (Neon) and email (Resend), same as the VPS guide.

## 1. Prerequisites

- Domain added to Cloudflare with DNS managed by Cloudflare
- Node.js 24 LTS (see `scripts/preflight-prod.mjs`; Node 22 may work for local runs but preflight warns)
- `cloudflared` installed
- PM2 optional but recommended for auto-restart
- Neon database schema applied (`db/schema.sql`)
- Production env configured (`.env.local` or `.env.production`)

## 2. Install cloudflared

**Windows:**

```powershell
winget install Cloudflare.cloudflared
```

**Linux (Debian/Ubuntu):**

```bash
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
```

Verify:

```bash
cloudflared --version
```

## 3. Authenticate and create a tunnel

```bash
cloudflared tunnel login
```

Pick the domain you want to use (for example `rentitout.in`).

Create a named tunnel:

```bash
cloudflared tunnel create rentitout-laptop
```

Note the tunnel ID and credentials JSON path (for example `%USERPROFILE%\.cloudflared\<TUNNEL-ID>.json` on Windows).

## 4. Configure ingress

Copy the repo template and edit hostnames:

**Windows:** `%USERPROFILE%\.cloudflared\config.yml`  
**Linux:** `/etc/cloudflared/config.yml`

Template: [`deploy/cloudflared/config.example.yml`](../deploy/cloudflared/config.example.yml)

Example:

```yaml
tunnel: rentitout-laptop
credentials-file: C:\Users\you\.cloudflared\YOUR-TUNNEL-ID.json

ingress:
  - hostname: rentitout.in
    service: http://127.0.0.1:3000
  - hostname: www.rentitout.in
    service: http://127.0.0.1:3000
  - service: http_status:404
```

The catch-all `http_status:404` rule is required as the last ingress entry.

## 5. Route DNS to the tunnel

```bash
cloudflared tunnel route dns rentitout-laptop rentitout.in
cloudflared tunnel route dns rentitout-laptop www.rentitout.in
```

This creates Cloudflare CNAME records — no A record to your home IP is needed.

Confirm the tunnel exists:

```bash
cloudflared tunnel list
cloudflared tunnel info rentitout-laptop
```

## 6. Configure production environment

Use `.env.local` (or `.env.production`) with your public URL:

```env
NEXT_PUBLIC_APP_URL=https://rentitout.in
DATABASE_URL=postgresql://...
AUTH_OTP_SECRET=your-long-random-secret
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RESEND_API_KEY=re_...
EMAIL_FROM=RentItOut <noreply@rentitout.in>
LISTING_PROOF_REVIEW_EMAIL=
WEB_CONCURRENCY=2
DB_POOL_MAX=20
PUBLIC_LISTINGS_CACHE_TTL_MS=120000
LISTING_BY_ID_CACHE_TTL_MS=120000
IN_MEMORY_CACHE_MAX_ENTRIES=300
```

Also update external services:

| Service | Action |
|---------|--------|
| Google reCAPTCHA | Add `rentitout.in` (and `www`) to allowed domains — see below |
| Resend | Verify sending domain; do not use `@resend.dev` in production |

### Fix reCAPTCHA "Invalid domain for site key"

This error means your reCAPTCHA key is not authorized for the domain you are visiting (for example `rentitout.in`). The app code is fine; Google blocks the widget until the domain is allowlisted.

1. Open [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin).
2. Select the site whose **Site key** matches `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in your `.env.local`.
3. Under **Domains**, add:
   - `rentitout.in`
   - `www.rentitout.in`
   - Do **not** include `https://` — domain only.
4. Click **Save**.
5. Hard-refresh the site (`Ctrl+Shift+R`) and try the bot check again.

No rebuild is needed if you only add domains to an existing key. Changes usually apply within a minute.

If the key was created for localhost only and you cannot edit it, create a **new** reCAPTCHA v2 **"I'm not a robot" Checkbox** site:

1. Label: `RentItOut Production`
2. Domains: `rentitout.in`, `www.rentitout.in`
3. Copy the new **Site key** and **Secret key** into `.env.local`:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<new-site-key>
RECAPTCHA_SECRET_KEY=<new-secret-key>
```

4. Rebuild and restart:

```bash
npm run build
pm2 restart next-app
```

Rebuild after changing `NEXT_PUBLIC_*` values:

```bash
npm run prod:build
```

If Node 24 is not installed yet, you can build with `npm run build` for a quick local tunnel test, but use `prod:build` before go-live.

## 7. Start the Next.js app

From the project root:

```bash
npm ci
npm run prod:build
```

**PM2 (recommended):**

Windows — use the repo root config:

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

Linux — edit `cwd` in `ecosystem.config.cjs` to your checkout path, then:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

**One-off test:**

```bash
npm run start
```

Confirm locally: `http://127.0.0.1:3000`

## 8. Run the tunnel

**Foreground test:**

```bash
cloudflared tunnel run rentitout-laptop
```

Open `https://rentitout.in` in a browser.

**Run as a service (survives reboot):**

Windows:

```powershell
cloudflared service install
cloudflared service start
```

Linux:

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

## 9. Local uploads

Listing images are stored on disk at `public/uploads/listing-images`. Back up this directory with your database.

Ensure the app user can write there:

```bash
mkdir -p public/uploads/listing-images
```

## 10. Verify go-live

- Site loads on `https://rentitout.in`
- Sign up / sign in and OTP email delivery
- Browse listings and quick-view modal
- reCAPTCHA contact reveal on card and quick-view paths
- Listing create with image upload

## 11. Home hardware tuning

Start conservative on a laptop or small PC:

```env
WEB_CONCURRENCY=2
DB_POOL_MAX=20
```

Total DB connections ≈ `WEB_CONCURRENCY × DB_POOL_MAX`. Neon free tiers have connection limits — keep this in mind.

Load test locally before sharing widely:

```bash
npm run perf:max-rps:home
npm run perf:max-rps:browse
```

## 12. Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Cloudflare 502 / tunnel error | App not listening on `127.0.0.1:3000`; restart PM2 or `npm run start` |
| Tunnel shows no active connections | Run `cloudflared tunnel run <name>` or start the cloudflared service |
| Wrong links / redirects | Set `NEXT_PUBLIC_APP_URL=https://yourdomain.com` and rebuild |
| reCAPTCHA "Invalid domain for site key" | Add `rentitout.in` + `www.rentitout.in` in [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) for your site key |
| reCAPTCHA fails after key change | Update both keys in `.env.local`, run `npm run build`, then `pm2 restart next-app` |
| OTP emails fail | Verify Resend domain and `EMAIL_FROM` |
| DNS not resolving to tunnel | Re-run `cloudflared tunnel route dns ...` |

Useful commands:

```bash
cloudflared tunnel list
cloudflared tunnel info rentitout-laptop
pm2 status
pm2 logs next-app
curl -I http://127.0.0.1:3000/
```

## 13. Comparison with VPS deploy

| | VPS (`DEPLOYMENT-VPS.md`) | Cloudflare Tunnel (this guide) |
|--|--|--|
| Public IP exposure | Yes | No |
| Reverse proxy | Nginx | cloudflared |
| TLS certificates | Certbot | Cloudflare edge |
| Best for | Dedicated server, high traffic | Home hardware, low ops overhead |

Both approaches run the same Next.js build and share Neon + Resend configuration.
