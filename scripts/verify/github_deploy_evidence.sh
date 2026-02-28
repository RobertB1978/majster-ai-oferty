#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

API_BASE="https://api.github.com"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[FAIL] Brak GITHUB_TOKEN (w Actions jest dostępny jako secrets.GITHUB_TOKEN)."
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  ORIGIN_URL="$(git config --get remote.origin.url || true)"
  if [[ "$ORIGIN_URL" =~ github.com[:/](.+/.+?)(\.git)?$ ]]; then
    REPO="${BASH_REMATCH[1]}"
  fi
fi

if [ -z "$REPO" ]; then
  echo "[FAIL] Nie mogę ustalić nazwy repo (GITHUB_REPOSITORY lub git remote)."
  exit 1
fi

api_get() {
  local path="$1"
  curl -sS \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "${API_BASE}${path}"
}

echo "=== GITHUB DEPLOYMENT EVIDENCE (bez dashboardów) ==="
echo "Repo: ${REPO}"

REPO_JSON="$(api_get "/repos/${REPO}")"
DEFAULT_BRANCH="$(python - <<'PY' <<<"$REPO_JSON"
import json,sys
try:
    data=json.load(sys.stdin)
except json.JSONDecodeError:
    data={}
print(data.get('default_branch',''))
PY
)"

if [ -z "$DEFAULT_BRANCH" ]; then
  echo "[WARN] Nie udało się ustalić default_branch."
else
  echo "Default branch: ${DEFAULT_BRANCH}"
fi

echo
echo "--- Deployments (ostatnie 10) ---"
DEPLOYMENTS_JSON="$(api_get "/repos/${REPO}/deployments?per_page=10")"
DEPLOY_COUNT="$(python - <<'PY' <<<"$DEPLOYMENTS_JSON"
import json,sys
try:
    data=json.load(sys.stdin)
    print(len(data))
except json.JSONDecodeError:
    print(0)
PY
)"

if [ "$DEPLOY_COUNT" -eq 0 ]; then
  echo "[FAIL] Brak GitHub Deployments w repo (API: /deployments)."
else
  echo "[INFO] Liczba deploymentów: ${DEPLOY_COUNT}"
fi

PASS_PRODUCTION=0
PASS_PREVIEW=0

DEPLOY_LINES="$(python - <<'PY' <<<"$DEPLOYMENTS_JSON"
import json,sys
try:
    data=json.load(sys.stdin)
except json.JSONDecodeError:
    data=[]
for d in data:
    print(f"{d.get('id')}|{d.get('environment','')}|{d.get('ref','')}|{d.get('sha','')}|{d.get('created_at','')}")
PY
)"

if [ -n "$DEPLOY_LINES" ]; then
  while IFS='|' read -r DEPLOY_ID DEPLOY_ENV DEPLOY_REF DEPLOY_SHA DEPLOY_CREATED; do
    if [ -z "$DEPLOY_ID" ]; then
      continue
    fi
    STATUS_JSON="$(api_get "/repos/${REPO}/deployments/${DEPLOY_ID}/statuses?per_page=1")"
    STATUS_LINE="$(python - <<'PY' <<<"$STATUS_JSON"
import json,sys
try:
    data=json.load(sys.stdin)
except json.JSONDecodeError:
    data=[]
if not data:
    print("none||| ")
else:
    s=data[0]
    state=s.get('state','')
    env_url=s.get('environment_url') or ''
    log_url=s.get('log_url') or ''
    created=s.get('created_at') or ''
    print(f"{state}|{env_url}|{log_url}|{created}")
