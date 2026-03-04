# Supabase Deployment Pipeline Audit

## Scope
- Workflow files in `.github/workflows`
- Supabase migration directory `supabase/migrations`
- Secrets and command coverage for production deployment path

## Current pipeline architecture
1. **Trigger model**: `workflow_dispatch` only (manual run from Actions UI).
2. **Job**: single job `deploy-supabase` on `ubuntu-latest`.
3. **Stages**:
   - checkout
   - install Supabase CLI
   - `supabase login --token`
   - validate `project_id` vs optional `SUPABASE_PROJECT_REF`
   - `supabase link --project-ref`
   - `supabase db push`
   - looped `supabase functions deploy <name>`
   - verification and REST contract gate

## Secret verification
Required in audit brief:
- `SUPABASE_ACCESS_TOKEN` ✅ used and hard-required
- `SUPABASE_PROJECT_REF` ⚠️ used but optional (warning-only when missing)
- `SUPABASE_ANON_KEY` ⚠️ used but optional (REST gate skipped when missing)
- `SUPABASE_DB_PASSWORD` ❌ not configured in workflow env and not used in any step

## Command verification
- `supabase link` ✅ present
- `supabase db push` ✅ present
- `supabase functions deploy` ✅ present (iterative per function)

## Migrations directory verification
- `supabase/migrations` exists and contains SQL migrations.

## Why migrations might not reach production
1. **No DB password wiring**:
   - Workflow does not expose `SUPABASE_DB_PASSWORD`.
   - `supabase link` is called without `--password`.
   - `supabase db push` relies on an established linked DB credential; in CI this may fail or prompt non-interactively.
2. **Manual trigger only**:
   - No automatic deploy on merge to protected branch.
   - Migrations do not ship unless somebody manually dispatches workflow.
3. **Project ref fallback can misroute deployment**:
   - If `SUPABASE_PROJECT_REF` is absent, workflow continues using `config.toml` value without strict environment enforcement.
   - This can deploy to a non-production project while operator assumes production deploy.

## Missing / weak steps
- Missing hard-fail guard for `SUPABASE_DB_PASSWORD`.
- Missing hard-fail requirement for `SUPABASE_PROJECT_REF` in production deploy.
- Missing explicit non-interactive link using DB password.
- Missing automatic trigger path (optional, depending on release policy).

## Exact fix (recommended)

### 1) Make secrets mandatory and wire DB password
Update workflow env:

```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

Add validation step (or extend existing login/validate step):

```bash
for required in SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF SUPABASE_DB_PASSWORD SUPABASE_ANON_KEY; do
  if [ -z "${!required}" ]; then
    echo "❌ ERROR: $required is not set"
    exit 1
  fi
done
```

### 2) Link with password (non-interactive)
Replace:

```bash
supabase link --project-ref "$PROJECT_REF"
```

With:

```bash
supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
```

### 3) Keep production ref strict
Change `SUPABASE_PROJECT_REF` check from warning-only to fail-fast in production runs.

### 4) Optional reliability hardening
Add automatic trigger (for example on merge to `main` with `supabase/**` and workflow path filters) if release policy allows automated production deploys.

---

## Expected result after fix
- CI run becomes fully non-interactive.
- `supabase db push` can authenticate consistently in GitHub Actions.
- Deploys fail early on missing secrets instead of skipping critical gates.
- Lower risk of "migrations exist in repo but not applied in production".
