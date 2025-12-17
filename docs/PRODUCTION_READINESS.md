# Production Readiness Checklist

**Security Pack Δ1 - PROMPT 6/10**

Use this checklist before deploying to production.

---

## 🔐 Security

- [ ] **Environment variables set** (Vercel Production)
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_SENTRY_DSN`
  - [ ] `VITE_SENTRY_AUTH_TOKEN`

- [ ] **Supabase Secrets configured**
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`
  - [ ] `FRONTEND_URL`

- [ ] **RLS (Row Level Security) enabled** on all tables
- [ ] **API keys rotated** (not using defaults)
- [ ] **CORS configured** correctly
- [ ] **CSP headers** enabled

---

## 🧪 Testing

- [ ] **All unit tests pass**: `npm test`
- [ ] **Build succeeds**: `npm run build`
- [ ] **E2E smoke tests pass**: `npm run e2e`
- [ ] **A11y tests pass**: `npm run e2e -- a11y.spec.ts`
- [ ] **Manual smoke test** on staging

---

## 📊 Monitoring

- [ ] **Sentry configured** (error tracking)
  - [ ] DSN set in Vercel
  - [ ] Test error sent successfully
  - [ ] Alerts configured

- [ ] **Healthcheck endpoint** working
  - [ ] `/api/health` returns 200
  - [ ] Database check passes
  - [ ] Storage check passes

- [ ] **Performance monitoring** enabled
  - [ ] Web Vitals tracked
  - [ ] Core Web Vitals meet targets:
    - LCP < 2.5s
    - CLS < 0.1
    - INP < 200ms

---

## 🚀 Deployment

- [ ] **DNS configured** (custom domain)
- [ ] **SSL certificate** active (HTTPS)
- [ ] **Vercel deployment** successful
- [ ] **Database migrations** applied
- [ ] **Edge Functions** deployed

---

## 📝 Documentation

- [ ] **README.md** updated
- [ ] **CHANGELOG.md** has latest version
- [ ] **API documentation** current
- [ ] **User guides** complete

---

## 🔄 Backup & Recovery

- [ ] **Database backups** enabled (Supabase auto-backup)
- [ ] **Rollback plan** documented
- [ ] **Disaster recovery** tested

---

## 📞 Support

- [ ] **Error tracking** configured
- [ ] **Support email** set up
- [ ] **Status page** (optional)

---

## Quick Health Check

Run this command to verify production health:

```bash
curl https://your-app.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T...",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "pass", "responseTime": 45 },
    "storage": { "status": "pass", "responseTime": 32 },
    "auth": { "status": "pass", "responseTime": 28 }
  }
}
```

---

**Last updated:** 2025-12-16