PY
)"
    IFS='|' read -r STATUS_STATE STATUS_ENV_URL STATUS_LOG_URL STATUS_CREATED <<<"$STATUS_LINE"

    echo "- id=${DEPLOY_ID} env=${DEPLOY_ENV} ref=${DEPLOY_REF} sha=${DEPLOY_SHA} created=${DEPLOY_CREATED}"
    if [ "$STATUS_STATE" = "none" ]; then
      echo "  status: [FAIL] brak statusów deploymentu"
    else
      echo "  status: state=${STATUS_STATE} created=${STATUS_CREATED}"
      if [ -n "$STATUS_ENV_URL" ]; then
        echo "  environment_url: ${STATUS_ENV_URL}"
      fi
      if [ -n "$STATUS_LOG_URL" ]; then
        echo "  log_url: ${STATUS_LOG_URL}"
      fi
    fi

    if [ "$STATUS_STATE" = "success" ] && [ -n "$STATUS_ENV_URL" ]; then
      case "$DEPLOY_ENV" in
        production|prod)
          PASS_PRODUCTION=1
          ;;
        preview|staging|development)
          PASS_PREVIEW=1
          ;;
      esac
    fi
  done <<<"$DEPLOY_LINES"
fi

echo
echo "--- Environments (GitHub) ---"
ENV_JSON="$(api_get "/repos/${REPO}/environments")"
ENV_LINES="$(python - <<'PY' <<<"$ENV_JSON"
import json,sys
try:
    data=json.load(sys.stdin)
except json.JSONDecodeError:
    data={}
for env in data.get('environments', []) or []:
    print(env.get('name',''))
PY
)"
if [ -z "$ENV_LINES" ]; then
  echo "[FAIL] Brak środowisk GitHub (production/preview)."
else
  echo "[INFO] Zdefiniowane środowiska:"
  echo "$ENV_LINES" | sed 's/^/  - /'
fi

echo
echo "--- Check runs (szukam Vercel) ---"
if [ -n "$DEFAULT_BRANCH" ]; then
  COMMIT_JSON="$(api_get "/repos/${REPO}/commits/${DEFAULT_BRANCH}")"
  HEAD_SHA="$(python - <<'PY' <<<"$COMMIT_JSON"
import json,sys
try:
    data=json.load(sys.stdin)
except json.JSONDecodeError:
    data={}
print(data.get('sha',''))
PY
)"
  if [ -n "$HEAD_SHA" ]; then
    CHECKS_JSON="$(api_get "/repos/${REPO}/commits/${HEAD_SHA}/check-runs?per_page=100")"
    CHECK_LINES="$(python - <<'PY' <<<"$CHECKS_JSON"
import json,sys,re
try:
    data=json.load(sys.stdin)
except json.JSONDecodeError:
    data={}
checks=data.get('check_runs', []) or []
vercel=[c for c in checks if re.search(r'vercel', (c.get('name','') or ''), re.I)]
for c in vercel:
    print(f"{c.get('name','')}|{c.get('status','')}|{c.get('conclusion','')}")
PY
)"
    if [ -z "$CHECK_LINES" ]; then
      echo "[FAIL] Brak check runów Vercel na HEAD (${HEAD_SHA})."
    else
      echo "[PASS] Wykryto check runy Vercel:"
      while IFS='|' read -r NAME STATUS CONCLUSION; do
        echo "  - ${NAME} (status=${STATUS}, conclusion=${CONCLUSION})"
      done <<<"$CHECK_LINES"
    fi
  else
    echo "[WARN] Nie udało się pobrać SHA dla ${DEFAULT_BRANCH}."
  fi
else
  echo "[WARN] Brak default_branch, pomijam check runs."
fi

echo
echo "--- Werdykt (na podstawie GitHub Deployments + publiczny URL) ---"
if [ "$PASS_PRODUCTION" -eq 1 ]; then
  echo "[PASS] Vercel Production: success + environment_url"
else
  echo "[FAIL] Vercel Production: brak success+environment_url w GitHub Deployments"
fi

if [ "$PASS_PREVIEW" -eq 1 ]; then
  echo "[PASS] Vercel Preview: success + environment_url"
else
  echo "[FAIL] Vercel Preview: brak success+environment_url w GitHub Deployments"
fi

echo
echo "[INFO] Supabase: brak natywnych GitHub Deployments/Checks bez dodatkowego integratora/sekretu."
