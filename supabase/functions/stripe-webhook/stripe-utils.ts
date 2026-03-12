// ============================================================================
// stripe-utils.ts — Pure helper functions for the Stripe webhook handler.
//
// These functions contain NO Deno / ESM-URL imports so they can be
// unit-tested with Vitest (jsdom) without a Deno runtime.
// ============================================================================

/**
 * Map a Stripe subscription status string to our internal status.
 *
 * SECURITY CONTRACT
 * -----------------
 * Any status that is NOT explicitly recognised MUST map to "inactive"
 * (least-privilege). This prevents a future/unknown Stripe status from
 * accidentally granting entitlements.
 *
 * Entitlement-granting statuses (must match plan_limits query):
 *   "active" | "trial"
 *
 * Non-entitlement statuses:
 *   "cancelled" | "expired" | "inactive"
 */
export function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trial";
    case "canceled":   // Stripe uses American spelling
    case "unpaid":
      return "cancelled";
    case "past_due":
    case "incomplete_expired":
      return "expired";
    // "incomplete", "paused", or any future/unknown Stripe status:
    default:
      // SECURITY: unknown status → least privilege (no entitlements granted)
      return "inactive";
  }
}

/**
 * Returns true only for statuses that should grant paid-plan access.
 * Mirrors the SQL:  us.status IN ('active', 'trial')
 */
export function isEntitledStatus(status: string): boolean {
  return status === "active" || status === "trial";
}

/**
 * Parse and validate the STRIPE_PRICE_PLAN_MAP environment variable.
 *
 * Expected format (JSON string passed as Supabase secret):
 *   {"price_1AbcXyz123": "pro", "price_1DefUvw456": "starter"}
 *
 * Keys   — real Stripe Price IDs (format: price_<14+ alphanumeric chars>)
 * Values — internal plan name strings ("pro", "starter", "business", "enterprise")
 *
 * Throws a descriptive Error if:
 *   - rawEnv is undefined or empty (env var not configured)
 *   - rawEnv is not valid JSON
 *   - rawEnv is not a JSON object (e.g. array, string, number)
 *   - any value in the map is not a string
 *
 * Returns an empty map {} without throwing when the map is configured but has
 * no entries — this allows operators to set the var before adding price IDs.
 * Callers should treat an unmapped price ID as a warning, not a fatal error.
 */
export function buildPriceToPlanMap(rawEnv: string | undefined): Record<string, string> {
  if (!rawEnv || rawEnv.trim() === "") {
    throw new Error(
      "STRIPE_PRICE_PLAN_MAP is not configured. " +
      "Add this Supabase secret with a JSON object mapping real Stripe Price IDs to plan names. " +
      'Example: {"price_1AbcXyz123": "pro", "price_1DefUvw456": "starter", "price_1GhiJkl789": "business"}'
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawEnv);
  } catch {
    throw new Error(
      "STRIPE_PRICE_PLAN_MAP contains invalid JSON. " +
      'Expected a JSON object like {"price_1xxx": "pro"}. ' +
      `Value starts with: ${rawEnv.slice(0, 80)}`
    );
  }

  if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
    throw new Error(
      `STRIPE_PRICE_PLAN_MAP must be a JSON object, got ${Array.isArray(parsed) ? "array" : typeof parsed}. ` +
      'Expected: {"price_1xxx": "pro", "price_1yyy": "starter"}'
    );
  }

  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string") {
      throw new Error(
        `STRIPE_PRICE_PLAN_MAP: value for key "${key}" must be a string (plan name e.g. "pro"), ` +
        `got ${typeof value}`
      );
    }
  }

  return parsed as Record<string, string>;
}
