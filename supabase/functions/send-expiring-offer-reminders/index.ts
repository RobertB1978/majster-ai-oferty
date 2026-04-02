import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { htmlEscape } from '../_shared/sanitization.ts';
import { getCorsHeaders, getCorsPreflightHeaders } from '../_shared/cors.ts';

// ── Locale strings for offer expiry reminders ────────────────────────────────
// Mirrors the pattern from send-offer-email/emailHandler.ts.
// Default: 'pl' — until profiles table gains a preferred_locale column,
// all automated reminders default to Polish (93%+ users are Polish).

type SupportedLocale = 'pl' | 'en' | 'uk';

interface OfferReminderStrings {
  htmlLang: string;
  title: string;
  greeting: (name: string) => string;
  body: (projectName: string, companyName: string) => string;
  expiresIn: string;
  expiresLabel: string;
  cta: string;
  contactNote: string;
  footer: string;
  subject: (projectName: string) => string;
  logMessage: string;
  /** Fallback names when DB value is null */
  fallbackClient: string;
  fallbackCompany: string;
  fallbackProject: string;
}

interface WarrantyReminderStrings {
  htmlLang: string;
  title: string;
  greeting: (name: string) => string;
  body: (companyName: string, days: number, dateStr: string) => string;
  contactNote: string;
  footer: string;
  subject: (days: number, companyName: string) => string;
  /** Fallback names when DB value is null */
  fallbackClient: string;
  fallbackCompany: string;
}

const OFFER_REMINDER_STRINGS: Record<SupportedLocale, OfferReminderStrings> = {
  pl: {
    htmlLang: 'pl',
    title: '⏰ Przypomnienie o ofercie',
    greeting: (name) => `Szanowny/a <strong>${name}</strong>,`,
    body: (project, company) =>
      `Przypominamy, że oferta na projekt <strong>"${project}"</strong> od firmy <strong>${company}</strong> wygasa za <strong style="color: #ea580c;">3 dni</strong>.`,
    expiresIn: '3 dni',
    expiresLabel: '📅 Data wygaśnięcia:',
    cta: 'Zobacz ofertę',
    contactNote: 'Aby przejrzeć szczegóły oferty i podjąć decyzję, kliknij poniższy przycisk:',
    footer: 'Ta wiadomość została wysłana automatycznie przez system Majster.AI',
    subject: (project) => `Przypomnienie: Oferta na "${project}" wygasa za 3 dni`,
    logMessage: '[AUTO-REMINDER] Automatyczne przypomnienie o wygasającej ofercie (3 dni)',
    fallbackClient: 'Szanowny Kliencie',
    fallbackCompany: 'Firma',
    fallbackProject: 'Projekt',
  },
  en: {
    htmlLang: 'en',
    title: '⏰ Quote Reminder',
    greeting: (name) => `Dear <strong>${name}</strong>,`,
    body: (project, company) =>
      `This is a reminder that the quote for project <strong>"${project}"</strong> from <strong>${company}</strong> expires in <strong style="color: #ea580c;">3 days</strong>.`,
    expiresIn: '3 days',
    expiresLabel: '📅 Expiry date:',
    cta: 'View quote',
    contactNote: 'To review the details and make a decision, click the button below:',
    footer: 'This message was sent automatically by Majster.AI',
    subject: (project) => `Reminder: Quote for "${project}" expires in 3 days`,
    logMessage: '[AUTO-REMINDER] Automatic expiring offer reminder (3 days)',
    fallbackClient: 'Dear Client',
    fallbackCompany: 'Company',
    fallbackProject: 'Project',
  },
  uk: {
    htmlLang: 'uk',
    title: '⏰ Нагадування про пропозицію',
    greeting: (name) => `Шановний/а <strong>${name}</strong>,`,
    body: (project, company) =>
      `Нагадуємо, що пропозиція на проєкт <strong>"${project}"</strong> від компанії <strong>${company}</strong> закінчується через <strong style="color: #ea580c;">3 дні</strong>.`,
    expiresIn: '3 дні',
    expiresLabel: '📅 Дата закінчення:',
    cta: 'Переглянути пропозицію',
    contactNote: 'Щоб переглянути деталі та прийняти рішення, натисніть кнопку нижче:',
    footer: 'Це повідомлення надіслано автоматично системою Majster.AI',
    subject: (project) => `Нагадування: Пропозиція на "${project}" закінчується через 3 дні`,
    logMessage: '[AUTO-REMINDER] Automatic expiring offer reminder (3 days)',
    fallbackClient: 'Шановний Клієнте',
    fallbackCompany: 'Компанія',
    fallbackProject: 'Проєкт',
  },
};

