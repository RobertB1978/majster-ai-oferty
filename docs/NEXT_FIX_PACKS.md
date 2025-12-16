# NEXT FIX PACKS - Sequential PR Plan
# Majster.AI - Conformance Remediation

**Based on:** CONFORMANCE_MATRIX.md (2024-12-16)
**Strategy:** One PR at a time, merge-gated, evidence-based
**Timeline:** 6 weeks to reach Grade A- (90/100)

---

## EXECUTION RULES

### Non-Negotiable Constraints

1. **Sequential execution only** - Do NOT start PR-(n+1) until PR-(n) is merged
2. **Evidence-driven** - Each PR must include:
   - Summary of changes
   - Rationale (why this change)
   - Risk assessment
   - Rollback plan
   - Evidence (test output, CI logs, screenshots)
3. **Merge gates** - All PRs must pass:
   - CI/CD pipeline (lint, type-check, tests, build)
   - Code review by owner
   - No merge without approval
4. **No direct commits to main** - ALL changes via PR
5. **If blocked** - Ask minimal question, wait for answer, do NOT guess

---

## PR-1: QUALITY GATES & TESTING BASELINE
**Priority:** P0 - CRITICAL (Blocking)
**Timeline:** Week 1-2 (10-15 hours)
**Grade Impact:** 50% → 75% (+25 points)

### Objective
Implement merge gates and CI quality baseline to prevent future regressions.

### Requirements

#### 1.1 GitHub Actions CI/CD Enhancements
**Files:**
- `.github/workflows/ci.yml` (existing, to be enhanced)

**Changes:**
```yaml
# Add to existing ci.yml:

# New Job: Database & RLS Tests
db-test:
  name: Database & RLS Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with:
        version: latest
    - name: Start Supabase (local only)
      run: npx supabase start
    - name: Run RLS policy tests
      run: npx supabase test db
    - name: Stop Supabase
      run: npx supabase stop --no-backup

# New Job: CodeQL Security Scanning
codeql:
  name: CodeQL Security Analysis
  runs-on: ubuntu-latest
  permissions:
    actions: read
    contents: read
    security-events: write
  steps:
    - uses: actions/checkout@v4
    - uses: github/codeql-action/init@v3
      with:
        languages: javascript, typescript
    - uses: github/codeql-action/autobuild@v3
    - uses: github/codeql-action/analyze@v3

# Enhanced: Prebuild ENV Check
- name: Check critical environment variables
  run: |
    node -e "
      const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
      const missing = required.filter(k => !process.env[k]);
      if (missing.length) {
        console.error('Missing ENV vars:', missing.join(', '));
        process.exit(1);
      }
    "
```

**Evidence Required:**
- CI workflow runs successfully on PR
- All 5 jobs pass (lint, test, build, db-test, codeql)
- Screenshot of GitHub Actions passing

---

#### 1.2 Testing Infrastructure
**Files:**
- `src/test/setup.ts` (new)
- `src/test/mocks/supabase.ts` (new)
- `src/test/utils.tsx` (new)

**Setup File (`src/test/setup.ts`):**
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**Supabase Mock (`src/test/mocks/supabase.ts`):**
```typescript
import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
    })),
  },
};

// Export factory
export const createMockSupabaseClient = () => mockSupabaseClient;
```

**Test Utils (`src/test/utils.tsx`):**
```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export testing library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
```

**Evidence Required:**
- Files created
- `npm test` runs without errors
- Setup utilities work

---

#### 1.3 Unit Tests for Critical Hooks
**Files:**
- `src/hooks/__tests__/useProjects.test.ts` (new)
- `src/hooks/__tests__/useClients.test.ts` (new)
- `src/hooks/__tests__/useDashboardStats.test.ts` (new)

**Example Test (`src/hooks/__tests__/useProjects.test.ts`):**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from '../useProjects';
import { mockSupabaseClient } from '../../test/mocks/supabase';

