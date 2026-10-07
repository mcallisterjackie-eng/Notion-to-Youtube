#!/usr/bin/env bash
# Runs every migration and the database security tests on a throwaway local
# PostgreSQL (no Docker, no network, no Supabase project needed).
#   npm run test:db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PG_BIN/initdb" ] || { echo "PostgreSQL server binaries not found (set PG_BIN)"; exit 1; }

DATA="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
cleanup() { "$PG_BIN/pg_ctl" -D "$DATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

# initdb refuses to run as root; use the postgres user when we are root (cloud sandboxes).
RUN=()
if [ "$(id -u)" = 0 ]; then chown -R postgres "$DATA"; RUN=(runuser -u postgres --); fi

"${RUN[@]}" "$PG_BIN/initdb" -D "$DATA" -U postgres -A trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k $DATA -c listen_addresses=''" -w start >/dev/null

PSQL=(psql -h "$DATA" -p "$PORT" -U postgres -d postgres -X -q -v ON_ERROR_STOP=1)

"${PSQL[@]}" -f "$ROOT/supabase/tests/00_supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "migration  $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
for f in "$ROOT"/supabase/tests/[1-9]*.sql; do
  echo "test       $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "database tests passed"