const WARRANTY_REMINDER_STRINGS: Record<SupportedLocale, WarrantyReminderStrings> = {
  pl: {
    htmlLang: 'pl',
    title: '🛡️ Przypomnienie o gwarancji',
    greeting: (name) => `Szanowny/a <strong>${name}</strong>,`,
    body: (company, days, dateStr) =>
      `Gwarancja udzielona przez firmę <strong>${company}</strong> wygasa za <strong style="color:#1e5ac8;">${plDays(days)}</strong> — dnia <strong>${dateStr}</strong>.`,
    contactNote: 'Jeśli zauważyłeś/aś usterki lub problemy, skontaktuj się z wykonawcą przed upływem gwarancji.',
    footer: 'Ta wiadomość została wysłana automatycznie przez system Majster.AI',
    subject: (days, company) => `Gwarancja wygasa za ${plDays(days)} — ${company}`,
    fallbackClient: 'Kliencie',
    fallbackCompany: 'Wykonawca',
  },
  en: {
    htmlLang: 'en',
    title: '🛡️ Warranty Reminder',
    greeting: (name) => `Dear <strong>${name}</strong>,`,
    body: (company, days, dateStr) =>
      `The warranty provided by <strong>${company}</strong> expires in <strong style="color:#1e5ac8;">${enDays(days)}</strong> — on <strong>${dateStr}</strong>.`,
    contactNote: 'If you have noticed any defects or issues, please contact the contractor before the warranty expires.',
    footer: 'This message was sent automatically by Majster.AI',
    subject: (days, company) => `Warranty expires in ${enDays(days)} — ${company}`,
    fallbackClient: 'Client',
    fallbackCompany: 'Contractor',
  },
  uk: {
    htmlLang: 'uk',
    title: '🛡️ Нагадування про гарантію',
    greeting: (name) => `Шановний/а <strong>${name}</strong>,`,
    body: (company, days, dateStr) =>
      `Гарантія від компанії <strong>${company}</strong> закінчується через <strong style="color:#1e5ac8;">${ukDays(days)}</strong> — <strong>${dateStr}</strong>.`,
    contactNote: 'Якщо ви помітили дефекти або проблеми, зверніться до виконавця до закінчення гарантії.',
    footer: 'Це повідомлення надіслано автоматично системою Majster.AI',
    subject: (days, company) => `Гарантія закінчується через ${ukDays(days)} — ${company}`,
    fallbackClient: 'Клієнте',
    fallbackCompany: 'Виконавець',
  },
};

function toSupportedLocale(locale?: string): SupportedLocale {
  const supported: SupportedLocale[] = ['pl', 'en', 'uk'];
  return supported.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'pl';
}

function getOfferReminderStrings(locale?: string): OfferReminderStrings {
  return OFFER_REMINDER_STRINGS[toSupportedLocale(locale)];
}

function getWarrantyReminderStrings(locale?: string): WarrantyReminderStrings {
  return WARRANTY_REMINDER_STRINGS[toSupportedLocale(locale)];
}

/** Resolve BCP-47 locale tag for Intl date formatting. */
function resolveIntlLocale(locale?: string): string {
  const map: Record<string, string> = { pl: 'pl-PL', en: 'en-GB', uk: 'uk-UA' };
  return map[locale ?? 'pl'] ?? 'pl-PL';
}

/**
 * Ukrainian plural form for "day" (день/дні/днів).
 * Slavic languages have 3 plural forms based on number:
 *   1         → "день" (nominative singular)
 *   2, 3, 4   → "дні"  (nominative plural)
 *   5–20      → "днів" (genitive plural)
 *   21        → "день" (cycle restarts)
 */
function ukDays(n: number): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const lastOne = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return `${n} днів`;
  if (lastOne === 1) return `${n} день`;
  if (lastOne >= 2 && lastOne <= 4) return `${n} дні`;
  return `${n} днів`;
}

/**
 * Polish plural form for "day" (dzień/dni).
 * Polish: 1 → "dzień", 2+ → "dni"
 */
function plDays(n: number): string {
  return n === 1 ? `${n} dzień` : `${n} dni`;
}

