# RentItOut

RentItOut is a Next.js appliance rental marketplace where owners publish listings and renters discover options, pass a Google reCAPTCHA check, and then view owner contact details.

RentItOut acts as a connector only. Agreements, deposit terms, insurance, transport, and handover are handled offline by both parties.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Neon Postgres
- Resend (emails)

## Current Product Features

- Email/password auth and email OTP sign-in
- Forgot-password reset via email OTP and new-password confirmation
- Owner dashboard with listing create/edit and profile-level contact visibility controls
- Public browse page with category/city/price/agreement/listing-id filters and sorting
- Listing cards with:
  - Quick-view modal on category click (large layout with image + details)
  - Card-level `Contact Details` button flow
- reCAPTCHA-gated contact reveal in two access paths:
  - From card button: reCAPTCHA modal -> contact details modal
  - From quick-view modal: reCAPTCHA modal -> inline contact details section
- Full-screen overlay modals with `X` close buttons and background interaction lock
- Listing proof email notifications and owner posting-payment records (`listing_posting_payments`)
- Standalone listing detail route (`/listings/[id]`) still available for direct/shared links

## Project History (Day 1 -> Current)

- `2026-04-22` (Day 1): Initial Next.js app scaffold.
- `2026-04-25`: Initial RentItOut import (auth, listings, dashboard, data model, browse flow).
- `2026-04-28`: Browse UX refresh:
  - Category click now opens quick-view modal instead of forcing navigation.
  - Contact reveal can be started from both card and quick-view.
  - Captcha/details overlays moved to true screen-level popups.
  - Card hover behavior tuned and background effects suppressed while modals are open.
  - Redundant `View Full Listing Page` action removed from contact popup.
- `2026-05-04`: Contact reveal bot check migrated from custom SVG captcha to Google reCAPTCHA v2 with server-side token verification.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required Setup

1. Create `.env.local` from `.env.example`.
2. Run `db/schema.sql` in Neon SQL editor.

Detailed guides:

- [Setup Guide](docs/SETUP.md)
- [VPS Deployment Guide](docs/DEPLOYMENT-VPS.md)

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - production server
- `npm run lint` - lint check
- `npm run perf:smoke` - quick `autocannon` run against `http://127.0.0.1:3000/`
- `npm run perf:max-rps` - ramp connections until latency/error threshold is crossed
- `npm run perf:max-rps:home` - conservative ramp profile tuned for homepage (`/`)
- `npm run perf:max-rps:browse` - conservative ramp profile tuned for browse (`/browse`)
- `npm run prod:preflight` - production readiness checks (env vars, node version, upload dir writability)
- `npm run prod:build` - run preflight, lint, then production build
- `npm run deploy:prod` - one-command VPS deploy (`git pull`, `npm ci`, `prod:build`, PM2 restart/save)

## Performance Cache Defaults

For lower DB round-trip pressure on browse and listing reads, the app uses in-memory data caching per process:

- `PUBLIC_LISTINGS_CACHE_TTL_MS=120000`
- `LISTING_BY_ID_CACHE_TTL_MS=120000`
- `IN_MEMORY_CACHE_MAX_ENTRIES=300`

Keep TTL values comfortably above `1000` ms in production. Extremely low TTL values effectively disable cache benefits.

## Load Testing With Autocannon

Start the app first (in one terminal):

```bash
npm run build
npm run start
```

Then run load tests from another terminal:

```bash
npm run perf:smoke
```

```bash
npm run perf:max-rps
```

Run isolated endpoint profiles to compare static/home vs DB-heavy browse:

```bash
npm run perf:max-rps:home
```

```bash
npm run perf:max-rps:browse
```

Tune ramp test inputs as needed:

```bash
npm run perf:max-rps -- --url http://127.0.0.1:3000/listings --start 20 --max 400 --step 20 --duration 15 --lag-ms 500 --max-error-pct 1
```

`perf:max-rps` reports the best stable point (max req/s before crossing the lag threshold) based on:

- `p97.5 latency <= lag-ms`
- `(errors + non2xx) / (responses + errors) <= max-error-pct`
