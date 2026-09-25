#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"

echo "Checking database property records..."
node scripts/check-db-properties.mjs

echo "Checking homepage HTML..."
html="$(curl -fsSL "$APP_URL/" || true)"

if printf '%s' "$html" | grep -q 'images.unsplash.com/photo-1600566753086-00f18fb6b3ea'; then
  echo "ERROR: Homepage is showing static demo room images."
  exit 1
fi

if printf '%s' "$html" | grep -Eq '(/api/media/properties/|supabase|aliyuncs|oss-)'; then
  echo "OK: Homepage contains uploaded/remote property media references."
else
  echo "WARN: Homepage did not expose recognizable uploaded property media in HTML. Check in browser after refresh."
fi
