# PR#03 — Branch Protection for `main`

**PR:** PR#03 — Governance PR discipline
**Scope fence:** `docs/` only (this document + roadmap updates)
**Owner action required:** YES — settings must be applied manually in GitHub UI
**Last updated:** 2026-02-07

---

## 1) Why This Matters (plain language)

Right now anyone with write access can push code directly to `main` — the branch that represents your production-ready code. This is like leaving the front door of your business unlocked: nothing bad has happened yet, but there is no protection if something goes wrong.

Branch protection rules are a set of toggles in GitHub that enforce:
- Every change goes through a Pull Request (no sneaking code in)
- Automated checks (lint, tests, build) must pass before merging
- At least one person reviews the code before it reaches `main`

Once enabled, these rules make it physically impossible to merge broken or unreviewed code.

---

## 2) Exact Click-Path in GitHub UI

### Step 1 — Navigate to Branch Protection Settings

1. Go to your repository on GitHub: `github.com/<owner>/majster-ai-oferty`
2. Click **Settings** (gear icon, top-right of the repo page)
3. In the left sidebar, click **Branches** (under "Code and automation")
4. Under "Branch protection rules", click **Add branch protection rule** (or **Add classic branch protection rule** if prompted to choose)

### Step 2 — Configure the Rule

Fill in the form exactly as described below. Each heading matches a section in the GitHub UI.

#### Branch name pattern

```
main
```

Type `main` in the text field. This rule will apply only to the `main` branch.

---

### Required Toggles (check these boxes)

#### A. Require a pull request before merging

- [x] **Require a pull request before merging** — ENABLE
  - [x] **Require approvals** — ENABLE
    - Set **Required number of approvals** to: **1**
  - [ ] Dismiss stale pull request approvals when new commits are pushed — leave UNCHECKED (small team, not needed yet)
  - [ ] Require review from Code Owners — leave UNCHECKED (no CODEOWNERS file configured)
  - [ ] Restrict who can dismiss pull request reviews — leave UNCHECKED

#### B. Require status checks to pass before merging

- [x] **Require status checks to pass before merging** — ENABLE
  - [x] **Require branches to be up to date before merging** — ENABLE

  **Add the following required status checks** (type each name in the search box and select it):

  | Status Check Name | Workflow File | What It Verifies |
  |---|---|---|
  | `Lint & Type Check` | `ci.yml` | ESLint + TypeScript compilation (0 errors) |
  | `Run Tests` | `ci.yml` | Vitest — 281 unit/integration tests |
  | `Build Application` | `ci.yml` | Vite production build succeeds |

  > **Note:** The `Build Application` job already depends on `Lint & Type Check` and `Run Tests` in the CI workflow (`needs: [lint, test]`), so requiring all three is belt-and-suspenders — but explicit is better than implicit.

  **Optional but recommended** (add if the checks appear in the search):

  | Status Check Name | Workflow File | What It Verifies |
  |---|---|---|
  | `e2e` | `e2e.yml` | Playwright smoke tests |
  | `audit` | `security.yml` | npm audit (high/critical vulnerabilities) |
  | `codeql` | `security.yml` | CodeQL static analysis |

  > **Why optional?** E2E and security checks use `paths-ignore` or `continue-on-error`, so they may not always run on docs-only PRs. Making them required could block legitimate docs PRs. Add them only if you want maximum strictness and accept that docs-only PRs may need manual override.

#### C. Additional protections

- [ ] Require signed commits — leave UNCHECKED (not configured for contributors yet)
- [ ] Require linear history — leave UNCHECKED (merge commits are fine for now)
- [x] **Do not allow bypassing the above settings** — ENABLE
  > This prevents even admins from merging without passing checks. Critical for discipline.
- [ ] Restrict who can push to matching branches — leave UNCHECKED (PRs are the only path; direct push is already blocked by the PR requirement above)
- [x] **Include administrators** — ENABLE (if visible as a separate toggle)
  > Ensures the repo owner is also subject to the rules. Builds trust in the process.

#### D. Rules to leave DISABLED

- [ ] Require conversation resolution before merging — UNCHECKED (nice-to-have, enable later)
- [ ] Require deployments to succeed before merging — UNCHECKED (no deployment environments configured in GitHub yet)
- [ ] Lock branch — UNCHECKED (branch must remain open for merging)
- [ ] Allow force pushes — UNCHECKED (never allow on `main`)
- [ ] Allow deletions — UNCHECKED (never allow deleting `main`)

### Step 3 — Save

Click **Create** (or **Save changes** if editing an existing rule).

---

## 3) Required Status Checks — Reference

These are the CI jobs defined in `.github/workflows/` that should gate merges:

```
.github/workflows/ci.yml
├── lint          → "Lint & Type Check"    (lint + type-check)
├── test          → "Run Tests"            (vitest --coverage)
└── build         → "Build Application"    (vite build, depends on lint+test)

.github/workflows/e2e.yml
└── e2e           → "e2e"                  (playwright, skipped on docs-only)

.github/workflows/security.yml
├── audit         → "audit"                (npm audit --audit-level=high)
└── codeql        → "codeql"              (CodeQL analysis)
```

