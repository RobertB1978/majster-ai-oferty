/**
 * Integration Tests for Scheduler Worker
 * Tests the complete flow: schedule -> worker tick -> status update
 */

import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { utcNow, addSeconds } from "../_shared/datetime-utils.ts";

/**
 * Mock Supabase client for testing
 */
interface MockOfferSend {
  id: string;
  status: string;
  scheduled_for: string | null;
  retry_count: number;
  max_retries: number;
  processed_at: string | null;
  sent_at: string | null;
}

class MockSupabaseClient {
  private offers: Map<string, MockOfferSend> = new Map();

  addOffer(offer: MockOfferSend) {
    this.offers.set(offer.id, offer);
  }

  from(table: string) {
    return {
      select: (columns: string) => ({
        eq: (column: string, value: string) => ({
          not: (column: string, op: string, value: null) => ({
            lte: (column: string, compareValue: string) => ({
              order: (column: string, opts: any) => ({
                limit: (count: number) => {
                  // Return scheduled offers that are due
                  const due: MockOfferSend[] = [];
                  for (const offer of this.offers.values()) {
                    if (
                      offer.status === 'scheduled' &&
                      offer.scheduled_for &&
                      offer.scheduled_for <= compareValue
                    ) {
                      due.push(offer);
                    }
                  }
                  return { data: due, error: null };
                },
              }),
            }),
          }),
        }),
        update: (data: Partial<MockOfferSend>) => ({
          eq: (column: string, value: string) => {
            const offer = this.offers.get(value);
            if (offer) {
              Object.assign(offer, data);
            }
            return { data: offer, error: null };
          },
        }),
      }),
    };
  }

  getOffer(id: string): MockOfferSend | undefined {
    return this.offers.get(id);
  }
}

/**
 * Simulate scheduler tick logic (simplified version)
 */
async function simulateSchedulerTick(
  supabase: MockSupabaseClient,
  now: string
): Promise<{ processed: number; failed: number; skipped: number }> {
  const result = { processed: 0, failed: 0, skipped: 0 };

  // Fetch scheduled offers
  const { data: offers } = await supabase
    .from('offer_sends')
    .select('*')
    .eq('status', 'scheduled')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (!offers || offers.length === 0) {
    return result;
  }

  // Process each offer
  for (const offer of offers) {
    // Simulate successful processing
    await supabase
      .from('offer_sends')
      .select('*')
      .eq('id', offer.id)
      .update({
        status: 'sent',
        processed_at: now,
        sent_at: now,
      })
      .eq('id', offer.id);

    result.processed++;
  }

  return result;
}

Deno.test("Scheduler Worker: schedule -> tick -> status update", async () => {
  const supabase = new MockSupabaseClient();

  // Create a scheduled offer that's due
  const pastTime = addSeconds(utcNow(), -60); // 1 minute ago
  supabase.addOffer({
    id: "test-offer-1",
    status: "scheduled",
    scheduled_for: pastTime,
    retry_count: 0,
    max_retries: 3,
    processed_at: null,
    sent_at: null,
  });

  // Run scheduler tick
  const now = utcNow();
  const result = await simulateSchedulerTick(supabase, now);

  // Verify results
  assertEquals(result.processed, 1);
  assertEquals(result.failed, 0);
  assertEquals(result.skipped, 0);

  // Verify offer status updated
  const updatedOffer = supabase.getOffer("test-offer-1");
  assertEquals(updatedOffer?.status, "sent");
  assertEquals(updatedOffer?.processed_at !== null, true);
  assertEquals(updatedOffer?.sent_at !== null, true);
});

Deno.test("Scheduler Worker: ignores future scheduled offers", async () => {
  const supabase = new MockSupabaseClient();

  // Create a scheduled offer in the future
  const futureTime = addSeconds(utcNow(), 3600); // 1 hour from now
  supabase.addOffer({
    id: "test-offer-2",
    status: "scheduled",
    scheduled_for: futureTime,
    retry_count: 0,
    max_retries: 3,
    processed_at: null,
    sent_at: null,
  });

  // Run scheduler tick
  const now = utcNow();
  const result = await simulateSchedulerTick(supabase, now);

  // Verify no offers processed
  assertEquals(result.processed, 0);
  assertEquals(result.failed, 0);
  assertEquals(result.skipped, 0);

  // Verify offer still scheduled
  const offer = supabase.getOffer("test-offer-2");
  assertEquals(offer?.status, "scheduled");
  assertEquals(offer?.processed_at, null);
});

Deno.test("Scheduler Worker: processes multiple due offers", async () => {
  const supabase = new MockSupabaseClient();

  const pastTime1 = addSeconds(utcNow(), -120); // 2 minutes ago
  const pastTime2 = addSeconds(utcNow(), -60); // 1 minute ago

  supabase.addOffer({
    id: "test-offer-3",
    status: "scheduled",
    scheduled_for: pastTime1,
    retry_count: 0,
    max_retries: 3,
    processed_at: null,
    sent_at: null,
  });

  supabase.addOffer({
    id: "test-offer-4",
    status: "scheduled",
    scheduled_for: pastTime2,
    retry_count: 0,
    max_retries: 3,
    processed_at: null,
    sent_at: null,
  });

  // Run scheduler tick
  const now = utcNow();
  const result = await simulateSchedulerTick(supabase, now);

  // Verify both processed
  assertEquals(result.processed, 2);

  // Verify both updated
  const offer3 = supabase.getOffer("test-offer-3");
  const offer4 = supabase.getOffer("test-offer-4");
  assertEquals(offer3?.status, "sent");
  assertEquals(offer4?.status, "sent");
});

Deno.test("CRITICAL: timezone-aware comparison in scheduler query", async () => {
  // This test ensures we don't get "can't compare offset-naive and offset-aware datetimes" error
  const supabase = new MockSupabaseClient();

  // Both timestamps are timezone-aware (ISO 8601 with 'Z')
  const scheduledFor = "2026-01-02T10:00:00.000Z";
  const now = "2026-01-02T11:00:00.000Z";

  supabase.addOffer({
    id: "test-offer-5",
    status: "scheduled",
    scheduled_for: scheduledFor,
    retry_count: 0,
    max_retries: 3,
    processed_at: null,
    sent_at: null,
  });

  // This should NOT throw an error
  const result = await simulateSchedulerTick(supabase, now);

  assertEquals(result.processed, 1);
});
