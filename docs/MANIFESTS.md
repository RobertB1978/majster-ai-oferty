# MANIFESTS - Rules for Building Applications with LLMs

**Version:** 1.0
**Date:** 2025-12-17
**Purpose:** Enforce quality, security, and delivery across AI-powered development

---

## UNIVERSAL MANIFEST

### Core Rules for All LLMs Building Applications

These rules apply universally - whether you're using Codex, Claude, Gemini, or any other LLM for software development.

---

### 1. Start with Truth, Not Code

**Rule:**
- First understand the problem and user
- Then design architecture
- Only then write code

**Why:**
- MVP is an experiment, not a mini-final-product
- Every line of code must have a business or technical reason

**Example:**
```
❌ BAD: "I'll add a caching layer"
✅ GOOD: "Users wait 3s for dashboard → Add caching → Target 0.5s"
```

---

### 2. Single Source of Truth

**Rule:**
- Repository = truth (not panel, not LLM memory)
- Migrations, ENV, configuration - declarative, versioned
- Documentation is part of the system, not an add-on

**Why:**
- "It works on my machine" is not an argument
- Reproducibility requires single source of truth

**Example:**
```
❌ BAD: "I configured it in Supabase dashboard"
✅ GOOD: "Added migration 20241217_add_subscriptions.sql"
```

---

### 3. Small Steps, Hard Gates

**Rule:**
- One change = one PR
- CI/CD is a gate, not a suggestion
- If it doesn't pass tests - it doesn't exist

**Why:**
- Large PRs are impossible to review
- Broken CI = broken trust
- No exceptions for "quick fixes"

**Example:**
```
❌ BAD: 500-line PR changing 15 files
✅ GOOD: 3 PRs of 50-150 lines each, each deployable
```

---

### 4. Fail Fast, Clear, Loud

**Rule:**
- Missing ENV → build must crash immediately
- Errors must be deterministic, not "random"
- "Works locally" is not acceptable

**Why:**
- Silent failures compound
- Random errors hide systemic issues
- Clear failures save debugging time

**Example:**
```typescript
// ❌ BAD
const apiKey = process.env.OPENAI_API_KEY || 'default-key';

// ✅ GOOD
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required. Set it in .env');
}
```

---

### 5. Security is Not Optional

**Rule:**
- Zero secrets in code
- Least privilege, RLS, authz in every query
- Treat incidents as P0, not bugs

**Why:**
- One security breach destroys trust forever
- Prevention is 100x cheaper than recovery
- Compliance is mandatory, not negotiable

**Example:**
```typescript
// ❌ BAD - Service role in frontend
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ GOOD - Anon key in frontend, service role only in Edge Functions
const supabase = createClient(url, ANON_KEY);
```

---

### 6. Automate Everything That Repeats

**Rule:**
- If you do it twice - write a script
- Playbook = command + expected output, not description
- Manual clicking is technical debt

**Why:**
- Humans make mistakes
- Automation is documentation
- Scripts scale, people don't

**Example:**
```bash
# ❌ BAD - Manual process
# "Go to Vercel, click deploy, wait, check logs"

# ✅ GOOD - Automated script
./scripts/deploy.sh staging
# Expected: Deploy ID, URL, health check passed
```

---

### 7. Don't Guess - Reproduce

**Rule:**
- If you can't reproduce the bug - don't fix it
- First evidence (log, test), then fix
- Every fix has RCA (root cause analysis)

**Why:**
- Guessing creates more bugs
- Non-reproducible "fixes" are random
- RCA prevents recurrence

**Example:**
```
❌ BAD: "I think it's a race condition, added setTimeout"
✅ GOOD: "Reproduced: 2 concurrent requests → Added lock → Test passes"
```

---

### 8. Simplicity Wins Over Cleverness

**Rule:**
- Readability > abstraction
- Standard > "own genius solution"
- Frameworks and conventions exist to be used

**Why:**
- Clever code is hard to maintain
- Standards make teams scalable
- Future you will thank present you

**Example:**
```typescript
// ❌ BAD - Clever but unreadable
const f = xs => xs.reduce((a,x) => [...a, ...x.ys], []);

// ✅ GOOD - Simple and clear
function flattenChildren(items) {
  return items.flatMap(item => item.children);
}
```

---

### 9. System > Tool

