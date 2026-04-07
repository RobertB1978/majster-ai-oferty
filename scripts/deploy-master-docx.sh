#!/usr/bin/env bash
# ============================================================
# deploy-master-docx.sh — PR-05a
#
# Upload 5 master DOCX files to Supabase Storage bucket
# 'document-masters' under the path convention:
#   masters/{template_key}/v{version}/{template_key}.docx
#
# Usage:
#   SUPABASE_URL=https://xxx.supabase.co \
#   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
#   bash scripts/deploy-master-docx.sh
#
# Prerequisites:
#   - curl
#   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set
# ============================================================

set -euo pipefail

BUCKET="document-masters"
VERSION="1.0"
MASTERS_DIR="$(dirname "$0")/../public/masters"

TEMPLATES=(
  "contract_fixed_price_standard"
  "contract_cost_plus_standard"
  "contract_with_materials_standard"
  "contract_with_advance_standard"
  "contract_simple_order_standard"
)

# ── Validate env ──────────────────────────────────────────────────────────────

if [[ -z "${SUPABASE_URL:-}" ]]; then
  echo "ERROR: SUPABASE_URL is not set" >&2
  exit 1
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY is not set" >&2
  exit 1
fi

# ── Upload each master DOCX ──────────────────────────────────────────────────

for key in "${TEMPLATES[@]}"; do
  LOCAL_FILE="${MASTERS_DIR}/${key}.docx"
  REMOTE_PATH="masters/${key}/v${VERSION}/${key}.docx"

  if [[ ! -f "$LOCAL_FILE" ]]; then
    echo "SKIP: $LOCAL_FILE not found" >&2
    continue
  fi

  echo "Uploading: $LOCAL_FILE → ${BUCKET}/${REMOTE_PATH}"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
    --data-binary @"${LOCAL_FILE}" \
    "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${REMOTE_PATH}?upsert=true")

  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    echo "  OK (HTTP $HTTP_CODE)"
  else
    echo "  FAIL (HTTP $HTTP_CODE)" >&2
    # Retry once
    echo "  Retrying..."
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
      --data-binary @"${LOCAL_FILE}" \
      "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${REMOTE_PATH}?upsert=true")
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
      echo "  OK after retry (HTTP $HTTP_CODE)"
    else
      echo "  FAIL after retry (HTTP $HTTP_CODE)" >&2
      exit 1
    fi
  fi
done

echo ""
echo "All master DOCX files uploaded to ${BUCKET}."
echo "Run the seed migration (20260407100000) to register them in document_master_templates."
