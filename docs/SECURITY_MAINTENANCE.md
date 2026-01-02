# Security Maintenance Policy

**Security Pack Δ1 - PROMPT 8/10**

This document defines how we maintain security over time.

---

## Automated Security Checks

### Dependabot

**Enabled:** ✅
**Schedule:** Weekly (Monday 6 AM)
**Scope:**
- npm dependencies
- GitHub Actions

**Configuration:** `.github/dependabot.yml`

**What it does:**
- Checks for outdated dependencies
- Opens PRs for security updates
- Groups minor/patch updates
- Auto-assigns reviewer

---

### npm audit

**Enabled:** ✅
**Schedule:** On every PR + weekly
**Threshold:** Fails on HIGH or CRITICAL vulnerabilities

**Manual check:**
```bash
npm audit
```

**Fix vulnerabilities:**
```bash
npm audit fix
```

**Force fix (breaking changes):**
```bash
npm audit fix --force
```

> Note: CI audits omit dev-only dependencies so that moderate tooling advisories (e.g., Vite/esbuild GHSA-67mh-4wv8-2f99) do not block the pipeline while production dependencies remain enforced at the configured `AUDIT_LEVEL`.

- [ ] TODO: Schedule a dedicated PR to upgrade Vite/esbuild to the patched line and revalidate build/tests for compatibility.

---

### CodeQL Analysis

**Enabled:** ✅ (if repo has it enabled)
**Schedule:** Weekly + on every PR
**Languages:** JavaScript, TypeScript

**What it detects:**
- SQL injection
- XSS vulnerabilities
- Path traversal
- Command injection
- Prototype pollution
- And 100+ other security patterns

---

## Manual Security Reviews

### Quarterly Reviews

**Schedule:** Every 3 months
**Checklist:**

- [ ] Review all dependencies for alternatives
- [ ] Check for unmaintained packages
- [ ] Audit environment variables
- [ ] Review RLS policies
- [ ] Check API keys rotation
- [ ] Review CORS settings
- [ ] Update security documentation

---

## Dependency Update Policy

### Security Updates

**Priority:** CRITICAL
**Timeline:** Within 24 hours
**Process:**
1. Dependabot opens PR
2. Review changelog
3. Run tests
4. Merge immediately
5. Deploy

### Breaking Changes

**Priority:** HIGH
**Timeline:** Within 1 week
**Process:**
1. Create feature branch
2. Update code
3. Test thoroughly
4. Review with team
5. Merge and deploy

### Minor/Patch Updates

**Priority:** MEDIUM
**Timeline:** Within 1 month
**Process:**
1. Dependabot groups updates
2. Review weekly batch
3. Merge and deploy

---

## Vulnerability Response

### Severity Levels

| Severity | Response Time | Action |
|----------|---------------|--------|
| CRITICAL | < 24 hours | Immediate patch + deploy |
| HIGH | < 1 week | Scheduled patch |
| MODERATE | < 1 month | Next release |
| LOW | < 3 months | Optional |

### Response Process

1. **Detection**
   - Dependabot alert
   - npm audit
   - Manual discovery

2. **Assessment**
   - Check if vulnerability affects our code
   - Review exploit likelihood
   - Determine impact

3. **Fix**
   - Update dependency
   - Or: Remove dependency
   - Or: Implement workaround

4. **Verification**
   - Run tests
   - Check for regressions
   - Verify vulnerability fixed

5. **Deployment**
   - Deploy to staging
   - Test
   - Deploy to production

6. **Documentation**
   - Update CHANGELOG
   - Document in incident log
   - Notify team

---

## Banned Dependencies

These dependencies are NOT allowed due to security concerns:

- ❌ `eval()` usage
- ❌ `dangerouslySetInnerHTML` without sanitization
- ❌ Unmaintained packages (no updates > 2 years)
- ❌ Packages with known critical vulnerabilities

---

## Secret Scanning

**Enabled:** ✅ (GitHub Secret Scanning)
**Scope:**
- API keys
- Database credentials
- Auth tokens
- Private keys

**If secret detected:**
1. Rotate key immediately
2. Check git history for exposure
3. Audit access logs
4. Document incident

---

## Security Contacts

**Security issues:** security@your-domain.com (or GitHub Security Advisories)
**Emergency:** Contact owner directly

---

## Compliance

We maintain compliance with:

✅ **OWASP Top 10** (2021)
✅ **GDPR** (Data Protection)
✅ **RODO** (Polish GDPR)
✅ **SOC 2** best practices

---

**Last updated:** 2025-12-16
