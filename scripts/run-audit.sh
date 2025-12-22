#!/usr/bin/env bash

set -euo pipefail

# Default audit level can be overridden via AUDIT_LEVEL env var.
AUDIT_LEVEL="${AUDIT_LEVEL:-moderate}"
ARGS=("$@")

echo "=== Running npm audit (production deps only, omit=dev, level=${AUDIT_LEVEL})"
npm audit --omit=dev --audit-level="${AUDIT_LEVEL}" "${ARGS[@]}"

echo
echo "=== Running npm audit (including dev deps for diagnostics; non-blocking)"
if npm audit --audit-level="${AUDIT_LEVEL}" "${ARGS[@]}"; then
  echo "npm audit diagnostics completed (dev + prod)."
else
  echo "::warning::npm audit reported issues when including dev dependencies (see output above)."
  echo "::warning::Production dependencies are enforced separately with --omit=dev."
fi
