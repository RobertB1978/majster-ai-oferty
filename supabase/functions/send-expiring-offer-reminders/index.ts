import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// interface ExpiringOffer {
//   id: string;
//   project_id: string;
//   client_email: string;
//   client_name: string;
//   expires_at: string;
//   public_token: string;
//   project_name: string;
//   company_name: string;
//   owner_email: string;
// }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron job authorization (same pattern as cleanup-expired-data)
  const authHeader = req.headers.get('authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
    const frontendUrl = Deno.env.get('FRONTEND_URL') || Deno.env.get('VERCEL_URL') || 'https://your-app.vercel.app';

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured - skipping email sending');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'RESEND_API_KEY not configured',
          skipped: true
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
        projects!inner(project_name, client_id)
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

        const companyName = profile?.company_name || 'Firma';
        const projectName = (offer.projects as unknown)?.project_name || 'Projekt';
        const clientEmail = offer.client_email;
        const clientName = offer.client_name || 'Szanowny Kliencie';

        if (!clientEmail) {
          console.log(`Skipping offer ${offer.id} - no client email`);
          continue;
        }

        // Check if we already sent a reminder today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingReminder } = await supabase
          .from('offer_sends')
          .select('id')
          .eq('project_id', offer.project_id)
          .eq('client_email', clientEmail)
          .gte('sent_at', `${today}T00:00:00`)
          .like('subject', '%przypomnienie%');

        if (existingReminder && existingReminder.length > 0) {
          console.log(`Reminder already sent today for offer ${offer.id}`);
          continue;
        }

        const approvalUrl = `${frontendUrl}/offer/${offer.public_token}`;
        const expiresDate = new Date(offer.expires_at).toLocaleDateString('pl-PL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const emailHtml = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Przypomnienie o ofercie</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">⏰ Przypomnienie o ofercie</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Szanowny/a <strong>${clientName}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Przypominamy, że oferta na projekt <strong>"${projectName}"</strong> od firmy <strong>${companyName}</strong> wygasa za <strong style="color: #ea580c;">3 dni</strong>.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>📅 Data wygaśnięcia:</strong> ${expiresDate}
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Aby przejrzeć szczegóły oferty i podjąć decyzję, kliknij poniższy przycisk:
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${approvalUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
                      Zobacz ofertę
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
                Ta wiadomość została wysłana automatycznie przez system Majster.AI
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}. Wszelkie prawa zastrzeżone.
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
            from: 'Majster.AI <noreply@resend.dev>',
            to: [clientEmail],
            subject: `⏰ Przypomnienie: Oferta na "${projectName}" wygasa za 3 dni`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Resend API error: ${errorText}`);
        }

        // Log the send in offer_sends table
        await supabase.from('offer_sends').insert({
          project_id: offer.project_id,
          user_id: offer.user_id,
          client_email: clientEmail,
          subject: `⏰ Przypomnienie: Oferta na "${projectName}" wygasa za 3 dni`,
          message: 'Automatyczne przypomnienie o wygasającej ofercie (3 dni)',
          status: 'sent',
        });

        sentEmails.push(clientEmail);
        console.log(`Reminder sent to ${clientEmail} for offer ${offer.id}`);

      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`Error sending reminder for offer ${offer.id}:`, emailError);
        errors.push(`${offer.id}: ${errorMessage}`);
      }
    }

    // ── PR-18: Warranty expiry reminders (T-30 and T-7) ─────────────────────

    const now = new Date();

    // Helper: ISO date string for today + N days
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
          const clientEmail = w.client_email as string;
          const clientName  = (w.client_name as string | null) ?? 'Kliencie';
          const endDateStr  = new Date(w.end_date as string).toLocaleDateString('pl-PL', {
            year: 'numeric', month: 'long', day: 'numeric',
          });

          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('user_id', w.user_id)
            .maybeSingle();
          const companyName = (profile?.company_name as string | null) ?? 'Wykonawca';

          const subject = daysAhead === 30
            ? `Gwarancja wygasa za 30 dni — ${companyName}`
            : `Gwarancja wygasa za 7 dni — ${companyName}`;

          const emailHtml = `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;max-width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
        <tr><td style="background:linear-gradient(135deg,#1e5ac8,#1348a8);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">🛡️ Przypomnienie o gwarancji</h1>
        </td></tr>
        <tr><td style="padding:36px 30px;">
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
            Szanowny/a <strong>${clientName}</strong>,
          </p>
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">
            Gwarancja udzielona przez firmę <strong>${companyName}</strong> wygasa za
            <strong style="color:#1e5ac8;">${daysAhead} dni</strong> — dnia <strong>${endDateStr}</strong>.
          </p>
          <div style="background:#eff6ff;border-left:4px solid #1e5ac8;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="color:#1e40af;font-size:14px;margin:0;">
              Jeśli zauważyłeś/aś usterki lub problemy, skontaktuj się z wykonawcą przed upływem gwarancji.
            </p>
          </div>
          <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">
            Ta wiadomość została wysłana automatycznie przez system Majster.AI
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
            body: JSON.stringify({ from: 'Majster.AI <noreply@resend.dev>', to: [clientEmail], subject, html: emailHtml }),
          });

          if (!emailResp.ok) {
            const txt = await emailResp.text();
            throw new Error(`Resend: ${txt}`);
          }

          // Mark reminder sent
          await supabase
            .from('project_warranties')
            .update({ [reminderField]: new Date().toISOString() })
            .eq('id', w.id);

          warrantySent.push(`${clientEmail} (T-${daysAhead})`);
          console.log(`Warranty reminder T-${daysAhead} sent to ${clientEmail}`);

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
        emails: [...sentEmails, ...warrantySent],
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
