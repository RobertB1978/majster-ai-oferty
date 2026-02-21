# Release Checklist

**Security Pack Δ1 - PROMPT 10/10**

Use this checklist before every production release.

---

## Pre-Release (1-2 days before)

### Code Quality

- [ ] All unit tests pass: `npm test`
- [ ] All E2E tests pass: `npm run e2e`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] ESLint clean: `npm run lint`
- [ ] Bundle size within budget

### Security

- [ ] No high/critical vulnerabilities: `npm audit`
- [ ] Secrets rotated (if needed)
- [ ] RLS policies reviewed
- [ ] API keys valid
- [ ] CORS settings correct

### Documentation

- [ ] CHANGELOG.md updated
- [ ] README.md current
- [ ] API docs updated
- [ ] Migration guide (if breaking changes)

### Database

- [ ] Migrations tested on staging
- [ ] Backup verified
- [ ] Rollback plan ready
- [ ] No destructive operations

---

## Staging Verification

- [ ] Deploy to staging
- [ ] Run full E2E test suite
- [ ] Manual smoke test
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Test migrations

---

## Release Day

### Pre-Deployment

- [ ] Code freeze (no new commits)
- [ ] Final review with team
- [ ] Notify users (if major changes)
- [ ] Schedule maintenance window (if needed)

### Deployment

- [ ] Merge PR to main
- [ ] Monitor deployment logs
- [ ] Verify production build
- [ ] Run smoke tests
- [ ] Check error monitoring (Sentry)

### Post-Deployment (within 1 hour)

- [ ] Health check: `curl https://majster-ai-oferty.vercel.app (TEMP)/api/health`
- [ ] Login works
- [ ] Critical flows work
- [ ] No error spikes in Sentry
- [ ] Performance metrics normal
- [ ] Database queries efficient

---

## Post-Release (within 24 hours)

### Monitoring

- [ ] Check Sentry for new errors
- [ ] Review Web Vitals
- [ ] Monitor database performance
- [ ] Check API rate limits
- [ ] Review user feedback

### Documentation

- [ ] Tag release in Git: `git tag v1.2.3`
- [ ] Update changelog on GitHub
- [ ] Announce in team chat
- [ ] Update status page (if applicable)

---

## Rollback Procedure

If critical issues found:

1. **Immediate:** Revert Vercel deployment
   ```bash
   vercel rollback
   ```

2. **Database:** Run rollback migrations (if any)
   ```bash
   npx supabase db reset --db-url postgresql://...
   ```

3. **Notify:** Inform team and users

4. **Investigate:** Debug in staging

5. **Fix forward:** Prepare hotfix

---

## Release Types

### Patch Release (v1.0.x)

**Scope:** Bug fixes only
**Timeline:** Deploy same day
**Checklist:** ✅ Unit tests only

### Minor Release (v1.x.0)

**Scope:** New features (backward compatible)
**Timeline:** Deploy within 1 week
**Checklist:** ✅ Full checklist

### Major Release (vx.0.0)

**Scope:** Breaking changes
**Timeline:** Deploy within 1 month
**Checklist:** ✅ Full checklist + migration guide

---

## Hotfix Procedure

For critical production bugs:

1. Create hotfix branch: `hotfix/critical-bug`
2. Fix bug + add test
3. Deploy to staging
4. Fast-track PR review
5. Deploy to production (skip normal timeline)
6. Monitor closely
7. Backport to develop

---

## Version Numbering

We use **Semantic Versioning** (semver):

```
MAJOR.MINOR.PATCH
  1  .  2  .  3

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes
```

Examples:
- `1.0.0` → `1.0.1` - Bug fix
- `1.0.1` → `1.1.0` - New feature
- `1.1.0` → `2.0.0` - Breaking change

---

## Communication

### Before Release

- [ ] Notify team in Slack/Discord
- [ ] Schedule release time
- [ ] Send email (if major changes)

### After Release

- [ ] Post release notes
- [ ] Update documentation site
- [ ] Tweet/social media (optional)

---

## Metrics to Track

After each release, record:

- Deployment time
- Downtime (if any)
- Error rate (before/after)
- Performance (LCP, CLS, INP)
- User complaints
- Rollback (yes/no)

Use this data to improve process.

---

**Last updated:** 2025-12-16
