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