### Quality Gates (aligned with ROADMAP_ENTERPRISE v4 §4)

| Gate | CI Job | Command | Current Result |
|------|--------|---------|----------------|
| Lint | `Lint & Type Check` | `npm run lint` | 0 errors, 17 warnings |
| Type Check | `Lint & Type Check` | `npm run type-check` | 0 errors |
| Tests | `Run Tests` | `npm test` | 281/281 passing |
| Build | `Build Application` | `npm run build` | PASS (31.06s) |

---

## 4) Checklist for Repository Owner

Print this or open it on a second screen while configuring GitHub. Check off each item as you complete it.

### Pre-Configuration

- [ ] I am logged into GitHub as a repository admin
- [ ] I am on the correct repository: `majster-ai-oferty`
- [ ] I have navigated to **Settings → Branches**

### Rule Configuration

- [ ] Branch name pattern is set to `main`
- [ ] "Require a pull request before merging" is **ON**
- [ ] Required approvals is set to **1**
- [ ] "Require status checks to pass before merging" is **ON**
- [ ] "Require branches to be up to date before merging" is **ON**
- [ ] Status check `Lint & Type Check` is added
- [ ] Status check `Run Tests` is added
- [ ] Status check `Build Application` is added
- [ ] "Do not allow bypassing the above settings" is **ON**
- [ ] "Allow force pushes" is **OFF** (unchecked)
- [ ] "Allow deletions" is **OFF** (unchecked)

### Post-Configuration

- [ ] I clicked **Create** / **Save changes**
- [ ] I see the rule listed under "Branch protection rules" for `main`
- [ ] I ran the verification steps from §5 below

---

## 5) Verification — How to Confirm Rules Are Active

After saving the branch protection rule, verify it is working correctly:

### Test 1 — Visual Confirmation

1. Go to **Settings → Branches** in the GitHub UI
2. You should see a rule listed for `main` with a green shield icon
3. Click on the rule to confirm all toggles match §2 above

### Test 2 — PR Check Enforcement

1. Create a test branch: `git checkout -b test/branch-protection-verify`
2. Make a trivial change (e.g., add a blank line to this file)
3. Push and open a PR targeting `main`
4. Verify that:
   - [ ] The PR shows "Review required" status
   - [ ] The PR shows pending status checks (`Lint & Type Check`, `Run Tests`, `Build Application`)
   - [ ] The "Merge" button is **disabled** until checks pass and review is approved
5. After verifying, close the PR without merging and delete the test branch

### Test 3 — Direct Push Block

1. Try pushing directly to `main`:
   ```bash
   git checkout main
   git commit --allow-empty -m "test: verify branch protection"
   git push origin main
   ```
2. Expected result: **Push rejected** with an error message about branch protection
3. This confirms direct pushes are blocked

### Test 4 — API Verification (optional, advanced)

Run this command (requires `gh` CLI authenticated):

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '{
    required_reviews: .required_pull_request_reviews.required_approving_review_count,
    required_checks: [.required_status_checks.contexts[]],
    enforce_admins: .enforce_admins.enabled,
    allow_force_pushes: .allow_force_pushes.enabled,
    allow_deletions: .allow_deletions.enabled
  }'
```

Expected output:
```json
{
  "required_reviews": 1,
  "required_checks": ["Lint & Type Check", "Run Tests", "Build Application"],
  "enforce_admins": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

---

## 6) Emergency Bypass Procedure

If a critical hotfix must be merged and checks are failing for unrelated reasons:

1. **Do NOT disable branch protection permanently**
2. Go to **Settings → Branches → main rule**
3. Temporarily uncheck "Do not allow bypassing the above settings"
4. Merge the hotfix PR (admin can bypass)
5. **Immediately re-enable** "Do not allow bypassing the above settings"
6. Document the bypass in the PR description with reason and timestamp
7. Create a follow-up issue to fix whatever caused the check failure

> **Rule:** Every bypass must be documented. No silent overrides.

---

## 7) Future Enhancements (not in scope for PR#03)

These can be added later as the team grows:

- **CODEOWNERS file** — auto-assign reviewers based on file paths
- **Required conversation resolution** — all PR comments must be resolved before merge
- **Signed commits** — cryptographic proof of commit authorship
- **Deployment environments** — require successful deployment before merge
- **Branch protection for `develop`** — same rules for the development branch
- **Ruleset migration** — GitHub Rulesets (newer feature) offer more granular control

---

## Related Documents

- [ROADMAP_ENTERPRISE.md](./ROADMAP_ENTERPRISE.md) — Source of Truth (PR#03 status)
- [PR_PLAYBOOK.md](./PR_PLAYBOOK.md) — PR discipline and workflow
- [TRACEABILITY_MATRIX.md](./TRACEABILITY_MATRIX.md) — Requirements traceability
- [ADR-0000](./ADR/ADR-0000-source-of-truth.md) — Source of Truth decision record
- `.github/workflows/ci.yml` — CI pipeline (lint, test, build)
- `.github/workflows/e2e.yml` — E2E test pipeline
- `.github/workflows/security.yml` — Security checks pipeline
