# RentItOut Setup Guide (Neon + Resend)

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Create `.env.local` in project root and copy:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=
AUTH_OTP_SECRET=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

RESEND_API_KEY=
EMAIL_FROM=
LISTING_PROOF_REVIEW_EMAIL=

# Optional performance tuning
DB_POOL_MAX=30
DB_POOL_MIN=2
DB_POOL_CONNECT_TIMEOUT_MS=5000
DB_POOL_IDLE_TIMEOUT_MS=10000
DB_POOL_MAX_USES=7500
PUBLIC_LISTINGS_CACHE_TTL_MS=30000
LISTING_BY_ID_CACHE_TTL_MS=30000
IN_MEMORY_CACHE_MAX_ENTRIES=300
```

### Where to copy each value

- `DATABASE_URL`: Neon connection string from your project dashboard.
- `AUTH_OTP_SECRET`: random long secret for OTP hashing (use at least 32 chars).
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: Google reCAPTCHA v2 site key (public, browser-side).
- `RECAPTCHA_SECRET_KEY`: Google reCAPTCHA secret key (server-side only).
- `NEXT_PUBLIC_APP_URL`: local `http://localhost:3000`, production should be your final domain.
- `RESEND_API_KEY`: Resend API key for transactional emails.
- `EMAIL_FROM`: verified sender in Resend (example: `RentItOut <noreply@yourdomain.com>`).
- `LISTING_PROOF_REVIEW_EMAIL`: optional comma-separated admin/reviewer emails for listing proof copy.
- `DB_POOL_MAX`: max concurrent PostgreSQL connections per app process.
- `DB_POOL_MIN`: idle connections retained in pool per app process.
- `DB_POOL_CONNECT_TIMEOUT_MS`: DB connection wait timeout.
- `DB_POOL_IDLE_TIMEOUT_MS`: idle connection recycle timeout.
- `DB_POOL_MAX_USES`: rotate connections after N queries to reduce stale-connection issues.
- `PUBLIC_LISTINGS_CACHE_TTL_MS`: in-memory cache duration for `/browse` query results.
- `LISTING_BY_ID_CACHE_TTL_MS`: in-memory cache duration for listing detail lookup.
- `IN_MEMORY_CACHE_MAX_ENTRIES`: maximum in-memory cache entries per app process.

## 3. Create Neon schema

1. Open Neon SQL Editor.
2. Copy full contents of `db/schema.sql`.
3. Run it.
4. Re-running `db/schema.sql` later is safe and also creates newly added indexes/extensions (`if not exists` guarded).

This creates:
- users + profiles tables
- auth sessions + OTP tables
- listings and owner posting-payment tables
- indices, views, and triggers

## 4. Configure Resend (OTP + listing proof emails)

1. Create account at Resend and verify your sending domain/sender.
2. Generate API key and set `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to a verified sender.
4. Optional: set `LISTING_PROOF_REVIEW_EMAIL` to receive listing proof copies.

Important:
- If Resend is not domain-verified yet (or `EMAIL_FROM` uses `@resend.dev`), OTP emails will fail for real users with a `403 validation_error`.
- Production sender should look like `RentItOut <noreply@yourdomain.com>`.

## 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## 6. First functional test checklist

1. Sign up and create an owner profile.
2. Create a listing with image.
3. Open `/browse` in another browser session and confirm the listing card appears.
4. Click the listing category title to open the quick-view modal.
5. Click `Contact Details` inside quick view and solve reCAPTCHA.
6. Confirm contact details render inline in quick view after successful verification.
7. Also test the card-level `Contact Details` button (second access path).
8. Verify owner email/phone visibility follows profile settings in dashboard.
9. OTP sign-in works from the sign-in page.

## 7. Project Milestones (Day 1 -> Current)

- `2026-04-22`: Day-1 project scaffold (Next.js base app).
- `2026-04-25`: Core RentItOut product import (auth, listing CRUD, browse, dashboard, payments table, emails).
- `2026-04-28`: Browse/contact UX update:
  - Category now opens a large quick-view modal.
  - Captcha and contact details use screen-level overlays.
  - Contact reveal is accessible from both card button and quick-view.
  - Redundant quick-view redirect button removed.
- `2026-05-04`: Contact reveal verification switched to Google reCAPTCHA v2 with backend token verification.
