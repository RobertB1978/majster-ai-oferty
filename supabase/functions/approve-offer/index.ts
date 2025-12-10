// ============================================
// APPROVE OFFER - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateUUID,
  validateString,
  createValidationErrorResponse
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { sanitizeUserInput } from "../_shared/sanitization.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request body
    let body: { token?: unknown; action?: unknown; signatureData?: unknown; comment?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token, action, signatureData, comment } = body;
    
    // Validate token
    const tokenValidation = validateUUID(token, 'token');
    if (!tokenValidation.valid) {
      return createValidationErrorResponse(tokenValidation.errors, corsHeaders);
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      getIdentifier(req),
      'approve-offer',
      supabase
    );
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Get offer approval by token
    const { data: approval, error: fetchError } = await supabase
      .from('offer_approvals')
      .select('id, project_id, user_id, status, public_token, expires_at')
      .eq('public_token', token)
      .single();

    if (fetchError || !approval) {
      console.warn('Offer not found for token');
      return new Response(JSON.stringify({ error: "Offer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token has expired
    if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
      console.log(`Offer ${approval.id} token expired at ${approval.expires_at}`);
      return new Response(JSON.stringify({ 
        error: "Link do akceptacji wygasł. Skontaktuj się z wykonawcą w celu uzyskania nowego linku." 
      }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === 'GET') {
      // Return offer details for viewing (only if pending)
      if (approval.status !== 'pending') {
        return new Response(JSON.stringify({ error: "Offer already processed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: quote } = await supabase
        .from('quotes')
        .select('id, total, margin_percent, summary_labor, summary_materials, positions')
        .eq('project_id', approval.project_id)
        .single();

      const { data: project } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('id', approval.project_id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, owner_name, phone, email_for_offers, street, city, postal_code, logo_url')
        .eq('user_id', approval.user_id)
        .single();

      return new Response(JSON.stringify({ 
        approval: { id: approval.id, status: approval.status },
        quote,
        project,
        company: profile
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === 'POST') {
      // Validate action
      const actionValidation = validateString(action, 'action', { maxLength: 20 });
      if (!actionValidation.valid) {
        return createValidationErrorResponse(actionValidation.errors, corsHeaders);
      }

      if (action !== 'approve' && action !== 'reject') {
        return new Response(JSON.stringify({ error: "Invalid action. Must be 'approve' or 'reject'" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (approval.status !== 'pending') {
        return new Response(JSON.stringify({ error: "Offer already processed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Sanitize and validate optional fields
      const safeComment = comment ? sanitizeUserInput(String(comment), 1000) : null;
      const safeSignature = signatureData ? String(signatureData).substring(0, 50000) : null; // Base64 signature

      const updateData: Record<string, unknown> = {
        status: action === 'approve' ? 'approved' : 'rejected',
        client_comment: safeComment,
      };

      if (action === 'approve') {
        updateData.signature_data = safeSignature;
        updateData.approved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('offer_approvals')
        .update(updateData)
        .eq('id', approval.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Update project status
      if (action === 'approve') {
        await supabase
          .from('projects')
          .update({ status: 'Zaakceptowany' })
          .eq('id', approval.project_id);
      }

      // Create notification for owner
      await supabase
        .from('notifications')
        .insert({
          user_id: approval.user_id,
          title: action === 'approve' ? 'Oferta zaakceptowana!' : 'Oferta odrzucona',
          message: `Klient ${action === 'approve' ? 'zaakceptował' : 'odrzucił'} ofertę.${safeComment ? ` Komentarz: ${safeComment.substring(0, 100)}` : ''}`,
          type: action === 'approve' ? 'success' : 'warning',
          action_url: `/projects/${approval.project_id}`
        });

      console.log(`[approve-offer] Offer ${approval.id} ${action}d successfully by token ${token}`);
      console.log(`[approve-offer] Project ${approval.project_id} status updated`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Approve offer error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
