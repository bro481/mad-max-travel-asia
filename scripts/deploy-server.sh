#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/admin/apps/madmaxtravel}"
TMP_DIR="${TMP_DIR:-/tmp/madmaxtravel-latest}"
REPO_URL="${REPO_URL:-https://github.com/bro481/mad-max-travel-asia.git}"
PM2_APP="${PM2_APP:-madmaxtravel}"

echo "== MAD MAX deploy =="
echo "App:  $APP_DIR"
echo "Repo: $REPO_URL"

if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: APP_DIR does not exist: $APP_DIR"
  exit 1
fi

env_files=()
for file in "$APP_DIR/.env" "$APP_DIR/.env.local" "$APP_DIR/.env.production"; do
  [ -f "$file" ] && env_files+=("$file")
done

if [ "${#env_files[@]}" -eq 0 ]; then
  echo "ERROR: No .env file found in $APP_DIR. Refusing to deploy."
  exit 1
fi

if ! grep -h '^DATABASE_URL=' "${env_files[@]}" >/dev/null 2>&1; then
  echo "ERROR: DATABASE_URL is missing from $APP_DIR/.env*. Real room images will not load."
  exit 1
fi

rm -rf "$TMP_DIR"
git clone --depth 1 "$REPO_URL" "$TMP_DIR"
git -C "$TMP_DIR" log --oneline -1

rsync -a --delete \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.production' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  "$TMP_DIR"/ "$APP_DIR"/

cd "$APP_DIR"
npm install
rm -rf .next
npm run vercel-build
pm2 restart "$PM2_APP" --update-env
sleep 2
pm2 status "$PM2_APP"

bash scripts/check-production-data.sh

echo "Deploy complete."
