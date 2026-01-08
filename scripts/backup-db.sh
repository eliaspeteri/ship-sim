#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$OUT_DIR/ship_sim_$STAMP.sql"

if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump "$DATABASE_URL" > "$FILE"
else
  : "${PGHOST:=localhost}"
  : "${PGPORT:=5432}"
  : "${PGUSER:=postgres}"
  : "${PGDATABASE:=ship_sim}"
  pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE" > "$FILE"
fi

echo "Backup written to $FILE"
