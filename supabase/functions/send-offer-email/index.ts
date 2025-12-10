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
import { handleSendOfferEmail, type EmailDeps, type SendOfferPayload } from "./emailHandler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOfferRequest {
  offerSendId?: string;
  to: string;
  subject: string;
  message: string;
  projectName: string;
  pdfUrl?: string; // Phase 5C: Optional PDF URL to save in database
  tracking_status?: string; // Phase 7B: Optional tracking status (normalized to 'sent' if invalid/missing)
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // Create client for rate limiting
  const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  try {
    // Check RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "Email service is not configured", 
          details: "Please add RESEND_API_KEY to your secrets" 
        }),
        { 
          status: 503, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
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

    const { to, subject, message, projectName, pdfUrl, offerSendId, tracking_status } = body;

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

    // Rate limiting (by IP since this might be called without auth)
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

    console.log(`Sending offer email to: ${to.substring(0, 3)}***@***, subject: ${subject.substring(0, 30)}...`);

    // Create dependencies for email handler
    const deps: EmailDeps = {
      // Resend API call with timeout
      sendEmail: async ({ to: emailTo, subject: emailSubject, html }) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Majster.AI <onboarding@resend.dev>",
              to: [emailTo],
              subject: emailSubject,
              html,
            }),
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

    // Prepare payload
    const payload: SendOfferPayload = {
      to,
      subject,
      message,
      projectName,
      pdfUrl,
      offerSendId,
      tracking_status,
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
    console.error("Error in send-offer-email function:", error);
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
