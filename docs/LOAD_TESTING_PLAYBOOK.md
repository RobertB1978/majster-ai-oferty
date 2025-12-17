# Load Testing Playbook

**TIER 2.2 - Performance Under Load**

**Manifest compliance:**
- ✅ Fail fast (find limits before users do)
- ✅ Reproduce, don't guess (repeatable tests)
- ✅ Playbook = komenda + expected output

---

## Why Load Testing Matters

**Business Risk Without Load Testing:**
- App crashes during product launch
- Database locks during peak hours
- Slow response times lose customers
- No capacity planning (overpay or crash)

**Goals:**
1. Find breaking points (max users before failure)
2. Identify bottlenecks (slow queries, rate limits)
3. Validate performance targets
4. Plan infrastructure scaling

---

## Load Testing Strategy

### Test Types

**1. Smoke Test (Sanity Check)**
- **Duration:** 1-2 minutes
- **Users:** 1-10
- **Purpose:** Verify test script works
- **Frequency:** Every test run

**2. Load Test (Normal Traffic)**
- **Duration:** 10-30 minutes
- **Users:** Expected peak load
- **Purpose:** Verify performance under normal conditions
- **Frequency:** Weekly

**3. Stress Test (Find Limits)**
- **Duration:** 10-30 minutes
- **Users:** Gradually increase until failure
- **Purpose:** Find breaking point
- **Frequency:** Monthly

**4. Spike Test (Sudden Traffic)**
- **Duration:** 5-10 minutes
- **Users:** Sudden jump from 0 to peak
- **Purpose:** Test autoscaling, caching
- **Frequency:** Before major launches

**5. Soak Test (Endurance)**
- **Duration:** 1-24 hours
- **Users:** Normal load
- **Purpose:** Find memory leaks, slow degradation
- **Frequency:** Quarterly

---

## Tool: k6 (Recommended)

**Why k6:**
- JavaScript-like scripting
- Built-in metrics
- Free and open source
- CLI and cloud options
- Excellent for API testing

**Installation:**
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6

# Or via npm (slower)
npm install -g k6
```

**Verify Installation:**
```bash
k6 version
```

Expected: `k6 v0.48.0` or higher

---

## Load Test Scripts

### Script 1: Smoke Test (Basic Health Check)

Create: `load-tests/smoke-test.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, // 1 virtual user
  duration: '1m', // 1 minute
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests can fail
  },
};

export default function () {
  // Test: Homepage loads
  const homeRes = http.get('https://your-app.vercel.app');
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test: Login page loads
  const loginRes = http.get('https://your-app.vercel.app/login');
  check(loginRes, {
    'login page status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Run:**
```bash
k6 run load-tests/smoke-test.js
```

**Expected Output:**
```
     ✓ homepage status is 200
     ✓ homepage loads fast
     ✓ login page status is 200

     checks.........................: 100.00% ✓ 180 ✗ 0
     data_received..................: 2.4 MB  40 kB/s
     data_sent......................: 18 kB   300 B/s
     http_req_blocked...............: avg=1.2ms    min=0s      med=0s       max=22ms
     http_req_connecting............: avg=0.8ms    min=0s      med=0s       max=15ms
     http_req_duration..............: avg=245ms    min=180ms   med=230ms    max=450ms
       { expected_response:true }...: avg=245ms    min=180ms   med=230ms    max=450ms
     http_req_failed................: 0.00%   ✓ 0   ✗ 180
     http_req_receiving.............: avg=12ms     min=8ms     med=11ms     max=28ms
     http_req_sending...............: avg=0.1ms    min=0ms     med=0.1ms    max=0.5ms
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s
     http_req_waiting...............: avg=233ms    min=170ms   med=220ms    max=440ms
     http_reqs......................: 180     3/s
     iteration_duration.............: avg=2.2s     min=2.1s    med=2.2s     max=2.5s
     iterations.....................: 60      1/s
     vus............................: 1       min=1 max=1
     vus_max........................: 1       min=1 max=1
```

**✅ Success Criteria:**
- All checks pass (100%)
- http_req_failed < 1%
- http_req_duration p(95) < 500ms

---

### Script 2: Load Test (Normal Traffic)

Create: `load-tests/load-test.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users over 2 min
    { duration: '5m', target: 10 },  // Stay at 10 users for 5 min
    { duration: '2m', target: 50 },  // Ramp up to 50 users over 2 min
    { duration: '5m', target: 50 },  // Stay at 50 users for 5 min
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'], // Less than 5% failure rate
  },
};

const BASE_URL = 'https://your-app.vercel.app';

export default function () {
  // Simulate real user flow

  // 1. Load homepage
  let res = http.get(BASE_URL);
  check(res, { 'homepage loaded': (r) => r.status === 200 });
  sleep(Math.random() * 3 + 2); // Random sleep 2-5s

  // 2. Visit login page
  res = http.get(`${BASE_URL}/login`);
  check(res, { 'login page loaded': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);

  // 3. Login (with test credentials)
  res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'LoadTest123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'login successful': (r) => r.status === 200 || r.status === 302,
  });

  const authToken = res.cookies.session?.[0]?.value || '';
  sleep(1);

  // 4. View projects (authenticated)
  res = http.get(`${BASE_URL}/projects`, {
    headers: { 'Cookie': `session=${authToken}` },
  });
  check(res, { 'projects loaded': (r) => r.status === 200 });
  sleep(Math.random() * 5 + 3);

  // 5. Create new project (via API)
  res = http.post(`${BASE_URL}/api/projects`, JSON.stringify({
    project_name: `Load Test Project ${Date.now()}`,
    client_id: 'test-client-id',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=${authToken}`,
    },
  });
  check(res, {
    'project created': (r) => r.status === 201 || r.status === 200,
  });

  sleep(Math.random() * 3 + 2);
}
```

**Run:**
```bash
k6 run load-tests/load-test.js
```

**Expected Metrics:**
```
     checks.........................: 95%+  (some failures acceptable)
     http_req_duration..............: p(95) < 800ms, p(99) < 2000ms
     http_req_failed................: < 5%
     http_reqs......................: 1000+ requests
