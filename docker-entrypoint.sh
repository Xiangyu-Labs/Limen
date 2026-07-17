#!/bin/sh
set -e

if [ -z "${AUTH_PASSWORD:-}" ]; then
  echo "[ERROR] AUTH_PASSWORD is required" >&2
  exit 1
fi

if [ "${#SESSION_SECRET}" -lt 32 ]; then
  echo "[ERROR] SESSION_SECRET must contain at least 32 characters" >&2
  exit 1
fi

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

echo "[INIT] Starting application..."
exec node server.js
