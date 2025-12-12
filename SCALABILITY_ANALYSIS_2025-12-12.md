# SCALABILITY ANALYSIS & RECOMMENDATIONS
**Date:** 2025-12-12
**Auditor:** Claude Code (Sonnet 4.5)
**Current Capacity:** ~100-500 concurrent users (estimated)
**Target Capacity:** 1,000-5,000 concurrent users

---

## EXECUTIVE SUMMARY

**Current State:** ✅ **GOOD FOR LAUNCH** (small-medium scale)

**Strengths:**
- ✅ Serverless architecture (Vercel + Supabase = auto-scaling)
- ✅ CDN-backed frontend (Vercel Edge Network)
- ✅ Connection pooling (Supabase PgBouncer)
- ✅ Optimized bundle sizes (Phase 2: 1.8MB → 520KB)

**Bottlenecks (at scale):**
- ⚠️ **Database connections** (60 max on free tier → exhausted under load)
- ⚠️ **No caching layer** (every request hits database)
- ⚠️ **No CDN for user content** (images/PDFs served from Supabase Storage)
- ⚠️ **PDF generation on client** (slow on mobile, blocks UI)

**Recommendation:** Implement **Phase 1** before **high-traffic launch**, **Phase 2** within 1-3 months

---

## CURRENT ARCHITECTURE

### Frontend
- **Hosting:** Vercel (serverless, global CDN)
- **Capacity:** Unlimited (scales automatically)
- **Latency:** <100ms (edge caching)
- **Bottleneck:** NONE ✅

### Backend (Supabase)
- **Database:** PostgreSQL (shared instance)
- **Connections:** 60 max (free tier), 200+ (pro tier)
- **Edge Functions:** Deno Deploy (auto-scaling)
- **Storage:** Supabase Storage (no CDN)
- **Bottleneck:** Database connections ⚠️

### API Layer
- **Edge Functions:** 14 functions (Deno Deploy)
- **Capacity:** Auto-scales to demand
- **Rate Limiting:** ✅ Implemented (per user)
- **Bottleneck:** NONE ✅

---

## SCALABILITY BOTTLENECKS

### 1. 🔴 CRITICAL: Database Connection Exhaustion

**Problem:**
Supabase Free tier: **60 max connections**
- Each frontend user = 1-2 persistent connections
- Each Edge Function call = 1 temporary connection
- **At 50-60 concurrent users:** Connection pool exhausted!

**Symptoms:**
```
Error: remaining connection slots are reserved for non-replication superuser connections
```

**Current Mitigation:**
- ✅ PgBouncer (connection pooling) - helps, but not enough
- ✅ Connection timeout (5 minutes) - recycles idle connections

**Impact:**
- **Current:** Affects app at ~50 concurrent users
- **With Pro tier ($25/mo):** Supports ~150 concurrent users
- **With dedicated instance:** Supports 500-1000+ users

**Solutions:**

#### Option A: Upgrade Supabase Tier ⭐ IMMEDIATE
**Cost:** $25/month (Pro tier)
**Benefit:** 200 connections (3.3x increase)
**Effort:** 5 minutes (upgrade in dashboard)
**Supports:** ~150 concurrent users

#### Option B: Dedicated Supabase Instance
**Cost:** $599/month (Team tier)
**Benefit:** Dedicated CPU/RAM, 400+ connections
**Effort:** 1 hour (migration)
**Supports:** 500-1000 concurrent users

#### Option C: Self-hosted PostgreSQL + Connection Pooler
**Cost:** $50-100/month (VPS + managed Postgres)
**Benefit:** Full control, unlimited connections
**Effort:** 1-2 weeks (migration + testing)
**Supports:** 1000-5000+ users

**Recommendation:** **Option A** for launch, **Option B** at 100+ active daily users

---

### 2. 🟠 HIGH: No Caching Layer

**Problem:**
Every database query hits PostgreSQL directly:
- User profile: Fetched on every page load
- Templates: Queried every time
- Organization settings: Refetched unnecessarily

**Impact:**
- **Slow response times** (100-300ms per query)
- **High database load** (reduces capacity)
- **Poor user experience** (loading spinners everywhere)

**Measurement:**
```sql
-- Check query frequency
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%profiles%'
ORDER BY calls DESC;
```

**Solutions:**

#### Option A: Redis Cache (Upstash) ⭐ RECOMMENDED
**Service:** Upstash Redis (serverless, pay-per-request)
**Cost:** $0-20/month (free tier: 10K requests/day)
**Latency:** <10ms (vs. 100-300ms database)

**Implementation:**
```typescript
// _shared/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return cached as T;

  // Cache miss - fetch from database
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

// Usage in Edge Function
const profile = await getCached(
  `profile:${userId}`,
  () => supabase.from('profiles').select('*').eq('id', userId).single(),
  300 // Cache for 5 minutes
);
```

