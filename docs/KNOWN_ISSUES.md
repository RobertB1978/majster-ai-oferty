# Known Issues & Monitoring

This document tracks known non-critical issues that are being monitored but do not impact application functionality.

---

## 🟡 Supabase ESM Build Warnings (Benign)

**Status:** Monitoring
**Impact:** None - build completes successfully, all tests pass
**First observed:** December 2024
**Supabase version:** `@supabase/supabase-js@2.87.3` (latest stable)

### Warning Details

During Vite production builds, two warnings appear:

```
node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs (46:10):
"default" is not exported by "node_modules/@supabase/supabase-js/dist/module/index.js",
imported by "node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs".

node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs (94:21):
"default" is not exported by "node_modules/@supabase/supabase-js/dist/module/index.js",
imported by "node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs".
```

### Root Cause

This is an ESM/CJS interop issue within the Supabase client library itself, not our code. The warnings occur during the Vite build process when resolving module exports between ESM wrapper and CommonJS module.

### Why It's Safe to Ignore

1. ✅ **Build succeeds** - Despite warnings, build completes successfully
2. ✅ **All tests pass** - No runtime errors, all 188 tests passing
3. ✅ **App functions correctly** - No impact on Supabase client functionality
4. ✅ **Latest stable version** - Using `2.87.3` (latest as of Dec 2024)
5. ✅ **Upstream issue** - This is a known packaging issue in Supabase client itself

### What We're Doing

- **Monitoring:** Tracking in production logs (Sentry/Vercel)
- **Watching upstream:** Monitoring Supabase releases for fix
- **No workarounds:** Avoiding Vite/Rollup hacks that could introduce real bugs

### When to Revisit

- [ ] When Supabase releases version `2.88.x` or `3.x.x` with ESM fix
- [ ] If production errors appear related to Supabase client module resolution
- [ ] If Vite upgrade changes warning behavior

### References

- Supabase client: https://github.com/supabase/supabase-js
- Similar issue discussions: [Supabase GitHub Issues](https://github.com/supabase/supabase-js/issues)

---

**Last Updated:** 2024-12-16
**Next Review:** When upgrading Supabase client or if production issues arise
