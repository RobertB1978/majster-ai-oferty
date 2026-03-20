// ============================================
// SEND OFFER EMAIL - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateEmail,
  validateString,
  createValidationErrorResponse,
  combineValidations,
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { handleSendOfferEmail, checkEmailDeliveryConfig, type EmailDeps, type SendOfferPayload } from "./emailHandler.ts";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";

interface SendOfferRequest {
  offerSendId?: string;
  to: string;
  subject: string;
  message: string;
  projectName: string;
  pdfUrl?: string;
  tracking_status?: string;
  // Sprint 1: dual-token + reply-to + branding
  publicToken?: string;
  acceptToken?: string;
  replyTo?: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // Create client for rate limiting
  const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  try {
    // Validate all required email delivery configuration up-front.
    // Uses pure checkEmailDeliveryConfig() so logic is testable without Deno.env mocks.
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL");
    const frontendUrl = Deno.env.get("FRONTEND_URL");

    const configCheck = checkEmailDeliveryConfig({ resendApiKey, senderEmail, frontendUrl });

    if (!configCheck.valid) {
      console.error(`[send-offer-email] Email config invalid: ${configCheck.error}`);
      return new Response(
        JSON.stringify({
          error: "Email delivery is not properly configured",
          details: configCheck.error,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (configCheck.warnings?.length) {
      configCheck.warnings.forEach(w => console.warn(`[send-offer-email] Config warning: ${w}`));
    }

    // Parse and validate request body
    let body: SendOfferRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { to, subject, message, projectName, pdfUrl, offerSendId, tracking_status,
            publicToken, acceptToken, replyTo, companyName } = body;

    // Validate all inputs
    const validation = combineValidations(
      validateEmail(to),
      validateString(subject, 'subject', { maxLength: 200 }),
      validateString(message, 'message', { maxLength: 10000 }),
      validateString(projectName, 'projectName', { maxLength: 200 })
    );

    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // JWT authentication required
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !supabase) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'send-offer-email',
        supabase
      );
      
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

    console.log(`[send-offer-email] Sending offer email to: ${to.substring(0, 3)}***@***, subject: ${subject.substring(0, 30)}...`);

    // Create dependencies for email handler
    const deps: EmailDeps = {
      // Resend API call with timeout
      sendEmail: async ({ to: emailTo, subject: emailSubject, html, replyTo: emailReplyTo }) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const emailPayload: Record<string, unknown> = {
            from: `Majster.AI <${senderEmail}>`,
            to: [emailTo],
            subject: emailSubject,
            html,
          };
          // Reply-To only set when contact_email is verified
          if (emailReplyTo) {
            emailPayload.reply_to = emailReplyTo;
          }
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const responseData = await resendResponse.json();

          if (!resendResponse.ok) {
            throw new Error(responseData.message || "Email service error");
          }

          return { id: responseData.id };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error("Email service timeout");
          }
          throw fetchError;
        }
      },

      // Database update (optional)
      updateOfferSend: supabase ? async ({ offerSendId, pdfUrl, tracking_status }) => {
        const updateData: Record<string, string> = {
          tracking_status,
        };

        if (pdfUrl) {
          updateData.pdf_url = pdfUrl;
          updateData.pdf_generated_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('offer_sends')
          .update(updateData)
          .eq('id', offerSendId);

        if (updateError) {
          throw updateError;
        }
      } : undefined,
    };

    // Prepare payload (Sprint 1: include dual-token + Reply-To fields)
    const payload: SendOfferPayload = {
      to,
      subject,
      message,
      projectName,
      pdfUrl,
      offerSendId,
      tracking_status,
      publicToken,
      acceptToken,
      replyTo,
      companyName,
      frontendUrl: frontendUrl ?? undefined,
    };

    // Call handler with dependencies
    const result = await handleSendOfferEmail(payload, deps);

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: result.error || "Failed to send email"
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Trigger 5: "Offer sent" notification — best-effort, no failure if lookup fails
    if (supabase && offerSendId) {
      try {
        const { data: sendRow } = await supabase
          .from('offer_sends')
          .select('project_id')
          .eq('id', offerSendId)
          .single();
        if (sendRow?.project_id) {
          const { data: approval } = await supabase
            .from('offer_approvals')
            .select('user_id')
            .eq('project_id', sendRow.project_id)
            .maybeSingle();
          if (approval?.user_id) {
            await supabase.from('notifications').insert({
              user_id: approval.user_id,
              title: '📤 Oferta wysłana',
              message: `Oferta do projektu "${projectName}" została wysłana na adres email klienta.`,
              type: 'info',
              action_url: `/app/projects/${sendRow.project_id}`,
            });
          }
        }
      } catch (notifErr) {
        console.warn('[send-offer-email] Could not send notification:', notifErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: result.emailId,
        warning: result.warning
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: unknown) {
    console.error("[send-offer-email] Error in send-offer-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
