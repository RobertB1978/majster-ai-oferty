# Scripts

Utility scripts for Majster.AI development and operations.

## Deployment Verification

### `verify-deployment.js`

Automated deployment verification script. Checks if deployment is reachable, properly configured, and serving content correctly.

**Usage:**

```bash
node scripts/verify-deployment.js <DEPLOYMENT_URL>
```

**Example:**

```bash
# Verify production deployment
node scripts/verify-deployment.js https://majster-ai.vercel.app

# Verify preview deployment
node scripts/verify-deployment.js https://majster-ai-abc123.vercel.app
```

**Tests performed:**

1. **Reachability** - URL responds with 200 OK
2. **HTML Content** - Valid HTML with React root element
3. **Security Headers** - X-Frame-Options, CSP, HSTS, etc.
4. **Static Assets** - JS and CSS files referenced
5. **Supabase Config** - Check for exposed credentials
6. **SPA Routing** - Vercel rewrites working (/login, /dashboard, etc.)

**Exit codes:**

- `0` - All tests passed
- `1` - One or more tests failed

**After running:**

If automated tests pass, proceed with manual smoke test:
- See `docs/SMOKE_TEST_PROD.md`

---

## Adding New Scripts

When adding scripts to this directory:

1. **Make executable:** `chmod +x scripts/your-script.js`
2. **Add shebang:** `#!/usr/bin/env node` (for Node.js scripts)
3. **Document here:** Add usage and description to this README
4. **Error handling:** Scripts should exit with code 0 (success) or 1 (failure)
5. **Colors/output:** Use consistent formatting (see `verify-deployment.js` for example)

---

## Future Scripts (TODO)

- `backup-database.js` - Trigger Supabase backup
- `health-check.js` - Full health check (DB, Edge Functions, etc.)
- `migrate-db.js` - Run Supabase migrations
- `test-email.js` - Test email sending (Resend)
- `test-ai.js` - Test AI provider connectivity
