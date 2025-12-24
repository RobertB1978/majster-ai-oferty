#!/usr/bin/env bash

set -euo pipefail

echo "[audit] Enforcing production dependency policy (moderate+)."
npm audit --omit=dev --audit-level=moderate

echo "[audit] Gathering full diagnostics (including dev deps; non-blocking)."
if ! npm audit --audit-level=moderate; then
  echo "[audit] Detected vulnerabilities outside production scope (likely dev tooling such as vite/esbuild)." >&2
  echo "[audit] Production dependencies remain enforced via --omit=dev. See above for details." >&2
fi
