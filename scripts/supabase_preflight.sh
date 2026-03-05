#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

REPORT_FILE="${1:-supabase-preflight-report.txt}"

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required}"
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required}"

if [[ ! "$SUPABASE_PROJECT_REF" =~ ^[a-z0-9]{20}$ ]]; then
  echo "Invalid SUPABASE_PROJECT_REF format" >&2
  exit 1
fi

if [ ! -f "supabase/config.toml" ]; then
  echo "Missing supabase/config.toml" >&2
  exit 1
fi

CONFIG_PROJECT_REF="$(awk -F '"' '/^project_id\s*=/{print $2; exit}' supabase/config.toml)"
if [ -z "$CONFIG_PROJECT_REF" ]; then
  echo "Missing project_id in supabase/config.toml" >&2
  exit 1
fi

if [ "$CONFIG_PROJECT_REF" != "$SUPABASE_PROJECT_REF" ]; then
  echo "Project ref mismatch between secret and supabase/config.toml" >&2
  exit 1
fi

if [ ! -d "supabase/migrations" ]; then
  echo "Missing supabase/migrations directory" >&2
  exit 1
fi

mkdir -p "$(dirname "$REPORT_FILE")"

required_tables=(offers user_subscriptions offer_approvals)

# Discover additional tables from migrations (best-effort).
mapfile -t discovered_tables < <(
  awk '
    BEGIN { IGNORECASE = 1 }
    {
      gsub(/\r/, "")
      if (match($0, /create[[:space:]]+table[[:space:]]+(if[[:space:]]+not[[:space:]]+exists[[:space:]]+)?("?[a-zA-Z0-9_]+"?\.)?"?([a-zA-Z0-9_]+)"?/, m)) {
        print tolower(m[3])
      }
    }
  ' supabase/migrations/*.sql | sort -u
)

all_tables=("${required_tables[@]}")
if [ "${#discovered_tables[@]}" -gt 0 ]; then
  all_tables+=("${discovered_tables[@]}")
fi
mapfile -t all_tables < <(printf '%s\n' "${all_tables[@]}" | sed '/^$/d' | sort -u)

if [ "${#all_tables[@]}" -eq 0 ]; then
  echo "Could not identify any tables to verify from required list or migrations" >&2
  exit 1
fi

supabase login --token "$SUPABASE_ACCESS_TOKEN" >/dev/null
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" >/dev/null

DB_HOST="db.${SUPABASE_PROJECT_REF}.supabase.co"
REST_BASE_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1"
CLI_VERSION="$(supabase --version | head -n1)"

{
  echo "Supabase Preflight Report"
  echo "Generated at (UTC): $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo "CLI version: ${CLI_VERSION}"
  echo "Project ref used: ${SUPABASE_PROJECT_REF}"
  echo "Config project ref: ${CONFIG_PROJECT_REF}"
  echo
  echo "Discovered migration tables:"
  if [ "${#discovered_tables[@]}" -eq 0 ]; then
    echo "- NONE (UNKNOWN: no CREATE TABLE statements parsed from migrations)"
  else
    printf -- '- %s\n' "${discovered_tables[@]}"
  fi
  echo
  echo "Table existence checks (SQL to_regclass):"
} > "$REPORT_FILE"

failed=0
for table in "${all_tables[@]}"; do
  exists_result="$(PGPASSWORD="$SUPABASE_DB_PASSWORD" \
    psql "host=${DB_HOST} port=5432 dbname=postgres user=postgres sslmode=require" \
    -tA -v ON_ERROR_STOP=1 \
    -c "select case when to_regclass('public.${table}') is not null then 'PASS' else 'FAIL' end;")"
  exists_result="$(echo "$exists_result" | tr -d '[:space:]')"

  if [ "$exists_result" = "PASS" ]; then
    echo "- ${table}: PASS" >> "$REPORT_FILE"
  else
    echo "- ${table}: FAIL" >> "$REPORT_FILE"
    failed=1
  fi
done

echo >> "$REPORT_FILE"
echo "REST endpoint checks (expect non-404):" >> "$REPORT_FILE"

for table in "${all_tables[@]}"; do
  status_code="$(curl -sS -o /dev/null -w '%{http_code}' \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    "${REST_BASE_URL}/${table}?select=*&limit=1")"

  if [ "$status_code" = "404" ]; then
    echo "- ${table}: FAIL (HTTP 404)" >> "$REPORT_FILE"
    failed=1
  else
    echo "- ${table}: PASS (HTTP ${status_code})" >> "$REPORT_FILE"
  fi
done

if [ "$failed" -ne 0 ]; then
  echo "Preflight checks failed. See ${REPORT_FILE}" >&2
  exit 1
fi

echo "Preflight checks passed. Report: ${REPORT_FILE}"
