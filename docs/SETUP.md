# RentItOut Setup Guide (local PostgreSQL + Resend)

Use this guide for **local development**. For production hosting, see:

- [HOME-HOSTING.md](../HOME-HOSTING.md) — daily start/stop on this PC
- [DEPLOYMENT-CLOUDFLARE-TUNNEL.md](DEPLOYMENT-CLOUDFLARE-TUNNEL.md) — first-time Cloudflare Tunnel setup

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Create `.env.local` in the project root. That one file is what both `npm run dev` and the production app read. Copy:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=postgresql://rentitout:replace-with-local-password@127.0.0.1:5432/rentitout
AUTH_OTP_SECRET=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

RESEND_API_KEY=
EMAIL_FROM=
LISTING_PROOF_REVIEW_EMAIL=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Leave false until Razorpay is used
PAYMENTS_ENABLED=false
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Optional performance tuning
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_CONNECT_TIMEOUT_MS=5000
DB_POOL_IDLE_TIMEOUT_MS=10000
DB_POOL_MAX_USES=7500
PUBLIC_LISTINGS_CACHE_TTL_MS=120000
LISTING_BY_ID_CACHE_TTL_MS=120000
IN_MEMORY_CACHE_MAX_ENTRIES=300
```

### Where to copy each value

- `DATABASE_URL`: PostgreSQL on this machine, for example `postgresql://rentitout:password@127.0.0.1:5432/rentitout`.
- `AUTH_OTP_SECRET`: random long secret for OTP hashing (use at least 32 chars).
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: Google reCAPTCHA v2 site key (public, browser-side).
- `RECAPTCHA_SECRET_KEY`: Google reCAPTCHA secret key (server-side only).
- `NEXT_PUBLIC_APP_URL`: local `http://localhost:3000`, production should be your final domain.
- `RESEND_API_KEY`: Resend API key for transactional emails.
- `EMAIL_FROM`: verified sender in Resend (example: `RentItOut <noreply@yourdomain.com>`).
- `LISTING_PROOF_REVIEW_EMAIL`: optional comma-separated admin/reviewer emails for listing proof copy.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: optional GA4 id, such as `G-XXXXXXXX`.
- `PAYMENTS_ENABLED` and the `RAZORPAY_*` keys: leave payments off until Razorpay is used.
- `DB_POOL_MAX`: max concurrent PostgreSQL connections per app process.
- `DB_POOL_MIN`: idle connections retained in pool per app process.
- `DB_POOL_CONNECT_TIMEOUT_MS`: DB connection wait timeout.
- `DB_POOL_IDLE_TIMEOUT_MS`: idle connection recycle timeout.
- `DB_POOL_MAX_USES`: rotate connections after N queries to reduce stale-connection issues.
- `PUBLIC_LISTINGS_CACHE_TTL_MS`: in-memory cache duration for `/browse` query results.
- `LISTING_BY_ID_CACHE_TTL_MS`: in-memory cache duration for listing detail lookup.
- `IN_MEMORY_CACHE_MAX_ENTRIES`: maximum in-memory cache entries per app process.

## 3. Configure Google reCAPTCHA

1. Create a reCAPTCHA v2 **"I'm not a robot" Checkbox** site at [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin).
2. For **local dev**, add `localhost` to allowed domains.
3. For **production** (for example `rentitout.in`), also add your public domain and `www` subdomain:
   - `rentitout.in`
   - `www.rentitout.in`
   - Domain only — no `https://` prefix.
4. Copy the **Site key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and **Secret key** → `RECAPTCHA_SECRET_KEY`.

If you see **"Invalid domain for site key"** in production, the domain is missing from the reCAPTCHA allowlist. See [DEPLOYMENT-CLOUDFLARE-TUNNEL.md](DEPLOYMENT-CLOUDFLARE-TUNNEL.md#fix-recaptcha-invalid-domain-for-site-key).

## 4. Create the local database

Install PostgreSQL 15 or newer and keep it bound to localhost (do not forward port 5432 on the router).

Windows example after PostgreSQL is installed:

```powershell
$env:PGPASSWORD = "<postgres-superuser-password>"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -c "create user rentitout with password 'replace-with-local-password';"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h 127.0.0.1 -c "create database rentitout owner rentitout;"
```

Then apply the schema from the project root:

```bash
npm run db:schema
```

Re-running `npm run db:schema` is safe. `db/schema.sql` uses `if not exists` guards.

This creates:
- users + profiles tables
- auth sessions + OTP tables
- listings and owner posting-payment tables
- indices, views, and triggers

## 5. Configure Resend (OTP + listing proof emails)

1. Create account at Resend and verify your sending domain/sender.
2. Generate API key and set `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to a verified sender.
4. Optional: set `LISTING_PROOF_REVIEW_EMAIL` to receive listing proof copies.

Important:
- If Resend is not domain-verified yet (or `EMAIL_FROM` uses `@resend.dev`), OTP emails will fail for real users with a `403 validation_error`.
- Production sender should look like `RentItOut <noreply@yourdomain.com>`.

## 6. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## 7. First functional test checklist

1. Sign up and create an owner profile.
2. Create a listing with image.
3. Open `/browse` in another browser session and confirm the listing card appears.
4. Click the listing category title to open the quick-view modal.
5. Click `Contact Details` inside quick view and solve reCAPTCHA.
6. Confirm contact details render inline in quick view after successful verification.
7. Also test the card-level `Contact Details` button (second access path).
8. Verify owner email/phone visibility follows profile settings in dashboard.
9. OTP sign-in works from the sign-in page.
10. Forgot-password flow works: request reset OTP, set new password, and sign in with new password.

## 8. Going to production

After local dev works:

1. Set `NEXT_PUBLIC_APP_URL=https://yourdomain.com` in `.env.local`.
2. Allowlist your domain in Google reCAPTCHA (see section 3).
3. Verify your sending domain in Resend.
4. Run `npm run prod:build`.
5. Follow [DEPLOYMENT-CLOUDFLARE-TUNNEL.md](DEPLOYMENT-CLOUDFLARE-TUNNEL.md) to publish this machine with Cloudflare Tunnel.
6. Use [HOME-HOSTING.md](../HOME-HOSTING.md) for daily start/stop commands.

## 9. Load tests

k6, Prometheus, and Grafana measure the site from this PC. They are not part of bringing the website online, and they do not start when Windows starts. Grafana listens on `127.0.0.1:3030`. Prometheus listens on `127.0.0.1:9090` and stores the measurements. Commands, data folders, and the rule that keeps Grafana off port 3000 are in [HOME-HOSTING.md](../HOME-HOSTING.md).
