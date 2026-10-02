# VPS Deployment (Next.js + local PostgreSQL + Resend)

This guide deploys RentItOut on Ubuntu with PM2 + Nginx.

> **Alternative:** Production currently runs on **home hardware** via Cloudflare Tunnel. See [DEPLOYMENT-CLOUDFLARE-TUNNEL.md](DEPLOYMENT-CLOUDFLARE-TUNNEL.md) and [HOME-HOSTING.md](../HOME-HOSTING.md). Use this VPS guide if you prefer a dedicated server instead.

## 1. Prerequisites

- Ubuntu 22.04+
- Node.js 24 LTS
- npm
- Nginx
- PM2 (`npm i -g pm2`)
- Domain pointing to VPS public IP
- PostgreSQL 15+ installed on the same machine (localhost only)
- Resend account ready

## 2. Install system packages

```bash
sudo apt update
sudo apt install -y nginx git
```

Install Node.js 24 LTS from NodeSource (or your preferred method), then verify:

```bash
node -v
npm -v
```

## 3. Pull code and install dependencies

```bash
git clone <your-repo-url> /var/www/rent-bridge
cd /var/www/rent-bridge
npm ci
```

## 4. Configure production environment

Use the committed template:

```bash
cp .env.production.example .env.local
nano .env.local
```

Required values:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://rentitout:replace-with-local-password@127.0.0.1:5432/rentitout
AUTH_OTP_SECRET=your-long-random-secret
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RESEND_API_KEY=...
EMAIL_FROM=RentItOut <noreply@yourdomain.com>
LISTING_PROOF_REVIEW_EMAIL=
WEB_CONCURRENCY=2
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_CONNECT_TIMEOUT_MS=5000
DB_POOL_IDLE_TIMEOUT_MS=10000
DB_POOL_MAX_USES=7500
PUBLIC_LISTINGS_CACHE_TTL_MS=120000
LISTING_BY_ID_CACHE_TTL_MS=120000
IN_MEMORY_CACHE_MAX_ENTRIES=300
```

Important:
- Do not use `onboarding@resend.dev` or any `@resend.dev` sender in production.
- Resend must have your domain verified and `EMAIL_FROM` must use that verified domain, otherwise OTP delivery will fail with `403 validation_error`.

## 5. Prepare database schema

Create the local database, set `DATABASE_URL` in `.env.local`, then apply the schema:

```bash
npm run db:schema
```

It is safe to re-run this command on upgrades because statements in `db/schema.sql` are `if not exists` guarded.

## 6. Run production preflight and build

```bash
npm run prod:preflight
npm run prod:build
```

`prod:preflight` checks Node version, required env vars, URL format, and writable upload directory.

For regular updates after go-live, you can use the one-command deploy script:

```bash
npm run deploy:prod
```

## 7. Start app with PM2

Use the committed PM2 config (`ecosystem.config.cjs`):

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command PM2 prints after `pm2 startup`, then:

```bash
pm2 save
pm2 status
```

## 8. Configure Nginx reverse proxy

Template is committed at `deploy/nginx/rent-bridge.conf`.

```bash
sudo cp deploy/nginx/rent-bridge.conf /etc/nginx/sites-available/rent-bridge
sudo nano /etc/nginx/sites-available/rent-bridge
```

Replace `yourdomain.com` with your real domain, then enable:

```bash
sudo ln -s /etc/nginx/sites-available/rent-bridge /etc/nginx/sites-enabled/rent-bridge
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Enable SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 10. Local image uploads in production

Listing images are stored on disk at `public/uploads/listing-images`.

Make sure the app user can write this path:

```bash
mkdir -p /var/www/rent-bridge/public/uploads/listing-images
chown -R <app-user>:<app-group> /var/www/rent-bridge/public/uploads
```

Back up this directory along with your database.

## 11. Verify go-live

- Open the site on your domain
- Sign in / sign up
- Create listing with image upload
- Verify browse cards load and category click opens quick-view modal
- Verify both contact access paths:
  - Card-level `Contact Details` button
  - Quick-view `Contact Details` button
- Verify reCAPTCHA appears as a screen-level popup and closes with `X`
- Verify contact details reveal correctly after successful reCAPTCHA verification
- Verify OTP/listing emails are delivered

## 12. Throughput tuning notes

- `WEB_CONCURRENCY` controls PM2 instances. Default is `2` if unset. Use `max` or a numeric value.
- `DB_POOL_MAX` is per-process. Total possible DB connections is roughly `WEB_CONCURRENCY * DB_POOL_MAX`.
- `PUBLIC_LISTINGS_CACHE_TTL_MS` and `LISTING_BY_ID_CACHE_TTL_MS` reduce repeated DB hits for hot reads.
- Start conservative on small VPS machines:
  - 2 vCPU: `WEB_CONCURRENCY=2`, `DB_POOL_MAX=20`
  - 4 vCPU: `WEB_CONCURRENCY=3`, `DB_POOL_MAX=25`
- After tuning values, restart PM2:

```bash
pm2 restart ecosystem.config.cjs --update-env
pm2 status
```

- Compare endpoint behavior separately when load testing:

```bash
npm run perf:max-rps:home
npm run perf:max-rps:browse
```

## 13. Project Milestones (Day 1 -> Current)

- `2026-04-22`: Day-1 Next.js scaffold committed.
- `2026-04-25`: RentItOut core import committed.
- `2026-04-28`: Browse UX shift to quick-view + captcha-gated inline contact reveal with modal-first flow.
- `2026-05-04`: Contact reveal bot check migrated to Google reCAPTCHA v2.
- `2026-09-11`: Home hardware + Cloudflare Tunnel path added as primary production option; VPS remains supported via this guide.
- `2026-10-02`: Database is local PostgreSQL on the host machine. Hosted cloud database services are not used.