// Mock Supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProjects', () => {
  it('fetches projects successfully', async () => {
    const mockProjects = [
      { id: '1', project_name: 'Test Project', user_id: 'user1' },
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockProjects,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useProjects('user1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProjects);
  });

  it('handles errors gracefully', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' },
        }),
      }),
    });

    const { result } = renderHook(() => useProjects('user1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

**Target Coverage:**
- `useProjects` - 80%+
- `useClients` - 80%+
- `useDashboardStats` - 70%+

**Evidence Required:**
- Tests pass (`npm test`)
- Coverage report shows 30%+ overall (from <5%)
- Screenshot of coverage summary

---

#### 1.4 RLS Policy Test Harness
**Files:**
- `supabase/tests/rls_policies.test.sql` (new)

**Example RLS Test:**
```sql
-- Test: Users can only see their own projects
BEGIN;
  -- Setup
  SELECT plan(3);

  -- Create test users
  INSERT INTO auth.users (id, email) VALUES
    ('user1', 'user1@test.com'),
    ('user2', 'user2@test.com');

  -- Create test projects
  INSERT INTO projects (id, project_name, user_id) VALUES
    ('proj1', 'User1 Project', 'user1'),
    ('proj2', 'User2 Project', 'user2');

  -- Test 1: User1 sees only their project
  SET LOCAL role = 'authenticated';
  SET LOCAL request.jwt.claim.sub = 'user1';
  SELECT results_eq(
    'SELECT id FROM projects WHERE user_id = current_setting(''request.jwt.claim.sub'')::uuid',
    ARRAY['proj1'::uuid],
    'User1 should see only their own project'
  );

  -- Test 2: User1 cannot see User2's project
  SELECT is_empty(
    'SELECT id FROM projects WHERE user_id = ''user2''::uuid',
    'User1 should not see User2''s project'
  );

  -- Test 3: Anonymous users see nothing
  SET LOCAL role = 'anon';
  SELECT is_empty(
    'SELECT id FROM projects',
    'Anonymous users should see no projects'
  );

  SELECT * FROM finish();
ROLLBACK;
```

**Test Coverage:**
- Projects table RLS
- Clients table RLS
- Quotes/Offers table RLS
- Finance tables RLS

**Evidence Required:**
- `npx supabase test db` passes
- All RLS policies tested
- Output log showing PASS

---

#### 1.5 Enable Sentry Error Tracking
**Files:**
- `src/main.tsx` (modify)
- `.env.example` (already has VITE_SENTRY_DSN)

**Changes to `src/main.tsx`:**
```typescript
import * as Sentry from "@sentry/react";

// Initialize Sentry (already in code, ensure it's ENABLED)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
}
```

**Vercel Environment Variable:**
```bash
# Add in Vercel Dashboard → Settings → Environment Variables
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=majster-ai
```

**Evidence Required:**
- Sentry project shows events
- Screenshot of Sentry dashboard with test error
- Error boundaries report to Sentry

---

### Deliverables for PR-1

1. **Modified Files:**
   - `.github/workflows/ci.yml` (enhanced)
   - `src/main.tsx` (Sentry enabled)
   - `vitest.config.ts` (test setup)

2. **New Files:**
   - `src/test/setup.ts`
   - `src/test/mocks/supabase.ts`
   - `src/test/utils.tsx`
   - `src/hooks/__tests__/useProjects.test.ts`
   - `src/hooks/__tests__/useClients.test.ts`
   - `src/hooks/__tests__/useDashboardStats.test.ts`
   - `supabase/tests/rls_policies.test.sql`

3. **Documentation:**
   - Update `CLAUDE.md` with testing instructions
   - Update `README.md` with "How to run tests"

4. **Evidence Package:**
   - CI passing (screenshot)
   - Test coverage report (30%+)
   - RLS tests passing
   - Sentry receiving events

### Rollback Plan
If PR-1 breaks production:
1. Revert merge commit: `git revert -m 1 <merge-commit-sha>`
2. Deploy main branch
3. Investigate broken tests
4. Fix and resubmit PR-1

### Success Criteria
- ✅ All CI jobs pass
- ✅ Test coverage ≥30% (up from <5%)
- ✅ RLS tests pass
- ✅ Sentry receives test events
- ✅ No breaking changes to existing functionality

---

## PR-2: SECURITY & COMPLIANCE
**Priority:** P0/P1 - HIGH
**Timeline:** Week 3-4 (12-18 hours)
**Grade Impact:** 75% → 85% (+10 points)

### Objective
Close critical security gaps and achieve WCAG 2.2 Level AA accessibility.

### Requirements

#### 2.1 Server-Side Validation in Edge Functions
**Files:**
- `supabase/functions/_shared/validation.ts` (new)
- `supabase/functions/ai-quote-suggestions/index.ts` (modify)
- `supabase/functions/send-offer-email/index.ts` (modify)
- `supabase/functions/approve-offer/index.ts` (modify)
- All other Edge Functions (modify)

**Shared Validation Library (`supabase/functions/_shared/validation.ts`):**
```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Common schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();

// Offer schemas
export const createOfferSchema = z.object({
  project_id: uuidSchema,
  client_id: uuidSchema,
  items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    unit: z.string().min(1).max(50),
  })),
  notes: z.string().max(5000).optional(),
});

// Email schemas
export const sendEmailSchema = z.object({
  offer_id: uuidSchema,
  recipient_email: emailSchema,
  subject: z.string().min(1).max(200),
  message: z.string().max(10000).optional(),
});

// Validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Invalid request data' };
  }
}
```

**Usage in Edge Function:**
```typescript
// supabase/functions/send-offer-email/index.ts
import { validateRequest, sendEmailSchema } from '../_shared/validation.ts';

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // Validate request
    const validation = validateRequest(sendEmailSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { offer_id, recipient_email, subject, message } = validation.data;

    // Proceed with validated data...
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
});
```

**Edge Functions to Update:**
- ✅ `ai-quote-suggestions`
- ✅ `send-offer-email`
- ✅ `approve-offer`
- ✅ `analyze-photo`
- ✅ `ocr-invoice`
- ✅ `finance-ai-analysis`
- ✅ `ai-chat-agent`
- ✅ `voice-quote-processor`

**Evidence Required:**
- All Edge Functions have validation
- Test cases for invalid input (returns 400)
- Test cases for valid input (returns 200)

---

#### 2.2 Accessibility Improvements
**Files:**
- Multiple component files (add ARIA labels)
- `src/components/ui/*` (ensure accessible)
- `src/App.tsx` (add skip link)
- `src/index.css` (focus styles)

**Skip Link (`src/App.tsx`):**
```tsx
<div className="skip-link-container">
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
</div>

<main id="main-content">
  {/* App content */}
</main>
```

**Focus Styles (`src/index.css`):**
```css
/* Visible focus indicators */
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 2px;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: hsl(var(--primary));
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus {
  top: 0;
}
```

**ARIA Labels for Buttons:**
```tsx
// Before:
<Button onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</Button>

// After:
<Button onClick={handleDelete} aria-label="Delete client">
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

**Loading/Error Announcements:**
```tsx
// Loading state
{isLoading && (
  <div role="status" aria-live="polite" className="sr-only">
    Loading projects...
  </div>
)}

// Error state
{error && (
  <div role="alert" aria-live="assertive" className="sr-only">
    Error: {error.message}
  </div>
)}
```

**Components to Update (Priority):**
- ✅ All buttons with icons only
- ✅ Loading spinners
- ✅ Error messages
- ✅ Form validation feedback
- ✅ Modal dialogs
- ✅ Navigation menus

**Evidence Required:**
- axe DevTools audit score >90
- Manual keyboard navigation test (all features accessible)
- Screenshot of axe audit results

---

#### 2.3 Performance Monitoring (Web Vitals)
**Files:**
- `src/lib/monitoring.ts` (new)
- `src/main.tsx` (modify)

**Web Vitals Tracking (`src/lib/monitoring.ts`):**
```typescript
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

interface MetricEvent {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

function sendToAnalytics(metric: MetricEvent) {
  // Send to Sentry
  if (window.Sentry) {
    window.Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: metric.rating === 'poor' ? 'warning' : 'info',
      tags: {
        metric_name: metric.name,
        metric_rating: metric.rating,
      },
      extra: {
        value: metric.value,
        delta: metric.delta,
      },
    });
  }

  // Send to console in dev
  if (import.meta.env.DEV) {
    console.log('[Web Vital]', metric.name, metric.value, metric.rating);
  }
}

export function initWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

**Enable in `src/main.tsx`:**
```typescript
import { initWebVitals } from './lib/monitoring';

// After Sentry init
if (import.meta.env.PROD) {
  initWebVitals();
}
```

**Evidence Required:**
- Web Vitals appear in Sentry Performance
- Screenshot of Sentry Performance dashboard
- LCP, INP, CLS metrics tracked

---

#### 2.4 GDPR Account Deletion UI
**Note:** Backend function already exists (`supabase/functions/delete-user-account/`)

**Files:**
- `src/pages/Settings.tsx` (add section)
- `src/components/settings/DeleteAccountDialog.tsx` (new)

**Delete Account Dialog (`src/components/settings/DeleteAccountDialog.tsx`):**
```tsx
import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { user_id: user.id },
      });

      if (error) throw error;

      toast.success('Account deleted successfully');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to delete account');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
        Delete Account
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data (projects, clients, offers, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label htmlFor="confirm-delete" className="text-sm font-medium">
              Type <strong>DELETE</strong> to confirm:
            </label>
            <Input
              id="confirm-delete"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Evidence Required:**
- UI allows account deletion
- Confirmation dialog works
- Backend function called successfully
- User signed out after deletion
- Test account fully removed from DB

---

### Deliverables for PR-2

1. **Modified Files:**
   - All Edge Functions (validation added)
   - Multiple components (ARIA labels)
   - `src/App.tsx` (skip link)
   - `src/index.css` (focus styles)
   - `src/main.tsx` (Web Vitals)
   - `src/pages/Settings.tsx` (delete account UI)

2. **New Files:**
   - `supabase/functions/_shared/validation.ts`
   - `src/lib/monitoring.ts`
   - `src/components/settings/DeleteAccountDialog.tsx`

3. **Documentation:**
   - Update `CLAUDE.md` with validation patterns
   - Update `docs/MONITORING_SECURITY_SETUP.md` with Web Vitals
   - Document GDPR compliance status

4. **Evidence Package:**
   - Edge Function validation tests
   - axe DevTools audit score >90
   - Web Vitals in Sentry
   - Delete account flow tested

### Rollback Plan
If PR-2 breaks production:
1. Revert merge commit
2. Edge Functions revert to previous versions (validation optional)
3. Remove accessibility changes if they break layout
4. Investigate and fix, resubmit

### Success Criteria
- ✅ All Edge Functions validated
- ✅ axe DevTools score ≥90
- ✅ Web Vitals tracked in Sentry
- ✅ Delete account UI functional
- ✅ WCAG 2.2 Level AA compliant (manual test)

---

## PR-3: DEPLOYMENT HARDENING
**Priority:** P2 - MEDIUM
**Timeline:** Week 5-6 (10-15 hours)
**Grade Impact:** 85% → 90% (+5 points)

### Objective
Production-ready infrastructure with E2E tests and deployment safeguards.

### Requirements

#### 3.1 E2E Tests with Playwright
**Files:**
- `playwright.config.ts` (new)
- `tests/e2e/auth.spec.ts` (new)
- `tests/e2e/projects.spec.ts` (new)
- `tests/e2e/quotes.spec.ts` (new)
- `package.json` (add Playwright)

**Install:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Config (`playwright.config.ts`):**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Example Test (`tests/e2e/projects.spec.ts`):**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('user can create a new project', async ({ page }) => {
    await page.click('text=New Project');
    await page.fill('[name="project_name"]', 'Test Project E2E');
    await page.fill('[name="address"]', '123 Test St');
    await page.click('button:has-text("Create")');

    await expect(page.locator('text=Test Project E2E')).toBeVisible();
  });

  test('user can edit project', async ({ page }) => {
    await page.click('text=Test Project E2E');
    await page.click('button:has-text("Edit")');
    await page.fill('[name="project_name"]', 'Updated Project');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Updated Project')).toBeVisible();
  });
});
```

**Critical Flows to Test:**
- ✅ Login → Dashboard → Logout
- ✅ Create Client → Create Project → Generate Quote
- ✅ Generate PDF → Send Email
- ✅ Approve Offer (public link)
- ✅ Error handling (network failures)

**Evidence Required:**
- All E2E tests pass locally
- CI runs E2E tests on PR
- Screenshot of Playwright report

---

#### 3.2 Deployment Verification Checklist
**Files:**
- `docs/RELEASE_CHECKLIST.md` (new)

**Checklist Template:**
```markdown
# Release Checklist - Majster.AI

**Release Date:** _________
**Release Version:** _________
**Deployed by:** _________

## Pre-Deployment

- [ ] All tests pass (unit, integration, E2E)
- [ ] CI/CD pipeline green
- [ ] Code review approved
- [ ] No Sentry errors in staging (if staging exists)
- [ ] Database migrations reviewed
- [ ] Environment variables verified

## Deployment

- [ ] Run `npm run build` locally (ensure no errors)
- [ ] Deploy to production (Vercel auto-deploy or manual)
- [ ] Verify deployment URL loads
- [ ] Check Vercel build logs (no errors)

## Post-Deployment Verification

### Critical Paths
- [ ] Login works
- [ ] Dashboard loads
- [ ] Create project works
- [ ] Generate quote works
- [ ] PDF generation works
- [ ] Email sending works

### Performance
- [ ] Lighthouse score >80
- [ ] Web Vitals green (Sentry dashboard)
- [ ] No console errors in production

### Monitoring
- [ ] Sentry receiving events
- [ ] No error spikes in Sentry
- [ ] Database connections healthy (Supabase dashboard)

## Rollback Plan

If critical issues detected:
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Verify rollback successful
5. Investigate issue, fix, redeploy

## Sign-Off

- [ ] All checks passed
- [ ] Release notes documented
- [ ] Team notified

**Approved by:** _________
**Date:** _________
```

**Evidence Required:**
- Checklist documented
- Used in at least one deployment

---

#### 3.3 Audit Logging
**Files:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_audit_log.sql` (new)

**Migration:**
```sql
-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own audit log
CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert (service role only)
CREATE POLICY audit_log_insert_system ON audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);
CREATE INDEX audit_log_action_idx ON audit_log(action);

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to sensitive tables
CREATE TRIGGER projects_audit
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER clients_audit
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER quotes_audit
  AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

