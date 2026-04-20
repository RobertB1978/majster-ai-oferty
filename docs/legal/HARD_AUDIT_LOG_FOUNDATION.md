# Hard Compliance Audit Log — Foundation

**PR:** PR-L8  
**Date:** 2026-04-20  
**Status:** IMPLEMENTED  
**Branch:** `claude/audit-log-foundation-bO2PZ`

---

## 1. Problem: Notifications-based Evidence (the old hack)

Before PR-L8, compliance audit events were stored in the `notifications` table
(`src/hooks/useAuditLog.ts`, lines 87–101, pre-PR-L8).

**Why this was wrong:**

| Issue | Detail |
|-------|--------|
| User-deletable | `notifications` RLS allows `DELETE` for `actor_user_id = auth.uid()`. A user could delete their own audit trail. |
| No append-only guarantee | Any authenticated mutation (update, delete) was permitted on own rows. |
| Disguised as UX events | Audit entries were serialised as `title = "Audit: <action>"`, mixed with real UI notifications. |
| JSON smuggling | Structured data was crammed into a free-text `message` column via `JSON.stringify`, bypassing schema validation. |
| Zero operator visibility | Admins had no dedicated query path — they had to query `notifications` with `LIKE 'Audit:%'`. |

**RODO / GDPR impact:** Under GDPR Art. 5(2) (accountability principle), the controller must be able to
_demonstrate_ compliance. A user-deletable audit trail cannot serve as legal evidence.

---

## 2. Solution: `compliance_audit_log` Table

**Migration:** `supabase/migrations/20260420180000_pr_l8_compliance_audit_log.sql`

### Schema

```sql
CREATE TABLE public.compliance_audit_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     text        NOT NULL,
  actor_user_id  uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type    text        NULL,
  entity_id      text        NULL,
  metadata       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  source         text        NOT NULL  -- 'frontend'|'edge_function'|'migration'|'admin'
                               CHECK (source IN ('frontend','edge_function','migration','admin')),
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

### RLS (append-only posture)

| Operation | Policy | Who |
|-----------|--------|-----|
| INSERT | `compliance_audit_log_insert_own` | authenticated users, only for own `actor_user_id` |
| SELECT | `compliance_audit_log_select_own` | authenticated users, only own rows |
| UPDATE | _no policy_ | nobody (immutable) |
| DELETE | _no policy_ | nobody (non-destructible) |
| ALL | Supabase `service_role` bypass | edge functions, admin, operator queries |

**Result:** Once a row is inserted, no user-facing role can modify or remove it.
Only the service_role (used exclusively in Edge Functions and server-side scripts) can bypass RLS,
and only for operational purposes (e.g., DSAR export, breach register reads).

---

## 3. Wiring: What Changed

### `src/lib/auditLog.ts` (new)

Pure helper function `insertComplianceAuditEvent(entry)` that writes to
`compliance_audit_log`. Returns `{ error: Error | null }` — never throws.

### `src/hooks/useAuditLog.ts` (modified)

| Before (hack) | After (hard log) |
|---------------|-----------------|
| `supabase.from('notifications').insert(...)` | `insertComplianceAuditEvent(...)` |
| Audit entries mixed with UI notifications | Dedicated compliance table |
| `useAuditLogs` reads `notifications LIKE 'Audit:%'` | Reads `compliance_audit_log` with typed filters |
| `AuditAction` type defined locally | Re-exported from `src/types/audit.ts` (`ComplianceEventType`) |

### `src/types/audit.ts` (new)

Typed interfaces: `ComplianceEventType`, `ComplianceAuditSource`,
`ComplianceAuditLogEntry`, `ComplianceAuditLogInsert`.

---

## 4. What PR-L3 / PR-L4 / PR-L7 Build On Top

| Future PR | Dependency on this foundation |
|-----------|-------------------------------|
| **PR-L3 — DSAR inbox** | Reads `compliance_audit_log WHERE actor_user_id = ?` via service_role to assemble the user's activity export. |
| **PR-L4 — Retention automation** | Triggers on `event_type = 'user.data_delete_request'` to schedule anonymisation jobs. |
| **PR-L7 — Breach register** | Inserts `event_type LIKE 'breach.*'` with `source = 'edge_function'` from a dedicated breach-reporting Edge Function. |

---

## 5. What Was NOT Changed

- The `notifications` table itself is untouched.
- Existing notification records (including pre-PR-L8 audit entries stored as notifications)
  are left as-is. They are not migrated to `compliance_audit_log` — they were not
  legally reliable evidence and their value is historical/debug-only.
- No other hooks, pages, or components were modified.

---

## 6. Rollback

If PR-L8 needs to be reverted:

1. **Frontend rollback:**
   ```bash
   git revert <commit-hash>
   # This restores useAuditLog.ts to write to notifications
   ```

2. **Database rollback:**
   ```sql
   DROP TABLE IF EXISTS public.compliance_audit_log;
   ```
   _Safe: no other table depends on `compliance_audit_log` at this stage._

3. **Impact:** Audit events will revert to the notifications-based hack.
   Any events logged to `compliance_audit_log` between PR-L8 merge and rollback
   will be lost (the table is dropped). This is acceptable before PR-L3/L4/L7
   build dependencies on top.

---

## 7. Evidence Log

```
Symptom:     Compliance audit events stored in user-deletable notifications table
Dowód:       src/hooks/useAuditLog.ts:87-101 (pre-PR-L8): supabase.from('notifications').insert(...)
             Comment in code: "In production, this would be a dedicated audit_logs table"
             AUDIT_COMPLIANCE_ARCHITECTURE_2026-04-20.md: "Krytyczna luka #3"
Zmiana:      New table compliance_audit_log (migration 20260420180000)
             No UPDATE/DELETE RLS policies = append-only
             useAuditLog.ts redirected to insertComplianceAuditEvent()
Weryfikacja: npm test: 5 new tests passed (auditLog.test.ts)
             tsc: 0 new errors introduced
             lint: 0 new errors
             build: ✓ built successfully
Rollback:    git revert + DROP TABLE compliance_audit_log
```
