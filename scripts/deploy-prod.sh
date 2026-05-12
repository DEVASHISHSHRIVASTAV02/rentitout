#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${1:-/var/www/rent-bridge}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Deploy directory does not exist: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Installing dependencies"
npm ci

echo "==> Running production build pipeline"
npm run prod:build

echo "==> Restarting PM2 app"
pm2 startOrRestart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs --update-env
pm2 save

echo "==> PM2 status"
pm2 status

echo "Deploy complete."
