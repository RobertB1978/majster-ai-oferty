#!/bin/bash
# upload-masters-to-supabase.sh -- PR-05a
# Upload 5 master DOCX files to Supabase Storage bucket 'document-masters'
#
# Usage:
#   export SUPABASE_URL=https://your-project.supabase.co
#   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   bash scripts/upload-masters-to-supabase.sh
#
# Requires: curl

set -euo pipefail

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
  exit 1
fi

BUCKET="document-masters"
MASTERS_DIR="$(dirname "$0")/../public/masters"

TEMPLATES=(
  "contract_fixed_price_standard"
  "contract_cost_plus_standard"
  "contract_with_materials_standard"
  "contract_with_advance_standard"
  "contract_simple_order_standard"
)

# Map template_key to local filename (local files don't have _standard suffix)
declare -A LOCAL_FILES
LOCAL_FILES["contract_fixed_price_standard"]="contract_fixed_price.docx"
LOCAL_FILES["contract_cost_plus_standard"]="contract_cost_plus.docx"
LOCAL_FILES["contract_with_materials_standard"]="contract_with_materials.docx"
LOCAL_FILES["contract_with_advance_standard"]="contract_with_advance.docx"
LOCAL_FILES["contract_simple_order_standard"]="contract_simple_order.docx"

for key in "${TEMPLATES[@]}"; do
  local_file="${LOCAL_FILES[$key]}"
  src="$MASTERS_DIR/$local_file"
  dest="masters/${key}/v1.0/${key}.docx"

  if [ ! -f "$src" ]; then
    echo "SKIP: $src not found"
    continue
  fi

  echo "Uploading: $local_file -> $dest"

  curl -s -X POST \
    "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${dest}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
    -H "x-upsert: true" \
    --data-binary "@${src}" \
    -o /dev/null -w "  HTTP %{http_code}\n"
done

echo "Done. All 5 master DOCX files uploaded."
