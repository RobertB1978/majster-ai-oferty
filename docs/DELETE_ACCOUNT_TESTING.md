# Delete Account Testing Guide

**Security Pack Δ1 - PROMPT 5/10**

This guide explains how to test the account deletion feature safely.

---

## ⚠️ WARNING

**Account deletion is IRREVERSIBLE.** Test ONLY with test accounts, never with production data.

---

## What Gets Deleted

When a user deletes their account, the following data is permanently removed:

- ✅ User account (auth.users)
- ✅ User profile
- ✅ All projects
- ✅ All clients
- ✅ All quotes and quote items
- ✅ Calendar events
- ✅ Item templates
- ✅ Notifications
- ✅ Offer approvals
- ✅ User subscriptions

---

## Manual Testing Procedure

### Prerequisites

1. Create a **test account** (not your real account!)
2. Add some test data (project, client, quote)
3. Note the user ID for verification

### Test Steps

#### 1. Navigate to Settings

```
1. Log in with test account
2. Go to Settings
3. Scroll to "Danger Zone" section
4. Click "Delete Account" button
```

#### 2. Test Confirmation Dialog

```
✅ Dialog should appear
✅ Should show warning about irreversibility
✅ Should have input field for confirmation phrase
✅ Should display exact phrase required: "DELETE MY ACCOUNT"
```

#### 3. Test Wrong Confirmation

```
1. Type: "delete my account" (lowercase)
2. Click "Confirm Delete"
3. Expected: Error message about exact phrase
4. Expected: Account NOT deleted
```

#### 4. Test Correct Confirmation

```
1. Type: "DELETE MY ACCOUNT" (exact match)
2. Click "Confirm Delete"
3. Expected: Loading state
4. Expected: Redirect to goodbye/logout page
5. Expected: Cannot log in with same credentials
```

#### 5. Verify Data Deletion

Check database (Supabase Dashboard):

```sql
-- All these should return 0 rows
SELECT * FROM profiles WHERE user_id = '<test_user_id>';
SELECT * FROM projects WHERE user_id = '<test_user_id>';
SELECT * FROM clients WHERE user_id = '<test_user_id>';
SELECT * FROM quotes WHERE user_id = '<test_user_id>';
```

---

## Rate Limiting Test

The delete endpoint is rate-limited to **3 requests per hour** per user.

### Test Procedure

```
1. Try to delete account (cancel before confirming)
2. Repeat 3 more times rapidly
3. Expected: 4th attempt shows rate limit error
4. Wait 1 hour
5. Expected: Can try again
```

---

## API Testing with cURL

For backend-only testing (requires Bearer token):

### Test 1: Valid Deletion

```bash
curl -X POST https://your-project.supabase.co/functions/v1/delete-user-account \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmationPhrase": "DELETE MY ACCOUNT"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Konto i wszystkie dane zostały trwale usunięte",
  "details": {
    "totalRecordsDeleted": 15
  }
}
```

### Test 2: Wrong Confirmation

```bash
curl -X POST https://your-project.supabase.co/functions/v1/delete-user-account \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmationPhrase": "delete"}'
```

**Expected Response (422):**
```json
{
  "error": "Invalid confirmation phrase",
  "details": ["Confirmation phrase must be exactly: \"DELETE MY ACCOUNT\""]
}
```

### Test 3: Missing Auth

```bash
curl -X POST https://your-project.supabase.co/functions/v1/delete-user-account \
  -H "Content-Type: application/json" \
  -d '{"confirmationPhrase": "DELETE MY ACCOUNT"}'
```

**Expected Response (401):**
```json
{
  "error": "Missing or invalid authorization header"
}
```

### Test 4: Rate Limiting

Call the endpoint 4 times rapidly:

```bash
for i in {1..4}; do
  curl -X POST https://your-project.supabase.co/functions/v1/delete-user-account \
    -H "Authorization: Bearer YOUR_USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"confirmationPhrase": "DELETE MY ACCOUNT"}'
  echo "\nAttempt $i"
  sleep 1
done
```

**Expected:** 4th call returns 429 (Rate Limit Exceeded)

---

## Security Checks

### ✅ Passed Security Tests

- [x] Requires authentication (Bearer token)
- [x] Exact confirmation phrase (case-sensitive)
- [x] Rate limiting (3 req/hour)
- [x] Audit logging (obfuscated userId)
- [x] No sensitive data in error messages
- [x] Graceful partial failure handling
- [x] GDPR Art. 17 compliant

### ⚠️ Known Limitations

- **No email confirmation**: Consider adding email verification
- **No cooldown period**: Deletion is immediate
- **No undo**: Once deleted, data is gone forever

---

## Recovery (None)

**There is NO recovery mechanism.** Deleted accounts cannot be restored.

If a user deletes their account by mistake:
1. They can create a new account
2. All previous data is lost
3. No backup is available

**Recommendation for Production:**
- Add 30-day soft delete period
- Send confirmation email
- Keep anonymized audit log

---

## Compliance

This implementation satisfies:

✅ **GDPR Art. 17** - Right to Erasure
✅ **CCPA** - Right to Delete
✅ **Polish RODO** - Prawo do usunięcia danych

---

**Last updated:** 2025-12-16
**Author:** Claude Code (Security Pack Δ1)
