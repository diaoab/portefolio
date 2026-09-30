#!/usr/bin/env bash
# Sauvegarde quotidienne de la base et des fichiers envoyés (garde les 14 derniers jours).
# Installation : crontab -e  puis ajouter :  0 3 * * * /home/folio/portefolio/deploy/backup.sh
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/backups"
STAMP="$(date +%F)"
mkdir -p "$DEST"
sqlite3 "$APP_DIR/prisma/data.db" ".backup '$DEST/data-$STAMP.db'"
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C "$APP_DIR" uploads
find "$DEST" -type f -mtime +14 -delete
echo "Sauvegarde OK : $DEST ($STAMP)"
