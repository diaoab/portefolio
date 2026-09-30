#!/usr/bin/env bash
# Mise à jour du site après un « git push » : ./deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
npm ci
npx prisma db push --skip-generate
npx prisma generate
npm run build
pm2 reload folio
echo "✓ Site mis à jour"
