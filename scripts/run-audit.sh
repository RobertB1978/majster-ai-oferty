#!/usr/bin/env bash

set -uo pipefail

AUDIT_LEVEL="${AUDIT_LEVEL:-moderate}"

echo "==> Running npm audit for production dependencies (omit=dev) at level: ${AUDIT_LEVEL}"
npm audit --omit=dev --audit-level="${AUDIT_LEVEL}"
prod_status=$?

echo "==> Running full npm audit for diagnostics (non-blocking) at level: ${AUDIT_LEVEL}"
npm audit --audit-level="${AUDIT_LEVEL}" || true

if [[ ${prod_status} -ne 0 ]]; then
  echo "❌ npm audit reported ${AUDIT_LEVEL}+ vulnerabilities in production dependencies. Failing."
  exit "${prod_status}"
fi

echo "✅ npm audit passed for production dependencies at level: ${AUDIT_LEVEL}"
