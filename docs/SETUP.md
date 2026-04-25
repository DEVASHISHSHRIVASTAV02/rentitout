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
CONTACT_GATE_SECRET=

RESEND_API_KEY=
EMAIL_FROM=
LISTING_PROOF_REVIEW_EMAIL=
```

### Where to copy each value

- `DATABASE_URL`: Neon connection string from your project dashboard.
- `AUTH_OTP_SECRET`: random long secret for OTP hashing (use at least 32 chars).
- `CONTACT_GATE_SECRET`: optional but recommended dedicated secret for contact captcha signing.
- `NEXT_PUBLIC_APP_URL`: local `http://localhost:3000`, production should be your final domain.
- `RESEND_API_KEY`: Resend API key for transactional emails.
- `EMAIL_FROM`: verified sender in Resend (example: `RentItOut <noreply@yourdomain.com>`).
- `LISTING_PROOF_REVIEW_EMAIL`: optional comma-separated admin/reviewer emails for listing proof copy.

## 3. Create Neon schema

1. Open Neon SQL Editor.
2. Copy full contents of `db/schema.sql`.
3. Run it.

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

## 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## 6. First functional test checklist

1. Sign up and create an owner profile.
2. Create a listing with image.
3. Open that listing in another browser session and click "View Details".
4. Verify owner email/phone visibility follows profile settings in dashboard.
5. OTP sign-in works from the sign-in page.
