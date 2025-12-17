# Email Deliverability Playbook

**TIER 2.3 - Ensure Emails Reach Inbox**

**Manifest compliance:**
- ✅ Fail fast (verify before sending to users)
- ✅ Reproduce, don't guess (test with tools)
- ✅ Playbook = komenda + expected output

---

## Why Email Deliverability Matters

**Business Risk With Poor Deliverability:**
- Offers sent → land in spam → customers never see them → lost sales
- High bounce rate → Resend account suspended
- Spam complaints → Domain reputation ruined

**Current Email System:**
- **Service:** Resend (https://resend.com)
- **Function:** `send-offer-email` Edge Function
- **Use case:** Send quote PDFs to clients

**Deliverability Goals:**
- ✅ Inbox rate > 95%
- ✅ Bounce rate < 2%
- ✅ Spam complaint rate < 0.1%
- ✅ Sender reputation score > 90

---

## Email Authentication Setup

### Step 1: DNS Records (SPF, DKIM, DMARC)

**Why Authentication Matters:**
- SPF: Proves your server is allowed to send from your domain
- DKIM: Cryptographically signs emails (proves not tampered)
- DMARC: Tells receivers what to do with unauthenticated emails

**Setup via Resend:**

1. **Go to Resend Dashboard:**
   - https://resend.com/domains
   - Click "Add Domain"
   - Enter: `yourdomain.com`

2. **Add DNS Records:**

   Resend will show you records to add. Example:

   ```
   Type    Name                Value                                   TTL
   TXT     @                   v=spf1 include:_spf.resend.com ~all    3600
   TXT     resend._domainkey   [DKIM key from Resend]                  3600
   TXT     _dmarc              v=DMARC1; p=quarantine; ...             3600
   CNAME   rs._domainkey       [CNAME value from Resend]               3600
   ```

3. **Add to Your DNS Provider (e.g., Cloudflare, Namecheap):**
   - Log into your domain registrar
   - DNS settings
   - Add each record exactly as shown
   - Wait 15-60 minutes for propagation

4. **Verify in Resend:**
   - Click "Verify"
   - All records should show ✅ green checkmarks

**Expected Result:**
```
✅ SPF Record Verified
✅ DKIM Record Verified
✅ DMARC Record Verified
```

**Test Command:**
```bash
# Check SPF
dig TXT yourdomain.com | grep spf

# Check DKIM
dig TXT resend._domainkey.yourdomain.com

# Check DMARC
dig TXT _dmarc.yourdomain.com
```

**Expected Output:**
```
yourdomain.com. 300 IN TXT "v=spf1 include:_spf.resend.com ~all"
resend._domainkey.yourdomain.com. 300 IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSq..."
_dmarc.yourdomain.com. 300 IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

---

### Step 2: Custom Domain (Not "via resend.dev")

**Why:**
- Emails from "noreply@yourdomain.com" > "noreply@resend.dev"
- Builds domain reputation
- Looks professional

**Setup:**
1. In Resend, use custom domain: `yourdomain.com`
2. From address: `offers@yourdomain.com` or `noreply@yourdomain.com`
3. Reply-to: `support@yourdomain.com` (monitored inbox)

**Update Edge Function:**
```typescript
// In send-offer-email/index.ts
const emailData = {
  from: 'Majster.AI <offers@yourdomain.com>',  // NOT resend.dev
  reply_to: 'support@yourdomain.com',
  to: recipientEmail,
  subject: `Oferta: ${projectName}`,
  // ...
};
```

---

## Email Content Best Practices

### Avoid Spam Triggers

**❌ SPAM TRIGGERS (Avoid These):**
- ALL CAPS SUBJECT LINES
- Excessive !!! exclamation marks!!!
- "Click here now!!!" urgency language
- Shortened URLs (bit.ly, etc.)
- Attachments > 10MB
- Words: "FREE", "WINNER", "GUARANTEE", "ACT NOW"
- Invisible text (same color as background)
- No plain text version (HTML only)

**✅ GOOD PRACTICES:**
```typescript
// Good subject line
subject: `Oferta dla projektu: ${projectName}`

// Bad subject line
subject: `DARMOWA OFERTA!!! KLIKNIJ TERAZ!!!`
```

### Email Structure

**Required Elements:**
- Clear sender name: "Majster.AI" or "Jan Kowalski via Majster.AI"
- Professional from address: `offers@yourdomain.com`
- Relevant subject line (no clickbait)
- Plain text + HTML versions
- Unsubscribe link (legal requirement - GDPR)
- Physical address in footer (anti-spam law)
- Clear call-to-action

**Example Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Oferta</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2563eb; color: white; padding: 20px;">
    <h1>Majster.AI</h1>
  </div>

  <div style="padding: 20px;">
    <p>Dzień dobry,</p>
    <p>Przesyłam ofertę na projekt: <strong>{{projectName}}</strong></p>
    <p>Oferta jest ważna do: {{validUntil}}</p>

    <a href="{{approveLink}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px;">
      Zobacz i zaakceptuj ofertę
    </a>

    <p style="margin-top: 30px; color: #666; font-size: 12px;">
      Jeśli przycisk nie działa, skopiuj ten link: {{approveLink}}
    </p>
  </div>

  <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p>Majster.AI - Narzędzie dla fachowców</p>
    <p>ul. Przykładowa 123, 00-000 Warszawa, Polska</p>
    <p><a href="{{unsubscribeLink}}">Zrezygnuj z powiadomień</a></p>
  </div>
</body>
</html>
```

**Plain Text Version:**
```
Dzień dobry,

Przesyłam ofertę na projekt: {{projectName}}

Oferta jest ważna do: {{validUntil}}

Zobacz i zaakceptuj ofertę: {{approveLink}}

--
Majster.AI - Narzędzie dla fachowców
ul. Przykładowa 123, 00-000 Warszawa
Zrezygnuj z powiadomień: {{unsubscribeLink}}
```

---

## Testing Email Deliverability

### Test 1: Mail-Tester (Spam Score Check)

**Tool:** https://www.mail-tester.com

**Steps:**
1. Go to https://www.mail-tester.com
2. Copy the test email address (e.g., `test-ab12cd@srv1.mail-tester.com`)
3. Send test email via your `send-offer-email` function
4. Wait 30 seconds
5. Click "Then check your score"

**Expected Score:**
- ✅ **9/10 or 10/10** - Excellent, will reach inbox
- ⚠️ **7-8/10** - Good, minor improvements needed
- 🚨 **< 7/10** - Poor, will likely go to spam

**Common Issues & Fixes:**

| Issue | Fix |
|-------|-----|
| "SPF record missing" | Add SPF DNS record |
| "DKIM signature missing" | Add DKIM DNS record |
| "From domain doesn't match" | Use custom domain, not resend.dev |
| "Broken HTML" | Fix HTML validation errors |
| "Blacklisted IP" | Contact Resend support |

---

### Test 2: GlockApps / Inbox Insight

**Tool:** https://glockapps.com (paid, $79/month, free trial available)

**What It Does:**
- Tests delivery to Gmail, Outlook, Yahoo, etc.
- Shows inbox placement rate
- Identifies spam folder placement

**Steps:**
1. Sign up for free trial
2. Send test email to provided address
3. View report showing inbox placement per provider

**Expected Results:**
```
Gmail:      95%+ inbox, 5% spam
Outlook:    90%+ inbox, 10% spam
Yahoo:      85%+ inbox, 15% spam
Apple Mail: 95%+ inbox, 5% spam
```

---

### Test 3: Real-World Test (Manual)

**Steps:**
1. Create test accounts on:
   - Gmail (personal)
   - Outlook/Hotmail
   - Yahoo (if target audience uses it)
   - ProtonMail (if privacy-focused users)

2. Send test email from your app to all test accounts

3. Check each inbox:
   - ✅ **Inbox** - Perfect!
   - ⚠️ **Promotions tab** (Gmail) - Acceptable, but try to improve
   - 🚨 **Spam folder** - Fix immediately

**Improvement Strategies:**
- If Gmail Promotions: Add personal touch, reduce promotional language
- If Spam: Check Mail-Tester score, fix authentication
- If bounced: Verify email address is valid

---

## Monitoring Ongoing Deliverability

### Resend Dashboard Metrics

**Go to:** https://resend.com/emails

**Monitor:**
- **Delivery rate:** > 98% (emails successfully delivered)
- **Bounce rate:** < 2% (invalid addresses, full inboxes)
- **Spam complaint rate:** < 0.1% (users marked as spam)
- **Open rate:** 20-40% (typical for transactional emails)
- **Click rate:** 10-20% (if email has links)

**Alert Thresholds:**
```
Bounce rate > 5%:        Clean email list, remove invalids
Spam complaints > 0.5%:  Review email content, add unsubscribe
Delivery rate < 95%:     Check DNS records, contact Resend
```

---

### Database Tracking

**Create table for email analytics:**
```sql
CREATE TABLE email_deliverability_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  emails_sent INTEGER NOT NULL,
  emails_delivered INTEGER NOT NULL,
  emails_bounced INTEGER NOT NULL,
  emails_opened INTEGER NOT NULL,
  bounce_rate NUMERIC(5,2),
  open_rate NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_email_log_date ON email_deliverability_log(date DESC);
```

**Edge Function: `track-email-metrics/index.ts`**
```typescript
Deno.serve(async (req) => {
  // Fetch yesterday's stats from Resend API
  const stats = await fetch('https://api.resend.com/emails/stats', {
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
  }).then(r => r.json());

  const bounceRate = (stats.bounced / stats.sent) * 100;
  const openRate = (stats.opened / stats.delivered) * 100;

  // Save to database
  await supabase.from('email_deliverability_log').insert({
    date: new Date().toISOString().split('T')[0],
    emails_sent: stats.sent,
    emails_delivered: stats.delivered,
    emails_bounced: stats.bounced,
    emails_opened: stats.opened,
    bounce_rate: bounceRate,
    open_rate: openRate,
  });

  // Alert if issues
  if (bounceRate > 5) {
    console.error(`🚨 High bounce rate: ${bounceRate.toFixed(2)}%`);
    // Send alert
  }

  return new Response(JSON.stringify({ bounceRate, openRate }));
});
```

**Schedule daily:**
```sql
SELECT cron.schedule(
  'daily-email-metrics',
  '0 8 * * *',
  $$SELECT net.http_post('https://YOUR_PROJECT.supabase.co/functions/v1/track-email-metrics')$$
);
```

---

## Handling Bounces & Complaints

### Bounce Types

**Hard Bounce (Permanent):**
- Invalid email address
- Domain doesn't exist
- Mailbox doesn't exist

**Action:** Remove from database immediately, never email again

**Soft Bounce (Temporary):**
- Mailbox full
- Server temporarily down
- Message too large

**Action:** Retry 2-3 times over 24h, then mark as bounced

**Implementation:**
```typescript
// In send-offer-email/index.ts
await supabase.from('email_bounces').upsert({
  email: recipientEmail,
  bounce_type: 'hard' | 'soft',
  bounce_reason: 'Invalid email address',
  last_bounce_at: new Date().toISOString(),
});

// Before sending, check bounces
const { data: bounced } = await supabase
  .from('email_bounces')
  .select('*')
  .eq('email', recipientEmail)
  .eq('bounce_type', 'hard')
  .single();

if (bounced) {
  throw new Error('Email previously bounced - not sending');
}
```

---

### Spam Complaints

**When user clicks "Report Spam":**
- Resend notifies you via webhook
- **Immediately** unsubscribe that email
- Never send to them again (legally required)

**Webhook Handler:**
```typescript
// Add to stripe-webhook or create email-webhook
case 'email.complained':
  await supabase.from('email_unsubscribes').insert({
    email: event.data.email,
    reason: 'spam_complaint',
    unsubscribed_at: new Date().toISOString(),
  });
  break;
```

**Before Sending:**
```typescript
const { data: unsubscribed } = await supabase
  .from('email_unsubscribes')
  .select('*')
  .eq('email', recipientEmail)
  .single();

if (unsubscribed) {
  throw new Error('User has unsubscribed - cannot send');
}
```

---

## GDPR Compliance (Required in Poland)

### Required Email Elements

**1. Unsubscribe Link:**
```html
<a href="https://yourdomain.com/unsubscribe?email={{email}}&token={{token}}">
  Zrezygnuj z powiadomień email
</a>
```

**2. Company Address:**
```
[Your Company Name]
ul. [Street] [Number]
[Postal Code] [City]
NIP: [Tax ID]
```

**3. Privacy Policy Link:**
```html
<a href="https://yourdomain.com/legal/privacy">Polityka prywatności</a>
```

**4. Purpose Statement:**
```
Ten email został wysłany, ponieważ otrzymałeś ofertę w systemie Majster.AI.
Jeśli nie chcesz otrzymywać takich wiadomości, kliknij link poniżej.
```

---

## Email Warm-Up (New Domain)

**If using new domain, gradually increase volume:**

**Week 1:** 10-20 emails/day
**Week 2:** 50-100 emails/day
**Week 3:** 200-500 emails/day
**Week 4+:** Unlimited (within Resend limits)

**Why:** Sudden high volume from new domain = spam flag

**How to Warm Up:**
1. Start with engaged users (people who signed up recently)
2. Send valuable content (not promotional)
3. Encourage replies ("Reply if you have questions")
4. Monitor bounce/spam rates daily

---

## Pre-Production Checklist

**Before Sending Emails to Real Customers:**
- [ ] DNS records verified (SPF, DKIM, DMARC)
- [ ] Custom domain used (not resend.dev)
- [ ] Mail-Tester score > 8/10
- [ ] Test emails reach inbox (Gmail, Outlook, Yahoo)
- [ ] Unsubscribe link works
- [ ] GDPR compliance (address, privacy policy)
- [ ] Bounce handling implemented
- [ ] Spam complaint handling implemented
- [ ] Email content professional and clear
- [ ] Plain text + HTML versions
- [ ] Reply-to address monitored

---

## Success Criteria

**TIER 2.3 Complete When:**
- ✅ DNS authentication set up (SPF, DKIM, DMARC)
- ✅ Mail-Tester score > 8/10
- ✅ Test emails reach inbox (not spam)
- ✅ Bounce/complaint tracking implemented
- ✅ GDPR compliance verified
- ✅ Monitoring in place (daily metrics check)

---

**Last Updated:** 2025-12-17
**Owned By:** Platform / Email Infrastructure
**Review Frequency:** Monthly (check metrics), Quarterly (test deliverability)
