/**
 * send-calendar-reminders — Edge Function (cron job)
 *
 * Runs on a schedule (e.g. every day at 07:00 UTC via Supabase cron).
 * For each user's calendar events occurring in the next 24 hours:
 *   1. Creates an in-app notification (notifications table) — visible in the top bar bell icon
 *   2. Sends an email reminder via Resend (if RESEND_API_KEY + SENDER_EMAIL are configured)
 *
 * De-duplication: a reminder is only sent once per event per day
 * (tracked via calendar_reminder_sent table).
 *
 * Cron schedule in Supabase Dashboard → Database → Scheduled tasks:
 *   Function: send-calendar-reminders
 *   Schedule: 0 7 * * *   (daily at 07:00 UTC)
 *
 * Required secrets:
 *   CRON_SECRET          — authorisation token (same used by other cron functions)
 *   RESEND_API_KEY       — optional, skips email if not set
 *   SENDER_EMAIL         — optional, must be a verified Resend domain
 *   FRONTEND_URL         — optional, used for CTA link in email
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { htmlEscape } from '../_shared/sanitization.ts';
import { getCorsHeaders, getCorsPreflightHeaders } from '../_shared/cors.ts';

// ── Types ──────────────────────────────────────────────────────────────────

interface CalendarEventRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
}

// ── i18n helpers ───────────────────────────────────────────────────────────

type SupportedLocale = 'pl' | 'en' | 'uk';

const EVENT_TYPE_LABELS: Record<string, Record<SupportedLocale, string>> = {
  deadline:  { pl: 'Termin',    en: 'Deadline',  uk: 'Дедлайн'  },
  meeting:   { pl: 'Spotkanie', en: 'Meeting',   uk: 'Зустріч'  },
  reminder:  { pl: 'Przypomnienie', en: 'Reminder', uk: 'Нагадування' },
  follow_up: { pl: 'Follow-up', en: 'Follow-up', uk: 'Follow-up' },
  other:     { pl: 'Zdarzenie', en: 'Event',     uk: 'Подія'    },
};

function eventTypeLabel(type: string, locale: SupportedLocale): string {
  return (EVENT_TYPE_LABELS[type] ?? EVENT_TYPE_LABELS['other'])[locale];
}

interface ReminderStrings {
  notificationTitle: (type: string) => string;
  notificationMessage: (title: string, time: string | null, date: string) => string;
  emailSubject: (title: string) => string;
  emailHeading: string;
  emailBody: (title: string, type: string, time: string | null, date: string) => string;
  emailFooter: string;
  emailCta: string;
  timeLabel: string;
  allDay: string;
}

const STRINGS: Record<SupportedLocale, ReminderStrings> = {
  pl: {
    notificationTitle: (type) => `Nadchodzące wydarzenie: ${type}`,
    notificationMessage: (title, time, date) =>
      `"${title}" zaplanowane na ${date}${time ? ` o ${time}` : ' (cały dzień)'}`,
    emailSubject: (title) => `Przypomnienie: "${title}" jutro`,
    emailHeading: '📅 Przypomnienie o jutrzejszym wydarzeniu',
    emailBody: (title, type, time, date) =>
      `Jutro (${date}) masz zaplanowane wydarzenie:<br><br>` +
      `<strong>Typ:</strong> ${type}<br>` +
      `<strong>Tytuł:</strong> ${title}<br>` +
      `<strong>Godzina:</strong> ${time ?? 'Cały dzień'}`,
    emailFooter: 'Ta wiadomość została wysłana automatycznie przez Majster.AI',
    emailCta: 'Otwórz kalendarz',
    timeLabel: 'Godzina',
    allDay: 'Cały dzień',
  },
  en: {
    notificationTitle: (type) => `Upcoming event: ${type}`,
    notificationMessage: (title, time, date) =>
      `"${title}" scheduled for ${date}${time ? ` at ${time}` : ' (all day)'}`,
    emailSubject: (title) => `Reminder: "${title}" tomorrow`,
    emailHeading: '📅 Reminder: tomorrow\'s event',
    emailBody: (title, type, time, date) =>
      `Tomorrow (${date}) you have a scheduled event:<br><br>` +
      `<strong>Type:</strong> ${type}<br>` +
      `<strong>Title:</strong> ${title}<br>` +
      `<strong>Time:</strong> ${time ?? 'All day'}`,
    emailFooter: 'This message was sent automatically by Majster.AI',
    emailCta: 'Open calendar',
    timeLabel: 'Time',
    allDay: 'All day',
  },
  uk: {
    notificationTitle: (type) => `Майбутня подія: ${type}`,
    notificationMessage: (title, time, date) =>
      `"${title}" заплановано на ${date}${time ? ` о ${time}` : ' (весь день)'}`,
    emailSubject: (title) => `Нагадування: "${title}" завтра`,
    emailHeading: '📅 Нагадування про завтрашню подію',
    emailBody: (title, type, time, date) =>
      `Завтра (${date}) у вас запланована подія:<br><br>` +
      `<strong>Тип:</strong> ${type}<br>` +
      `<strong>Назва:</strong> ${title}<br>` +
      `<strong>Час:</strong> ${time ?? 'Весь день'}`,
    emailFooter: 'Це повідомлення надіслано автоматично системою Majster.AI',
    emailCta: 'Відкрити календар',
    timeLabel: 'Час',
    allDay: 'Весь день',
  },
};

function getStrings(locale?: string): ReminderStrings {
  const supported: SupportedLocale[] = ['pl', 'en', 'uk'];
  const l = supported.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : 'pl';
  return STRINGS[l];
}

// ── Email template ─────────────────────────────────────────────────────────

function buildEmailHtml(s: ReminderStrings, params: {
  heading: string;
  body: string;
  footer: string;
  ctaText: string;
  ctaUrl: string;
  companyName: string;
}): string {
  const { heading, body, footer, ctaText, ctaUrl, companyName } = params;
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;max-width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:600;">${heading}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 30px;">
            <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;">${body}</p>
            ${ctaUrl ? `
            <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:12px;">
              <tr><td align="center">
                <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">
                  ${ctaText}
                </a>
              </td></tr>
            </table>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:13px;margin:0 0 6px;">${footer}</p>
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} ${companyName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  // Authorization: cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[calendar-reminders] Unauthorized attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const senderEmail = Deno.env.get('SENDER_EMAIL');
  const frontendUrl = Deno.env.get('FRONTEND_URL') ?? '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Target date: tomorrow (UTC)
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0]; // yyyy-MM-dd

  const today = new Date().toISOString().split('T')[0];

  console.log(`[calendar-reminders] Processing events for ${tomorrowISO}`);

  try {
    // Fetch all non-completed events for tomorrow
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('id, user_id, title, description, event_date, event_time, event_type')
      .eq('event_date', tomorrowISO)
      .neq('status', 'completed');

    if (eventsError) {
      console.error('[calendar-reminders] Failed to fetch events:', eventsError);
      throw eventsError;
    }

    const calendarEvents = (events ?? []) as CalendarEventRow[];
    console.log(`[calendar-reminders] Found ${calendarEvents.length} events for tomorrow`);

    let notificationsSent = 0;
    let emailsSent = 0;
    const errors: string[] = [];

    for (const event of calendarEvents) {
      try {
        // De-duplication: check if we already sent a reminder today for this event
        const { data: existing } = await supabase
          .from('calendar_reminder_sent')
          .select('id')
          .eq('event_id', event.id)
          .eq('sent_date', today)
          .maybeSingle();

        if (existing) {
          console.log(`[calendar-reminders] Already sent reminder for event ${event.id} today`);
          continue;
        }

        // Fetch user profile for email + locale
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, company_name')
          .eq('user_id', event.user_id)
          .maybeSingle() as { data: { user_id: string; company_name: string | null } | null };

        // Fetch user email from auth.users (service role required)
        const { data: userData } = await supabase.auth.admin.getUserById(event.user_id);
        const userEmail = userData?.user?.email ?? null;

        const locale: SupportedLocale = 'pl'; // TODO: use profile locale when available
        const s = getStrings(locale);
        const typeLabel = eventTypeLabel(event.event_type, locale);
        const timeFormatted = event.event_time ? event.event_time.slice(0, 5) : null;
        const companyName = profile?.company_name ?? 'Majster.AI';

        // 1. Create in-app notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: event.user_id,
            title: s.notificationTitle(typeLabel),
            message: s.notificationMessage(
              htmlEscape(event.title),
              timeFormatted,
              tomorrowISO,
            ),
            type: 'info',
            is_read: false,
            action_url: '/app/calendar',
          });

        if (notifError) {
          console.error(`[calendar-reminders] Notification insert failed for event ${event.id}:`, notifError);
          errors.push(`notification:${event.id}:${notifError.message}`);
        } else {
          notificationsSent++;
        }

        // 2. Send email reminder (optional — only when RESEND_API_KEY is configured)
        if (resendApiKey && senderEmail && userEmail) {
          const body = s.emailBody(
            htmlEscape(event.title),
            typeLabel,
            timeFormatted,
            tomorrowISO,
          );

          const emailHtml = buildEmailHtml(s, {
            heading: s.emailHeading,
            body,
            footer: s.emailFooter,
            ctaText: s.emailCta,
            ctaUrl: frontendUrl ? `${frontendUrl}/app/calendar` : '',
            companyName: htmlEscape(companyName),
          });

          const emailResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `Majster.AI <${senderEmail}>`,
              to: [userEmail],
              subject: s.emailSubject(event.title),
              html: emailHtml,
            }),
          });

          if (emailResp.ok) {
            emailsSent++;
          } else {
            const errText = await emailResp.text();
            console.error(`[calendar-reminders] Resend error for event ${event.id}:`, errText);
            errors.push(`email:${event.id}:${errText}`);
          }
        }

        // 3. Record de-duplication row
        const { error: dedupError } = await supabase
          .from('calendar_reminder_sent')
          .insert({ event_id: event.id, user_id: event.user_id, sent_date: today });

        if (dedupError) {
          // Non-fatal: worst case duplicate email sent; log and continue
          console.warn(`[calendar-reminders] De-dup insert failed for ${event.id}:`, dedupError);
        }

      } catch (eventErr: unknown) {
        const msg = eventErr instanceof Error ? eventErr.message : 'Unknown error';
        console.error(`[calendar-reminders] Error processing event ${event.id}:`, eventErr);
        errors.push(`${event.id}:${msg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${calendarEvents.length} events for ${tomorrowISO}`,
        notificationsSent,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[calendar-reminders] Fatal error:', err);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
