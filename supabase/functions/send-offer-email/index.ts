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
  sanitizeString
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";

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

    const { to, subject, message, projectName } = body;

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

    // Sanitize inputs for HTML
    const safeProjectName = sanitizeString(projectName);
    const safeMessage = message.replace(/\n/g, '<br>');

    // Format HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 30px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              background: #f9fafb;
              padding: 25px;
              border-radius: 8px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .project-badge {
              display: inline-block;
              background: #dbeafe;
              color: #1d4ed8;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Majster.AI</h1>
            <span class="project-badge">${safeProjectName}</span>
          </div>
          <div class="content">
            ${safeMessage}
          </div>
          <div class="footer">
            <p>Ta wiadomość została wysłana przez Majster.AI</p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API with timeout
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
          to: [to.trim()],
          subject: subject.trim(),
          html: htmlContent,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error("Resend API error:", responseData);
        return new Response(
          JSON.stringify({ 
            error: "Failed to send email",
            details: responseData.message || "Email service error"
          }),
          { 
            status: 502, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }

      console.log("Email sent successfully:", responseData.id);

      return new Response(
        JSON.stringify({ success: true, id: responseData.id }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Resend API timeout");
        return new Response(
          JSON.stringify({ error: "Email service timeout" }),
          { status: 504, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      throw fetchError;
    }

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