/** English plural "day"/"days". */
function enDays(n: number): string {
  return n === 1 ? `${n} day` : `${n} days`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  // Verify cron job authorization (same pattern as cleanup-expired-data)
  const authHeader = req.headers.get('authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized reminder attempt');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const senderEmail = Deno.env.get('SENDER_EMAIL');
    const frontendUrl = Deno.env.get('FRONTEND_URL');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured - skipping email sending');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'RESEND_API_KEY not configured',
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!senderEmail) {
      console.error('SENDER_EMAIL not configured - skipping email sending');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'SENDER_EMAIL not configured — set a verified sender address (e.g. noreply@yourdomain.com). The domain must be verified in Resend. Gmail/Yahoo/Outlook addresses are not accepted.',
          skipped: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!frontendUrl) {
      console.error('FRONTEND_URL not configured - skipping email sending (offer links in reminder emails would be broken)');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'FRONTEND_URL not configured — set it to your production app URL (e.g. https://your-app.vercel.app or your custom domain)',
          skipped: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 3 days from now
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const startOfDay = new Date(threeDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(threeDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Looking for offers expiring between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    // Get offers expiring in exactly 3 days that haven't been reminded yet
    const { data: expiringOffers, error: offersError } = await supabase
      .from('offer_approvals')
      .select(`
        id,
        project_id,
        client_email,
        client_name,
        expires_at,
        public_token,
        user_id,
        projects!inner(project_name)
      `)
      .eq('status', 'pending')
      .gte('expires_at', startOfDay.toISOString())
      .lte('expires_at', endOfDay.toISOString());

    if (offersError) {
      console.error('Error fetching expiring offers:', offersError);
      throw offersError;
    }

    console.log(`Found ${expiringOffers?.length || 0} offers expiring in 3 days`);

    if (!expiringOffers || expiringOffers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No offers expiring in 3 days',
          sent: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sentEmails: string[] = [];
    const errors: string[] = [];

    for (const offer of expiringOffers) {
      try {
        // Get company profile for the offer owner
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, email_for_offers')
          .eq('user_id', offer.user_id)
          .single();

        // Locale: defaults to 'pl' — no per-client locale stored yet.
        // When profiles gains a preferred_locale column, pass it here.
        const locale: SupportedLocale = 'pl';
        const s = getOfferReminderStrings(locale);
        const intlLocale = resolveIntlLocale(locale);

        const companyNameRaw = profile?.company_name || s.fallbackCompany;
        const projectNameRaw = (offer.projects as unknown)?.project_name || s.fallbackProject;
        const clientNameRaw = offer.client_name || s.fallbackClient;
        const companyName = htmlEscape(companyNameRaw);
        const projectName = htmlEscape(projectNameRaw);
        const clientEmail = offer.client_email;
        const clientName = htmlEscape(clientNameRaw);

        if (!clientEmail) {
          console.log(`Skipping offer ${offer.id} - no client email`);
          continue;
        }

        // Check if we already sent a reminder today.
        // Uses locale-neutral marker [AUTO-REMINDER] instead of Polish keyword.
        const today = new Date().toISOString().split('T')[0];
        const { data: existingReminder } = await supabase
          .from('offer_sends')
          .select('id')
          .eq('project_id', offer.project_id)
          .eq('client_email', clientEmail)
          .gte('sent_at', `${today}T00:00:00`)
          .like('message', '%[AUTO-REMINDER]%');

        if (existingReminder && existingReminder.length > 0) {
          console.log(`Reminder already sent today for offer ${offer.id}`);
          continue;
        }

        const approvalUrl = `${frontendUrl}/offer/${offer.public_token}`;
        const expiresDate = new Date(offer.expires_at).toLocaleDateString(intlLocale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const emailHtml = `
<!DOCTYPE html>
<html lang="${s.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${s.title}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${s.greeting(clientName)}
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${s.body(projectName, companyName)}
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>${s.expiresLabel}</strong> ${expiresDate}
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                ${s.contactNote}
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${approvalUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
                      ${s.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                ${s.footer}
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Majster.AI <${senderEmail}>`,
            to: [clientEmail],
            subject: s.subject(projectNameRaw),
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Resend API error: ${errorText}`);
        }

        // Log the send in offer_sends table
        const { error: sendLogErr } = await supabase.from('offer_sends').insert({
          project_id: offer.project_id,
          user_id: offer.user_id,
          client_email: clientEmail,
          subject: s.subject(projectNameRaw),
          message: s.logMessage,
          status: 'sent',
        });
        if (sendLogErr) {
          console.error(`offer_sends insert failed for offer ${offer.id}:`, sendLogErr);
        }

        sentEmails.push(clientEmail);
        console.log(`Reminder sent for offer ${offer.id}`);

      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`Error sending reminder for offer ${offer.id}:`, emailError);
        errors.push(`${offer.id}: ${errorMessage}`);
      }
    }

    // ── PR-18: Warranty expiry reminders (T-30 and T-7) ─────────────────────

    // Helper: ISO date string for today + N days (reuses `now` declared above)
    const isoDatePlusDays = (n: number): string => {
      const d = new Date(now);
      d.setDate(d.getDate() + n);
      return d.toISOString().split('T')[0];
    };

    const warrantyErrors: string[] = [];
    const warrantySent: string[] = [];

    for (const [daysAhead, reminderField] of [
      [30, 'reminder_30_sent_at'],
      [7,  'reminder_7_sent_at'],
    ] as [number, string][]) {
      const targetDate = isoDatePlusDays(daysAhead);

      // project_warranties has computed end_date in the view
      const { data: expiringWarranties, error: wErr } = await supabase
        .from('project_warranties_with_end')
        .select('id, user_id, client_email, client_name, end_date, reminder_30_sent_at, reminder_7_sent_at')
        .eq('end_date', targetDate)
        .is(reminderField, null)
        .not('client_email', 'is', null);

      if (wErr) {
        console.error(`warranty reminder T-${daysAhead} fetch error:`, wErr);
        warrantyErrors.push(`T-${daysAhead} fetch: ${wErr.message}`);
        continue;
      }

      console.log(`Found ${expiringWarranties?.length ?? 0} warranties expiring in ${daysAhead} days`);

      for (const w of (expiringWarranties ?? [])) {
        try {
          // Locale: defaults to 'pl' — no per-client locale stored yet.
          const wLocale: SupportedLocale = 'pl';
          const ws = getWarrantyReminderStrings(wLocale);
          const wIntlLocale = resolveIntlLocale(wLocale);

          const clientEmail = w.client_email as string;
          const clientName  = htmlEscape((w.client_name as string | null) ?? ws.fallbackClient);

          const endDateStr  = new Date(w.end_date as string).toLocaleDateString(wIntlLocale, {
            year: 'numeric', month: 'long', day: 'numeric',
          });

          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('user_id', w.user_id)
            .maybeSingle();
          const companyNameRaw = (profile?.company_name as string | null) ?? ws.fallbackCompany;
          const companyName = htmlEscape(companyNameRaw);

          const subject = ws.subject(daysAhead, companyNameRaw);

          const emailHtml = `<!DOCTYPE html>
<html lang="${ws.htmlLang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;max-width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
        <tr><td style="background:linear-gradient(135deg,#1e5ac8,#1348a8);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">${ws.title}</h1>
        </td></tr>
        <tr><td style="padding:36px 30px;">
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
            ${ws.greeting(clientName)}
          </p>
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">
            ${ws.body(companyName, daysAhead, endDateStr)}
          </p>
          <div style="background:#eff6ff;border-left:4px solid #1e5ac8;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="color:#1e40af;font-size:14px;margin:0;">
              ${ws.contactNote}
            </p>
          </div>
          <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">
            ${ws.footer}
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${companyName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

          const emailResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: `Majster.AI <${senderEmail}>`, to: [clientEmail], subject, html: emailHtml }),
          });

          if (!emailResp.ok) {
            const txt = await emailResp.text();
            throw new Error(`Resend: ${txt}`);
          }

          // Mark reminder sent
          const { error: updateErr } = await supabase
            .from('project_warranties')
            .update({ [reminderField]: new Date().toISOString() })
            .eq('id', w.id);
          if (updateErr) {
            console.error(`warranty ${w.id} update ${reminderField} failed:`, updateErr);
          }

          warrantySent.push(`${clientEmail} (T-${daysAhead})`);
          console.log(`Warranty reminder T-${daysAhead} sent for warranty ${w.id}`);

        } catch (wEmailErr: unknown) {
          const msg = wEmailErr instanceof Error ? wEmailErr.message : 'Unknown error';
          console.error(`Warranty reminder error for ${w.id}:`, wEmailErr);
          warrantyErrors.push(`${w.id}: ${msg}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentEmails.length} offer + ${warrantySent.length} warranty reminders`,
        offersSent: sentEmails.length,
        warrantiesSent: warrantySent.length,
        errors: [...errors, ...warrantyErrors].length > 0 ? [...errors, ...warrantyErrors] : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-expiring-offer-reminders:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
