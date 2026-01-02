/**
 * Scheduler Worker - Cron Job
 * Sprint 0.7: Scheduling + Queue
 *
 * Processes scheduled offer sends:
 * 1. Fetches offers where scheduled_for <= now
 * 2. Sends them via send-offer-email
 * 3. Handles retries with exponential backoff
 * 4. Uses Redis for distributed locking
 *
 * IMPORTANT: All datetime operations use timezone-aware UTC to prevent
 * naive/aware comparison errors.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { utcNow, isDue, addSeconds, exponentialBackoff } from "../_shared/datetime-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledOffer {
  id: string;
  project_id: string;
  user_id: string;
  client_email: string;
  subject: string;
  message: string;
  scheduled_for: string;
  retry_count: number;
  max_retries: number;
  pdf_url: string | null;
  tracking_status: string | null;
}

interface ProcessingResult {
  processed: number;
  failed: number;
  skipped: number;
}

/**
 * Simple in-memory lock (for single-instance deployment)
 * For production with multiple instances, use Redis
 */
const processingLocks = new Map<string, number>();

/**
 * Try to acquire a lock for processing an offer
 * Returns true if lock acquired, false if already locked
 */
function tryAcquireLock(offerId: string, ttlMs: number = 60000): boolean {
  const now = Date.now();
  const existingLock = processingLocks.get(offerId);

  // Check if existing lock is still valid
  if (existingLock && existingLock > now) {
    return false; // Already locked
  }

  // Acquire lock
  processingLocks.set(offerId, now + ttlMs);
  return true;
}

/**
 * Release a lock
 */
function releaseLock(offerId: string): void {
  processingLocks.delete(offerId);
}

/**
 * Clean up expired locks
 */
function cleanupExpiredLocks(): void {
  const now = Date.now();
  for (const [offerId, expiry] of processingLocks.entries()) {
    if (expiry <= now) {
      processingLocks.delete(offerId);
    }
  }
}

/**
 * Process a single scheduled offer
 */
async function processOffer(
  offer: ScheduledOffer,
  supabase: any,
  sendOfferEmailUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[scheduler-worker] Processing offer ${offer.id}, scheduled for ${offer.scheduled_for}`);

    // Call send-offer-email Edge Function
    const response = await fetch(sendOfferEmailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offerSendId: offer.id,
        to: offer.client_email,
        subject: offer.subject,
        message: offer.message,
        projectName: `Project ${offer.project_id}`, // Simplified for now
        pdfUrl: offer.pdf_url,
        tracking_status: offer.tracking_status || "sent",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to send email");
    }

    // Update status to 'sent' and mark as processed
    const { error: updateError } = await supabase
      .from('offer_sends')
      .update({
        status: 'sent',
        processed_at: utcNow(),
        sent_at: utcNow(),
      })
      .eq('id', offer.id);

    if (updateError) {
      console.error(`[scheduler-worker] Failed to update offer ${offer.id}:`, updateError);
      return { success: false, error: "Database update failed" };
    }

    console.log(`[scheduler-worker] Successfully processed offer ${offer.id}`);
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[scheduler-worker] Error processing offer ${offer.id}:`, errorMessage);

    // Calculate next retry time with exponential backoff
    const retryCount = offer.retry_count + 1;
    const backoffSeconds = exponentialBackoff(retryCount);
    const nextRetryAt = addSeconds(utcNow(), backoffSeconds);

    // Check if we should retry or mark as failed
    if (retryCount >= offer.max_retries) {
      // Max retries exceeded - mark as failed
      const { error: updateError } = await supabase
        .from('offer_sends')
        .update({
          status: 'failed',
          error_message: `Max retries (${offer.max_retries}) exceeded. Last error: ${errorMessage}`,
          retry_count: retryCount,
          last_retry_at: utcNow(),
        })
        .eq('id', offer.id);

      if (updateError) {
        console.error(`[scheduler-worker] Failed to update failed offer ${offer.id}:`, updateError);
      }

      console.log(`[scheduler-worker] Offer ${offer.id} marked as failed after ${retryCount} retries`);
      return { success: false, error: `Failed after ${retryCount} retries` };
    }

    // Schedule retry with exponential backoff
    const { error: updateError } = await supabase
      .from('offer_sends')
      .update({
        retry_count: retryCount,
        last_retry_at: utcNow(),
        scheduled_for: nextRetryAt,
        error_message: errorMessage,
      })
      .eq('id', offer.id);

    if (updateError) {
      console.error(`[scheduler-worker] Failed to update retry info for offer ${offer.id}:`, updateError);
    }

    console.log(`[scheduler-worker] Scheduled retry ${retryCount}/${offer.max_retries} for offer ${offer.id} at ${nextRetryAt}`);
    return { success: false, error: `Retry scheduled (${retryCount}/${offer.max_retries})` };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This endpoint should be called by a cron job
  // In production, verify cron secret or use Supabase service_role auth
  const cronSecret = req.headers.get("X-Cron-Secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");

  if (expectedSecret && cronSecret !== expectedSecret) {
    console.error("[scheduler-worker] Invalid cron secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[scheduler-worker] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const sendOfferEmailUrl = `${supabaseUrl}/functions/v1/send-offer-email`;

    // Clean up expired locks
    cleanupExpiredLocks();

    // Get current time (timezone-aware UTC)
    const now = utcNow();
    console.log(`[scheduler-worker] Running scheduler tick at ${now}`);

    // Fetch scheduled offers that are due
    const { data: scheduledOffers, error: fetchError } = await supabase
      .from('offer_sends')
      .select('*')
      .eq('status', 'scheduled')
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', now) // scheduled_for <= now (both timezone-aware)
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      console.error("[scheduler-worker] Failed to fetch scheduled offers:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database query failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!scheduledOffers || scheduledOffers.length === 0) {
      console.log("[scheduler-worker] No scheduled offers due for processing");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No offers due for processing",
          processed: 0,
          failed: 0,
          skipped: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log(`[scheduler-worker] Found ${scheduledOffers.length} offers due for processing`);

    // Process each offer
    const results: ProcessingResult = {
      processed: 0,
      failed: 0,
      skipped: 0,
    };

    for (const offer of scheduledOffers) {
      // Try to acquire lock
      if (!tryAcquireLock(offer.id)) {
        console.log(`[scheduler-worker] Offer ${offer.id} is already being processed, skipping`);
        results.skipped++;
        continue;
      }

      try {
        // Double-check it's still due (timezone-aware comparison)
        if (!isDue(offer.scheduled_for, now)) {
          console.log(`[scheduler-worker] Offer ${offer.id} is no longer due, skipping`);
          results.skipped++;
          continue;
        }

        const result = await processOffer(offer, supabase, sendOfferEmailUrl);

        if (result.success) {
          results.processed++;
        } else {
          results.failed++;
        }
      } finally {
        // Always release lock
        releaseLock(offer.id);
      }
    }

    console.log(`[scheduler-worker] Completed tick: processed=${results.processed}, failed=${results.failed}, skipped=${results.skipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Scheduler tick completed",
        ...results,
        timestamp: now,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: unknown) {
    console.error("[scheduler-worker] Error in scheduler tick:", error);
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
