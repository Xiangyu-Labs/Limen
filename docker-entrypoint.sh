#!/bin/sh
set -e

DATABASE_URL_VALUE="${DATABASE_URL:-sqlite:///./data/limen.db}"

echo "========================================"
echo "  Limen Application Startup"
echo "========================================"
echo "Environment: ${NODE_ENV:-production}"
echo "Database: ${DATABASE_URL_VALUE}"
echo "========================================"

mkdir -p ./data

case "$DATABASE_URL_VALUE" in
  sqlite:///*)
    DB_FILE="${DATABASE_URL_VALUE#sqlite:}"
    DB_FILE="${DB_FILE#///}"
    DB_DIR=$(dirname "$DB_FILE")
    if [ "$DB_DIR" != "." ] && [ -n "$DB_DIR" ]; then
      echo "[INIT] Ensuring database directory exists: $DB_DIR"
      mkdir -p "$DB_DIR"
    fi
    ;;
  sqlite::memory:|sqlite://:memory:)
    echo "[INIT] Using in-memory SQLite database"
    ;;
  *)
    echo "[WARN] Unsupported DATABASE_URL for shell initialization: $DATABASE_URL_VALUE"
    ;;
esac

echo "[INIT] Running database synchronization..."
npm run db:push

echo "[INIT] Running data migrations..."
npm run db:migrate

echo "[INIT] Starting application..."
exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"
