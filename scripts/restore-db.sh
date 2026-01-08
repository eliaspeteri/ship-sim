#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "Usage: ./scripts/restore-db.sh <backup.sql>"
  exit 1
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  psql "$DATABASE_URL" < "$FILE"
else
  : "${PGHOST:=localhost}"
  : "${PGPORT:=5432}"
  : "${PGUSER:=postgres}"
  : "${PGDATABASE:=ship_sim}"
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE" < "$FILE"
fi

echo "Restore complete from $FILE"
