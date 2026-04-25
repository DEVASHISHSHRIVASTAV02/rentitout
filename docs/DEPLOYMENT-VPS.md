# VPS Deployment (Next.js + Neon + Resend)

This guide deploys RentItOut on Ubuntu with PM2 + Nginx.

## 1. Prerequisites

- Ubuntu 22.04+
- Node.js 24 LTS
- npm
- Nginx
- PM2 (`npm i -g pm2`)
- Domain pointing to VPS public IP
- Neon database and Resend account ready

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
DATABASE_URL=postgresql://...
AUTH_OTP_SECRET=your-long-random-secret
CONTACT_GATE_SECRET=your-long-random-secret
RESEND_API_KEY=...
EMAIL_FROM=RentItOut <noreply@yourdomain.com>
LISTING_PROOF_REVIEW_EMAIL=
```

## 5. Prepare database schema

Run `db/schema.sql` in Neon SQL Editor for your production database.

## 6. Run production preflight and build

```bash
npm run prod:preflight
npm run prod:build
```

`prod:preflight` checks Node version, required env vars, URL format, and writable upload directory.

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
- Verify listing page and contact visibility
- Verify OTP/listing emails are delivered
