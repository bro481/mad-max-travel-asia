#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
source_dir="$project_dir/public/airbnb-importer"
download_dir="$project_dir/public/downloads"
archive="$download_dir/my-malaysia-airbnb-importer.zip"

mkdir -p "$download_dir"
rm -f "$archive"
cd "$project_dir/public"
zip -q -r "$archive" airbnb-importer -x "*.DS_Store" "*/__MACOSX/*"
test -s "$archive"
echo "Built $archive"
