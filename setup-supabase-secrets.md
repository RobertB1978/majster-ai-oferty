# Supabase Secrets Configuration

## ⚠️ MANUAL STEP REQUIRED

These secrets must be configured in Supabase Dashboard.

## Steps:

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/xwxvqhhnozfrjcjmcltv/settings/functions

### 2. Click "Secrets" Tab
You'll see the secrets management interface

### 3. Add Required Secrets

Click **"Add new secret"** for each:

#### ✅ Auto-Injected (usually already there):
- `SUPABASE_URL` = https://xwxvqhhnozfrjcjmcltv.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` = (get from Settings → API → service_role)

#### ✅ Email Service (REQUIRED for sending emails):
- `RESEND_API_KEY` = Get from: https://resend.com/api-keys

#### 🌐 Frontend URL (RECOMMENDED):
- `FRONTEND_URL` = Your Vercel app URL (e.g., https://majster-ai-oferty-foom.vercel.app)

#### 🤖 AI Provider (Choose ONE):

**Option A: Google Gemini (FREE)**
```
Name: GEMINI_API_KEY
Value: Get from https://aistudio.google.com → "Get API Key"
Cost: FREE (15 req/min, 1500 req/day)
```

**Option B: OpenAI (Paid, Best Quality)**
```
Name: OPENAI_API_KEY
Value: Get from https://platform.openai.com/api-keys
Cost: ~$0.01-0.03 per request
```

**Option C: Anthropic Claude (Paid)**
```
Name: ANTHROPIC_API_KEY
Value: Get from https://console.anthropic.com
Cost: ~$0.01-0.05 per request
```

### 4. Verify
After adding secrets, go to Edge Functions → Secrets and verify all are listed.

---

## Quick Links:

- Supabase Secrets: https://supabase.com/dashboard/project/xwxvqhhnozfrjcjmcltv/settings/functions
- Resend API Keys: https://resend.com/api-keys
- Google Gemini (FREE): https://aistudio.google.com
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com

---

## Minimum Configuration:

To get the app working with basic features:
1. ✅ SUPABASE_URL (auto-injected)
2. ✅ SUPABASE_SERVICE_ROLE_KEY (auto-injected)
3. ✅ RESEND_API_KEY (for emails)
4. ✅ GEMINI_API_KEY or OPENAI_API_KEY (for AI features)
