#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"

echo "Checking database property records..."
node scripts/check-db-properties.mjs

echo "Checking static property cache..."
node scripts/check-static-property-cache.mjs

echo "Checking homepage HTML..."
html="$(curl -fsSL "$APP_URL/" || true)"

if printf '%s' "$html" | grep -Eq 'images\.unsplash\.com/photo-1600566753086-00f18fb6b3ea|吉隆坡城市公寓'; then
  echo "ERROR: Homepage is showing static demo room images."
  exit 1
fi

if printf '%s' "$html" | grep -Eq 'aria-label="吉隆坡城市公寓"|alt="吉隆坡城市公寓'; then
  echo "ERROR: Homepage rendered the old demo room card."
  exit 1
fi

if printf '%s' "$html" | grep -q '房源暂时无法加载'; then
  echo "ERROR: Homepage is showing the empty room fallback."
  exit 1
fi

if ! printf '%s' "$html" | grep -q '伊顿公寓'; then
  echo "ERROR: Homepage did not render the uploaded Eaton property records."
  exit 1
fi

if printf '%s' "$html" | grep -Eq '(/api/media/properties/|supabase|aliyuncs|oss-)'; then
  echo "OK: Homepage contains uploaded/remote property media references."
else
  echo "ERROR: Homepage did not expose recognizable uploaded property media in HTML."
  exit 1
fi