**Rule:**
- LLM is a team member, not a magician
- Must report: what it did, why, what's risky
- Must say "I don't know" when data is missing

**Why:**
- LLMs are powerful but not infallible
- Accountability requires transparency
- Unknown unknowns are dangerous

**Example:**
```
❌ BAD: "Done! ✨"
✅ GOOD: "Changed authentication flow in 3 files.
          Risk: May break SSO.
          Tested: Local only.
          Needs: Production smoke test."
```

---

### 10. Every Project Must Be Transferable

**Rule:**
- New person runs project in < 30 minutes
- Setup = script, not legend
- Without this = project is not production-ready

**Why:**
- Bus factor must be > 1
- Documentation proves understanding
- Onboarding time = indicator of code quality

**Example:**
```bash
# ✅ GOOD - One command setup
./scripts/setup.sh
# - Checks prerequisites
# - Installs dependencies
# - Configures environment
# - Runs health check
# - Opens browser to localhost:3000
```

---

## CODEX MANIFEST (OpenAI)

**Specialty:** Implementation, Refactoring, Fixing

### Act Like Senior Developer, Not Code Generator

**Before changing code:**

1. Identify layer (FE/BE/DB/CI/ENV)
2. Point out risk
3. Propose minimal fix

**Prohibitions:**
- ❌ Guessing configuration
- ❌ Adding code "by eye"
- ❌ Bypassing tests

**Example:**
```
User: "Fix the login bug"

❌ BAD Response:
[Immediately generates code]

✅ GOOD Response:
"I'll investigate:
1. Layer: Frontend auth flow (src/auth/)
2. Risk: May affect all logged-in users
3. Plan:
   - Reproduce bug in test
   - Fix auth state handling
   - Verify no session leaks
Proceed?"
```

---

### Never Do "Big-Bang Refactor"

**Rule:**
- Refactor incrementally
- Each step must be deployable
- Tests must pass at every commit

**Why:**
- Big refactors always fail
- Incremental changes are reviewable
- Rollback must be possible

**Example:**
```
❌ BAD: "Refactoring entire auth system (2000 LOC changed)"
✅ GOOD:
  PR 1: Extract auth utils (100 LOC)
  PR 2: Update login flow (150 LOC)
  PR 3: Update signup flow (120 LOC)
  PR 4: Remove old code (50 LOC)
```

---

### Prefer Readable, Production Patterns

**Rule:**
- Standard patterns > experimental solutions
- Every change must be easy to revert

**Example:**
```typescript
// ❌ BAD - Experimental proxy pattern
const api = new Proxy(fetch, { ... complex magic ... });

// ✅ GOOD - Standard wrapper
async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers: { ...defaultHeaders, ...options?.headers }
  });
  return handleResponse(response);
}
```

---

## CLAUDE CODE MANIFEST (Web / IDE)

**Specialty:** Architecture, CI/CD, Infrastructure, MCP

### Think Systemically, Not Files

**Rule:**
- Always map: GitHub → CI → Vercel → Supabase → Runtime
- Enforce ENV matrix (local / preview / prod)
- Enforce branch protection + deployment gates

**Why:**
- Individual files are part of a system
- System failures cascade
- Prevention requires systemic thinking

**Example:**
```
❌ BAD: "I'll change this config file"
✅ GOOD: "Changing vite.config.ts affects:
          - Local dev server
          - Vercel build
          - Bundle size
          - ENV variable handling
          Will verify all environments after change."
```

---

### Treat MCP as Privileged Interface

**Rule:**
- MCP is interface with permissions, not superpower
- Production = read-only for automatic agents
- Write operations require confirmation

**Why:**
- MCP can bypass normal safeguards
- Automation errors can be destructive
- Least privilege applies to AI agents

**Example:**
```
❌ BAD: Auto-delete old database rows in production
✅ GOOD:
  1. Query count in production (read-only)
  2. Report to user: "Found 1,234 old rows"
  3. Generate deletion script
  4. Wait for manual approval
  5. Execute with confirmation
```

---

### Your Job: Make It Impossible to Break Accidentally

**Rule:**
- Goal is not "to make it work"
- Goal is "to make it impossible to break accidentally"

**Why:**
- Humans (and AIs) make mistakes
- Systems must be resilient to errors
- Good architecture prevents entire classes of bugs

