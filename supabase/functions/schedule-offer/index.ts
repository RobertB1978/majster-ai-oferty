/**
 * Schedule Offer - POST /schedule-offer
 * Sprint 0.7: Scheduling + Queue
 *
 * Allows scheduling an offer send for a future time.
 * Updates existing offer_sends record with scheduling information.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateString,
  createValidationErrorResponse,
  combineValidations,
} from "../_shared/validation.ts";
import { ensureAwareUTC, utcNow } from "../_shared/datetime-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleOfferRequest {
  offerSendId: string; // ID of existing offer_sends record
  scheduledFor: string; // ISO 8601 datetime string
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Get Supabase client (requires authentication)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[schedule-offer] Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    let body: ScheduleOfferRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { offerSendId, scheduledFor } = body;

    // Validate inputs
    const validation = combineValidations(
      validateString(offerSendId, 'offerSendId', { minLength: 36, maxLength: 36 }),
      validateString(scheduledFor, 'scheduledFor', { minLength: 20, maxLength: 30 })
    );

    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Normalize scheduled time to timezone-aware UTC
    let normalizedScheduledFor: string;
    try {
      normalizedScheduledFor = ensureAwareUTC(scheduledFor)!;
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid scheduledFor datetime",
          details: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify scheduled time is in the future
    const now = utcNow();
    if (new Date(normalizedScheduledFor) <= new Date(now)) {
      return new Response(
        JSON.stringify({
          error: "Scheduled time must be in the future",
          scheduledFor: normalizedScheduledFor,
          currentTime: now
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify offer_send exists and belongs to user
    const { data: offerSend, error: fetchError } = await supabase
      .from('offer_sends')
      .select('id, user_id, status')
      .eq('id', offerSendId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !offerSend) {
      return new Response(
        JSON.stringify({ error: "Offer send not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only allow scheduling for 'pending' or 'scheduled' offers
    if (offerSend.status !== 'pending' && offerSend.status !== 'scheduled') {
      return new Response(
        JSON.stringify({
          error: "Cannot schedule offer with status: " + offerSend.status,
          details: "Only pending or scheduled offers can be rescheduled"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update offer_send with scheduling information
    const { data: updated, error: updateError } = await supabase
      .from('offer_sends')
      .update({
        scheduled_for: normalizedScheduledFor,
        status: 'scheduled',
        retry_count: 0, // Reset retry count when rescheduling
        last_retry_at: null,
        processed_at: null,
      })
      .eq('id', offerSendId)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    if (updateError) {
      console.error("[schedule-offer] Database update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to schedule offer" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[schedule-offer] Scheduled offer ${offerSendId} for ${normalizedScheduledFor}`);

    return new Response(
      JSON.stringify({
        success: true,
        offerSend: updated,
        message: `Offer scheduled for ${normalizedScheduledFor}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: unknown) {
    console.error("[schedule-offer] Error:", error);
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
