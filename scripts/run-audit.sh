#!/usr/bin/env bash

set -euo pipefail

# Fail hard on high/critical issues anywhere in the tree.
echo "🔒 Running npm audit for high and critical vulnerabilities (all dependencies)"
npm audit --audit-level=high

# Fail on moderate+ issues that affect the production dependency tree.
echo "🛡️ Running npm audit for production dependencies (moderate+)"
npm audit --omit=dev --audit-level=moderate

# Provide visibility into dev dependency issues without failing the pipeline.
echo "ℹ️ Running npm audit for full dependency tree (moderate+) for visibility only"
if ! npm audit --audit-level=moderate; then
  echo "⚠️ Moderate vulnerabilities detected in dev dependencies. Logged for awareness; production checks above remain enforced."
fi