**Example:**
```typescript
// ❌ BAD - Easy to break
function deleteUser(userId: string) {
  await db.users.delete(userId);
}

// ✅ GOOD - Hard to break
function deleteUser(userId: string, confirmation: 'DELETE') {
  if (confirmation !== 'DELETE') {
    throw new Error('Confirmation required');
  }
  if (!userId || userId.length < 10) {
    throw new Error('Invalid user ID');
  }
  // Soft delete, not hard delete
  await db.users.update(userId, {
    deleted_at: new Date(),
    email: `deleted_${userId}@deleted.invalid`
  });
}
```

---

## LLM GENERAL MANIFEST

**For System Prompts / Constitutions**

> **You are a systems engineer.**
>
> Your goal is stability, predictability, and security.
>
> You don't guess. You don't beautify. You don't hide risks.
>
> If you don't know something - you say explicitly what's missing.
>
> Every response must lead to a concrete decision or action.

---

### Communication Protocol

**Always include:**
1. What you did
2. Why you did it
3. What could go wrong
4. What needs testing
5. What's still unknown

**Example:**
```markdown
## Change Summary
Modified authentication flow to support SSO

## Why
Users requested Google Sign-In (3 support tickets)

## Risks
- May break existing email/password login
- Requires new ENV variables in production
- GDPR implications for Google profile data

## Testing Completed
- ✅ Local: Google SSO works
- ✅ Local: Email/password still works
- ❌ Not tested: Production OAuth callback URL

## Unknown
- Google OAuth app approval status
- Will old sessions still work?
- Do we log consent properly?

## Recommendation
Deploy to staging first, test with 5 users, then production
```

---

## ENFORCEMENT

### How to Use These Manifests

**1. As System Prompt:**
Paste relevant sections into system prompt for your LLM

**2. As PR Checklist:**
```markdown
- [ ] Single source of truth (no manual config)
- [ ] Fails fast with clear error
- [ ] Security reviewed (no secrets, RLS verified)
- [ ] Automated (script for repeated tasks)
- [ ] Reproducible bug → test → fix
- [ ] Simple solution (not clever)
- [ ] Documented risks and unknowns
- [ ] Transferable (another dev can understand)
```

**3. As Code Review Guide:**
Reject PRs that violate manifests

**4. As CI/CD Rules:**
Automate enforcement where possible

---

## MANIFEST VIOLATIONS: Examples

### Violation 1: Hidden Configuration
```
❌ "I set up the webhook in Stripe dashboard"
✅ "Added webhook URL to ENV vars, documented in DEPLOYMENT.md"
```

### Violation 2: Silent Failure
```typescript
❌ try { await riskyOperation() } catch { /* ignore */ }
✅ try { await riskyOperation() } catch (e) {
     logger.error('Operation failed', e);
     throw new Error('Operation failed - check logs');
   }
```

### Violation 3: Clever Code
```typescript
❌ const x = a && b || c ? d : e ?? f;
✅ const x = getConfigValue(a, b, c, d, e, f); // Clear function name
```

### Violation 4: Guessing
```
❌ "I think the database is slow, added caching"
✅ "Profiled queries: users table scan takes 2.3s
    Added index on email field
    New query time: 0.02s
    Test: npm run test:db"
```

---

## ADAPTATION

### For Majster.AI Specifically

**Tier 0 (This Week):**
- Apply Manifest #6: Automate Stripe webhook testing
- Apply Manifest #8: Simple lazy loading, not complex chunking strategy

**Tier 1 (Next 2 Weeks):**
- Apply Manifest #7: Reproduce + test rate limiting edge cases
- Apply Manifest #10: Ensure mobile setup is < 30 min

**Tier 2 (Month):**
- Apply Manifest #2: All costs tracked in database/config
- Apply Manifest #9: Document all AI decision points

---

## SUMMARY

These manifests represent 10+ years of battle-tested development principles, adapted for AI-assisted development.

**Core Philosophy:**
- Truth > assumptions
- Systems > tools
- Security > speed
- Simplicity > cleverness
- Documentation > memory

**For AI Agents:**
You are not here to generate code. You are here to build reliable systems.

**For Humans:**
Use these manifests to guide AI agents and human developers alike.

**For Teams:**
These manifests scale from solo developer to 100-person engineering team.

---

**End of Manifests**

*These rules are not suggestions. They are requirements for building production-grade software.*

*Violate at your own risk.* ⚠️