**What to Cache:**
- ✅ User profiles (5 min TTL)
- ✅ Organization settings (10 min TTL)
- ✅ Item templates (30 min TTL)
- ✅ API rate limit counters (1 min TTL)
- ❌ Projects/quotes (too dynamic - don't cache)

**Benefits:**
- 🚀 **10x faster queries** (10ms vs. 100-300ms)
- 💾 **90% fewer database queries** (for cached data)
- 💰 **Reduced database load** (extends capacity)

**Effort:** 1-2 days (implementation + testing)

#### Option B: TanStack Query Client Cache (Frontend)
**Already Implemented!** ✅
```typescript
// App.tsx
staleTime: 1000 * 60 * 5, // 5 minutes
gcTime: 1000 * 60 * 30, // 30 minutes
```

**This helps, but:**
- ⚠️ Each user has their own cache (no shared benefit)
- ⚠️ Cache lost on page refresh
- ⚠️ Doesn't reduce database load

**Verdict:** Good for UX, NOT enough for scalability

---

### 3. 🟡 MEDIUM: No CDN for User-Generated Content

**Problem:**
User-uploaded images/PDFs served directly from Supabase Storage:
- **Latency:** 200-500ms (not edge-cached)
- **Bandwidth costs:** High for large files
- **No image optimization** (serving full-res images)

**Current Flow:**
```
User → Vercel (Poland) → Supabase (US-East) → Storage → User
         ↑ CDN cached      ↑ NOT cached
```

**Impact:**
- Slow image loading (especially outside US/EU)
- High bandwidth costs at scale
- Poor mobile experience (large images)

**Solutions:**

#### Option A: Supabase CDN (Built-in) ⭐ EASIEST
**Cost:** Included in Pro tier ($25/mo)
**Setup:** Enable in Supabase Dashboard → Storage → Enable CDN
**Benefit:** Edge-cached images (50-100ms latency)

**Limitations:**
- No image resizing/optimization
- No WebP conversion
- Basic caching only

**Effort:** 5 minutes

#### Option B: Cloudflare R2 + Image Resizing
**Cost:** $0.015/GB storage + $0.36/million requests
**Setup:** Migrate Supabase Storage → Cloudflare R2
**Benefits:**
- ✅ Global CDN (Cloudflare Edge)
- ✅ Automatic image resizing (on-the-fly)
- ✅ WebP/AVIF conversion
- ✅ <50ms latency worldwide

**Implementation:**
```typescript
// Upload to Cloudflare R2
const r2Url = `https://images.majster.ai/${projectId}/${photoId}.jpg`;

// Serve optimized version
<img
  src={`${r2Url}/w=800,format=webp`}
  srcset={`
    ${r2Url}/w=400,format=webp 400w,
    ${r2Url}/w=800,format=webp 800w,
    ${r2Url}/w=1200,format=webp 1200w
  `}
  alt="Project photo"
/>
```

**Effort:** 1-2 days (migration + testing)

#### Option C: Vercel Image Optimization (Proxy)
**Cost:** Included in Vercel Pro ($20/mo)
**Setup:** Use `next/image` (requires migrating to Next.js)

**⚠️ Problem:** We're using Vite, not Next.js!
**Verdict:** Not feasible without major migration

**Recommendation:** **Option A** (Supabase CDN) for launch, **Option B** (Cloudflare R2) at scale (1000+ users)

---

### 4. 🟡 MEDIUM: Client-side PDF Generation

**Problem:**
PDF generation (jsPDF) runs in browser:
- **Slow on mobile** (1-3 seconds for complex quotes)
- **Blocks UI** (page freezes during generation)
- **Memory intensive** (can crash on old devices)

**Current Implementation:**
```typescript
// PdfGenerator.tsx (client-side)
const generatePDF = () => {
  const doc = new jsPDF(); // Runs in browser
  // ... 200 lines of PDF generation
  doc.save('offer.pdf'); // Blocks UI
};
```

**Impact:**
- Poor mobile UX
- High client-side memory usage
- No server-side caching of PDFs

**Solutions:**

#### Option A: Move to Edge Function ⭐ RECOMMENDED
**Setup:** New Edge Function `generate-pdf`
**Benefits:**
- ✅ Faster generation (server CPU > mobile CPU)
- ✅ Non-blocking (async generation)
- ✅ Can cache generated PDFs
- ✅ Better mobile experience

**Implementation:**
```typescript
// supabase/functions/generate-pdf/index.ts
import { jsPDF } from 'https://esm.sh/jspdf';

serve(async (req) => {
  const { quoteId } = await req.json();

  // Fetch quote data
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  // Generate PDF (server-side)
  const doc = new jsPDF();
  // ... PDF generation logic

  // Return PDF as blob
  const pdfBlob = doc.output('blob');
  return new Response(pdfBlob, {
    headers: { 'Content-Type': 'application/pdf' }
  });
});
```

**Frontend:**
```typescript
// Call Edge Function (async)
const response = await fetch('/functions/v1/generate-pdf', {
  method: 'POST',
  body: JSON.stringify({ quoteId })
});

const pdfBlob = await response.blob();
const url = URL.createObjectURL(pdfBlob);
window.open(url); // Open in new tab
```

**Effort:** 1 day (migrate logic + test)

#### Option B: Use Puppeteer (HTML → PDF)
**Setup:** Edge Function with Puppeteer/Playwright
**Benefits:**
- ✅ Better PDF quality (uses browser rendering)
- ✅ Support for CSS/images/charts
- ✅ No jsPDF limitations

**Cons:**
- ❌ Requires containerized Edge Function (not Deno Deploy)
- ❌ More complex setup
- ❌ Higher memory usage

**Effort:** 2-3 days

**Recommendation:** **Option A** (move jsPDF to Edge Function) - simplest and works

---

## COST ANALYSIS

### Current (Launch)
- Vercel: **$0/mo** (Hobby tier, free)
- Supabase: **$0/mo** (Free tier)
- **Total:** **$0/mo** (supports ~50 users)

### Phase 1: Small Scale (100-500 users)
- Vercel: **$20/mo** (Pro tier)
- Supabase: **$25/mo** (Pro tier - 200 connections)
- Upstash Redis: **$10/mo** (caching)
- **Total:** **$55/mo**

### Phase 2: Medium Scale (500-2000 users)
- Vercel: **$20/mo** (Pro tier)
- Supabase: **$599/mo** (Team tier - dedicated instance)
- Upstash Redis: **$20/mo** (more requests)
- Cloudflare R2: **$10/mo** (image storage/CDN)
- **Total:** **$649/mo**

### Phase 3: Large Scale (2000-10000 users)
- Vercel: **$20/mo** (Pro tier)
- Supabase: **$599/mo** (Team tier)
- Upstash Redis: **$40/mo** (high traffic)
- Cloudflare R2: **$30/mo** (more storage)
- Read Replicas: **$299/mo** (2x replica for read scaling)
- **Total:** **$988/mo**

---

## MONITORING & OBSERVABILITY

### What to Monitor:

#### 1. Database Metrics (Supabase Dashboard)
- **Active connections** (target: <80% of max)
- **Query execution time** (target: <100ms p95)
- **Connection queue length** (target: 0)
- **Cache hit rate** (target: >80% with Redis)

#### 2. API Metrics (Vercel Analytics)
- **Response time** (target: <500ms p95)
- **Error rate** (target: <1%)
- **Throughput** (requests/minute)

#### 3. Edge Function Metrics
- **Invocations per minute**
- **Cold starts** (target: <10%)
- **Error rate** (target: <1%)

#### 4. User Experience (Sentry + Web Vitals)
- **LCP** (Largest Contentful Paint) - target: <2.5s
- **INP** (Interaction to Next Paint) - target: <200ms
- **CLS** (Cumulative Layout Shift) - target: <0.1

### Alerting:
```yaml
# Example alert rules
- Database connections > 80%: EMAIL + Slack
- API error rate > 5%: PagerDuty (immediate)
- Response time > 1s (p95): EMAIL (daily digest)
```

---

## SCALABILITY ROADMAP

### 🚀 PHASE 0: Launch (Current) - 0-50 users
**Status:** ✅ READY
**Infrastructure:**
- Vercel Free
- Supabase Free
- No caching

**Cost:** $0/mo
**Capacity:** ~50 concurrent users

---

### 🎯 PHASE 1: Growth (3-6 months) - 50-500 users
**Priority:** P1 (Implement before high-traffic marketing)
**Timeline:** 1 week implementation

**Upgrades:**
1. ✅ **Supabase Pro** ($25/mo) - 200 connections
2. ✅ **Vercel Pro** ($20/mo) - better analytics
3. ✅ **Upstash Redis** ($10/mo) - caching layer
4. ✅ **Supabase Storage CDN** (free with Pro) - faster images

**Implementation:**
```bash
# Week 1: Infrastructure
Day 1: Upgrade Supabase + Vercel (5 min)
Day 2-3: Implement Redis caching (8-16 hours)
Day 4: Enable Supabase CDN (5 min)
Day 5: Load testing (4-8 hours)
```

**Cost:** $55/mo
**Capacity:** ~300 concurrent users (6x increase)

---

### 📈 PHASE 2: Scale (6-12 months) - 500-2000 users
**Priority:** P2 (Implement when hitting capacity limits)
**Timeline:** 2-3 weeks implementation

**Upgrades:**
1. ✅ **Supabase Team** ($599/mo) - dedicated instance
2. ✅ **Cloudflare R2** ($10-30/mo) - image CDN + optimization
3. ✅ **Move PDF to Edge Function** - faster generation
4. ✅ **Database read replicas** (optional) - scale reads

**Cost:** $649/mo
**Capacity:** ~1500 concurrent users (30x launch capacity)

---

### 🚀 PHASE 3: Enterprise (12+ months) - 2000-10000 users
**Priority:** P3 (Future planning)
**Timeline:** 1-2 months implementation

**Upgrades:**
1. ✅ **Multiple Supabase read replicas** - scale database reads
2. ✅ **Dedicated Redis cluster** - more caching capacity
3. ✅ **Global CDN for API** (Cloudflare Workers) - <50ms worldwide
4. ✅ **Horizontal Edge Function scaling** - handle more API load

**Cost:** $988/mo
**Capacity:** ~8000 concurrent users (160x launch capacity)

---

## LOAD TESTING

### Recommended Tools:
- **k6** (https://k6.io) - Open-source load testing
- **Artillery** (https://artillery.io) - Node.js load testing
- **Locust** (https://locust.io) - Python load testing

### Test Scenarios:

#### Scenario 1: Typical User Session
```javascript
// k6 script
import http from 'k6/http';

export default function() {
  // 1. Login
  const loginRes = http.post('/api/auth/login', {
    email: 'test@example.com',
    password: 'test123'
  });

  // 2. View dashboard (cached)
  http.get('/dashboard');

  // 3. List projects
  http.get('/api/projects');

  // 4. View project detail
  http.get('/api/projects/123');

  // 5. Generate quote
  http.post('/api/quotes', { projectId: 123 });
}
```

#### Scenario 2: Stress Test
```javascript
// k6 stress test
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 for 5 minutes
    { duration: '2m', target: 100 },  // Ramp to 100
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 200 },  // Ramp to 200
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
};
```

#### Success Criteria:
- ✅ Response time: <500ms (p95)
- ✅ Error rate: <1%
- ✅ No database connection errors
- ✅ No memory leaks

---

## REALISTIC ASSESSMENT (No BS)

### What's Actually Good:
- ✅ **Serverless architecture scales automatically** (Vercel + Edge Functions)
- ✅ **CDN-backed frontend** (Vercel) - handles unlimited traffic
- ✅ **Modern stack** (React, PostgreSQL, serverless) - industry standard
- ✅ **Bundle optimization done** (Phase 2) - fast initial load

### What Needs Work:
- ⚠️ **Database connections will hit limit at ~50 users** (Supabase free tier)
- ⚠️ **No caching = slow + expensive** (100-300ms per query)
- ⚠️ **User images not CDN-backed** (Supabase Storage direct)
- ⚠️ **PDF generation on client** (slow on mobile)

### Real Talk:

**For launch (next week):** ✅ **You're fine!**
- Current infrastructure supports 50-100 early users
- No scalability work needed for launch

**For growth (3-6 months):** ⚠️ **Implement Phase 1**
- $55/mo investment gets you to 300+ users
- 1 week of work (mostly Redis caching)
- **MUST DO** before running ads/marketing

**For scale (6-12 months):** 📈 **Implement Phase 2**
- $649/mo supports 1500+ users
- 2-3 weeks of work
- Do this when you hit 300+ active daily users

**Bottom line:**
- **DON'T over-engineer now** - current setup is fine for launch
- **DO plan ahead** - know what to upgrade and when
- **DO monitor** - set up alerts for connection exhaustion

---

## RECOMMENDATIONS

### For Launch (This Week): ✅ DO NOTHING
**Current infrastructure is sufficient for 50-100 users.**

Deploy and learn!

### For Post-Launch (Month 1-2): ⭐ DO THIS
1. **Monitor database connections** (Supabase dashboard)
2. **Set up alerts** (email when connections > 80%)
3. **Track user growth** (when approaching 50 daily active users, upgrade!)

### For Growth (Month 3-6): 🚀 IMPLEMENT PHASE 1
1. **Upgrade Supabase Pro** ($25/mo) - 5 minutes
2. **Implement Redis caching** - 1-2 days
3. **Enable Supabase CDN** - 5 minutes
4. **Load test** - 1 day

**Total effort:** 1 week
**Total cost:** $55/mo
**Capacity:** 6x increase (300+ users)

### For Scale (Month 6-12): 📈 IMPLEMENT PHASE 2
When you hit 300+ daily active users, revisit this document!

---

**Document Created:** 2025-12-12
**Next Review:** Month 3 post-launch (or when hitting 40+ daily active users)
**Owner:** CTO + DevOps

**END OF SCALABILITY ANALYSIS**