**Admin UI (`src/pages/Admin.tsx`):**
Add audit log viewer section.

**Evidence Required:**
- Migration applied
- Audit log records created on CRUD operations
- Admin can view audit log

---

### Deliverables for PR-3

1. **New Files:**
   - `playwright.config.ts`
   - `tests/e2e/*.spec.ts`
   - `docs/RELEASE_CHECKLIST.md`
   - `supabase/migrations/*_create_audit_log.sql`

2. **Modified Files:**
   - `package.json` (Playwright dependency)
   - `.github/workflows/ci.yml` (add E2E job)
   - `src/pages/Admin.tsx` (audit log viewer)

3. **Documentation:**
   - Update `CLAUDE.md` with release process
   - Document audit log usage

4. **Evidence Package:**
   - E2E tests passing
   - Checklist used in deployment
   - Audit log functional

### Rollback Plan
If PR-3 breaks production:
1. Revert merge commit
2. E2E tests are CI-only, won't affect production
3. Audit log is additive, safe to rollback

### Success Criteria
- ✅ E2E tests pass in CI
- ✅ Release checklist used
- ✅ Audit log recording events
- ✅ No breaking changes

---

## FINAL GRADE PROJECTION

| After PR | Grade | Score | Status |
|----------|-------|-------|--------|
| **Before** | F | 50% | 🔴 Not production-ready |
| **After PR-1** | C | 75% | 🟡 Beta-ready with monitoring |
| **After PR-2** | B+ | 85% | 🟢 Enterprise-ready |
| **After PR-3** | A- | 90% | ✅ **World-class** |

---

## BLOCKING QUESTIONS

Before starting, clarify:

1. **Sentry Account:** Do you have a Sentry account? Need to create one?
2. **Test Database:** Can we use local Supabase for CI testing, or need remote?
3. **Playwright:** OK to add ~200MB of browser binaries to CI?
4. **Breaking Changes:** Any off-limits files/modules?
5. **Timeline:** Is 6 weeks acceptable? Need faster?

**DO NOT START PR-1 UNTIL THESE ARE ANSWERED.**

---

**Prepared by:** Claude Code (Sequential PR Planner)
**Date:** 2024-12-16
**Next Action:** Review with owner, get go/no-go decision
