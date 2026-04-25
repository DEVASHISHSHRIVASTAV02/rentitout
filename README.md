# RentItOut

RentItOut is a Next.js appliance rental marketplace where:

- owners post appliance listings
- renters discover listings and contact owners directly from the listing page

RentItOut acts as a connector only. Agreements, deposit terms, insurance, transport, and handover are handled offline by the two parties.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Neon Postgres
- Resend (emails)

## Features

- Email/password auth
- Email OTP sign-in flow
- Public listing discovery with filters
- Listing detail page with direct owner contact details (email/phone visibility controlled by owner)
- Owner dashboard for listing management and profile contact-visibility settings
- Owner posting-payment records (`listing_posting_payments`)
- Listing proof email notifications

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required setup

1. Create `.env.local` from `.env.example`
2. Run `db/schema.sql` in Neon SQL editor

Detailed steps:

- [Setup Guide](docs/SETUP.md)
- [VPS Deployment Guide](docs/DEPLOYMENT-VPS.md)

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - production server
- `npm run lint` - lint check
- `npm run prod:preflight` - production readiness checks (env vars, node version, upload dir writability)
- `npm run prod:build` - run preflight, lint, then production build
