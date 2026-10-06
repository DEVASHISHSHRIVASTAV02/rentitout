# RentItOut

RentItOut is a Next.js appliance rental marketplace where owners publish listings and renters discover options, pass a Google reCAPTCHA check, and then view owner contact details.

RentItOut acts as a connector only. Agreements, deposit terms, insurance, transport, and handover are handled offline by both parties.

## Production

- **Live site:** [https://rentitout.in](https://rentitout.in)
- **Hosting:** This PC, via **Cloudflare Tunnel**. PostgreSQL runs on the same machine.
- **Daily ops:** [HOME-HOSTING.md](HOME-HOSTING.md) — start/stop the site, post-reboot commands

Start, stop, backup, and load-test commands are in [HOME-HOSTING.md](HOME-HOSTING.md).

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Local PostgreSQL (on the same machine as the app)
- Resend (emails)
- Google reCAPTCHA v2 (contact reveal)
- Cloudflare Tunnel (`cloudflared`) for public HTTPS
- k6, Prometheus, and Grafana for load tests on this PC (not required for the public site)

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
- `2026-04-28`: Browse uses a quick-view modal, and contact reveal can start from the card or that modal.
- `2026-05-04`: Contact reveal bot check moved to Google reCAPTCHA v2.
- `2026-09-11`: Production moved to home hardware with Cloudflare Tunnel (`rentitout.in`), Windows PM2 config (`ecosystem.config.js`, 1 instance), daily ops guide, and reCAPTCHA domain allowlisting for production.
- `2026-10-02`: PostgreSQL runs on this PC. The public site is served from this machine through Cloudflare Tunnel.
- `2026-10-06`: Local load tests use k6, Prometheus on port 9090, and Grafana on port 3030. They do not start with Windows.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

First-time setup, including the single `.env.local` template, is in [docs/SETUP.md](docs/SETUP.md).

## Documentation

| Guide | Use when |
|-------|----------|
| [Setup Guide](docs/SETUP.md) | First-time setup (local PostgreSQL, Resend, reCAPTCHA, env vars) |
| [Home Hosting Daily Ops](HOME-HOSTING.md) | **Daily reference** — bring site online/offline, and start or stop Grafana, Prometheus, and k6 |
| [Cloudflare Tunnel Setup](docs/DEPLOYMENT-CLOUDFLARE-TUNNEL.md) | Initial home-hosting setup (tunnel, DNS, reCAPTCHA, PM2) |

Production process manager: `ecosystem.config.js` (1 app process, with a 2-minute cache for anonymous public pages on port 3000).

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - production server
- `npm run lint` - lint check
- `npm run db:schema` - apply `db/schema.sql` to the database in `DATABASE_URL`
- `npm run prod:preflight` - production readiness checks (env vars, node version, upload dir writability)
- `npm run prod:build` - run preflight, lint, then production build
