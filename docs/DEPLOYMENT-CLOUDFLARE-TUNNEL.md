# Home Hosting with Cloudflare Tunnel

This guide runs RentItOut on this PC and exposes it through a **Cloudflare Tunnel** (`cloudflared`).

> **Daily reference:** After initial setup, use [HOME-HOSTING.md](../HOME-HOSTING.md). On this PC, start Windows service `postgresql-x64-17`, then `pm2 start ecosystem.config.js`, then `cloudflared tunnel run rentitout-laptop`.

Traffic flows:

```text
Browser → Cloudflare edge (HTTPS) → cloudflared → http://127.0.0.1:3000 → Next.js (PM2)
```

Cloudflare terminates HTTPS at the edge. This PC does not need router port forwarding or a local reverse proxy.

PostgreSQL runs on this same PC. Email uses Resend.

## 1. Prerequisites

- Domain added to Cloudflare with DNS managed by Cloudflare
- Node.js 24 LTS (see `scripts/preflight-prod.mjs`; Node 22 may work for local runs but preflight warns)
- `cloudflared` installed
- PM2 optional but recommended for auto-restart
- Local PostgreSQL installed and schema applied (`npm run db:schema`)
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
DATABASE_URL=postgresql://rentitout:replace-with-local-password@127.0.0.1:5432/rentitout
AUTH_OTP_SECRET=your-long-random-secret
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RESEND_API_KEY=re_...
EMAIL_FROM=RentItOut <noreply@rentitout.in>
LISTING_PROOF_REVIEW_EMAIL=
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

Use `ecosystem.config.js` (1 instance):

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
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

The Windows config (`ecosystem.config.js`) runs **1 PM2 instance** to leave CPU/RAM for other programs on a laptop.

Tune DB pool in `.env.local`:

```env
DB_POOL_MAX=20
```

With 1 app instance, total DB connections ≈ `DB_POOL_MAX`. Keep the pool inside what the local PostgreSQL `max_connections` setting allows.

To change instance count, edit `instances` in `ecosystem.config.js` and restart PM2.

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

## 13. Home network safety

Cloudflare Tunnel uses **outbound-only** connections from your PC — you do not need router port forwarding for the website.

Recommended practices:

- Do **not** open inbound ports (80, 443, 3389, etc.) on your router for this project.
- Enable **2FA** on your Cloudflare account.
- Never commit `.env.local` or `%USERPROFILE%\.cloudflared\*.json` tunnel credentials.
- Keep Windows, Node.js, and `cloudflared` updated.
- Back up `public/uploads/listing-images` and the local PostgreSQL database (`pg_dump`).

## 14. Project Milestones (Day 1 -> Current)

- `2026-04-22`: Day-1 Next.js scaffold committed.
- `2026-04-25`: RentItOut core import committed.
- `2026-04-28`: Browse UX shift to quick-view + captcha-gated inline contact reveal with modal-first flow.
- `2026-05-04`: Contact reveal bot check migrated to Google reCAPTCHA v2.
- `2026-09-11`: Production live at `rentitout.in` via Cloudflare Tunnel on home hardware; daily ops guide and reCAPTCHA domain setup documented.
- `2026-10-02`: PostgreSQL runs on this PC. The site is published only through Cloudflare Tunnel.