```

---

### Script 3: Stress Test (Find Breaking Point)

Create: `load-tests/stress-test.js`
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp to 50 users
    { duration: '2m', target: 100 },  // Ramp to 100 users
    { duration: '2m', target: 200 },  // Ramp to 200 users
    { duration: '2m', target: 300 },  // Ramp to 300 users (likely to break)
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

const BASE_URL = 'https://your-app.vercel.app';

export default function () {
  const res = http.get(BASE_URL);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
}
```

**Run:**
```bash
k6 run load-tests/stress-test.js
```

**What to Watch:**
- At what user count do errors start? (e.g., 200 users)
- What's the error type? (500s, timeouts, rate limits)
- Does the app recover after load decreases?

---

## Edge Function Load Testing

### Test Supabase Edge Functions

Create: `load-tests/edge-function-test.js`
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // AI functions can be slow
    http_req_failed: ['rate<0.1'], // 10% failure acceptable (rate limiting)
  },
};

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const ANON_KEY = 'YOUR_ANON_KEY';

export default function () {
  // Test AI quote suggestions
  const res = http.post(
    `${SUPABASE_URL}/functions/v1/ai-quote-suggestions`,
    JSON.stringify({
      description: 'Paint 2 bedroom apartment',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    }
  );

  check(res, {
    'AI function responded': (r) => r.status === 200 || r.status === 429, // 429 = rate limited (OK)
    'response has data': (r) => r.body.length > 0,
  });
}
```

**Expected:**
- Some 429 responses (rate limiting working) ✅
- p(95) < 3000ms (AI is slow, but acceptable)
- No 500 errors

---

## Database Load Testing

### Test Database Connections

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const ANON_KEY = 'YOUR_ANON_KEY';

export default function () {
  // Fetch projects (hits database)
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/projects?select=*&limit=10`,
    {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    }
  );

  check(res, {
    'database query successful': (r) => r.status === 200,
    'query fast': (r) => r.timings.duration < 500,
  });
}
```

**What to Watch:**
- Connection pool exhaustion (errors after N users)
- Query slowdown under load
- Database CPU/RAM spikes (check Supabase dashboard)

---

## Performance Targets

### Response Time Targets

| Endpoint | p(50) | p(95) | p(99) | Max Acceptable |
|----------|-------|-------|-------|----------------|
| Static pages (HTML) | 200ms | 500ms | 1000ms | 2000ms |
| API (simple GET) | 100ms | 300ms | 600ms | 1000ms |
| API (complex query) | 500ms | 1000ms | 2000ms | 5000ms |
| AI endpoints | 2000ms | 5000ms | 10000ms | 15000ms |

### Throughput Targets

| Metric | Free Tier | Pro Tier | Target |
|--------|-----------|----------|--------|
| Concurrent users | 10-50 | 100-500 | 50+ |
| Requests/second | 10 | 100 | 20+ |
| Database connections | 10 | 50 | 20+ |

### Error Rate Targets

| Error Type | Acceptable | Warning | Critical |
|------------|------------|---------|----------|
| HTTP 5xx | < 0.1% | 0.1-1% | > 1% |
| HTTP 429 (rate limit) | < 5% | 5-10% | > 10% |
| Timeouts | < 1% | 1-5% | > 5% |

---

## Interpreting Results

### ✅ Good Performance
```
checks.........................: 100.00%
http_req_duration..............: avg=250ms p(95)=500ms p(99)=800ms
http_req_failed................: 0.00%
```
**Action:** App is ready for production ✅

### ⚠️ Acceptable Performance
```
checks.........................: 98.00%
http_req_duration..............: avg=400ms p(95)=900ms p(99)=1500ms
http_req_failed................: 2.00%
```
**Action:** Monitor in production, optimize later

### 🚨 Poor Performance
```
checks.........................: 85.00%
http_req_duration..............: avg=1200ms p(95)=3000ms p(99)=8000ms
http_req_failed................: 15.00%
```
**Action:** CRITICAL - Fix before launch!

**Common issues:**
- Slow database queries → Add indexes
- Rate limiting too strict → Increase limits
- Memory leaks → Fix code
- Connection pool exhausted → Increase pool size

---

## CI/CD Integration

### GitHub Actions

Create: `.github/workflows/load-test.yml`
```yaml
name: Weekly Load Test

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run smoke test
        run: k6 run load-tests/smoke-test.js

      - name: Run load test
        run: k6 run load-tests/load-test.js

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: '*.json'
```

---

## Pre-Production Checklist

**Before Going Live:**
- [ ] Smoke test passes
- [ ] Load test with expected peak traffic passes
- [ ] Stress test identifies breaking point (> 2x expected traffic)
- [ ] Database handles load without errors
- [ ] Rate limiting works (429s returned, not crashes)
- [ ] Error rate < 1% under normal load
- [ ] p(95) response time meets targets
- [ ] App recovers after load spike

---

## Success Criteria

**TIER 2.2 Complete When:**
- ✅ Load test scripts created (smoke, load, stress)
- ✅ Tests run successfully against production
- ✅ Performance baselines documented
- ✅ Breaking points identified
- ✅ No critical performance issues found
- ✅ CI/CD integration (optional but recommended)

---

**Last Updated:** 2025-12-17
**Owned By:** Platform / DevOps
**Test Frequency:** Weekly (smoke), Monthly (load/stress)
