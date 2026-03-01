/**
 * Entitlements — single source of truth for free plan limits.
 *
 * ADR: docs/ADR/ADR-0004-free-tier-limit.md
 * PR-06: Free plan limit (3/month) + paywall + retention hook
 *
 * RULES:
 *  - FREE_TIER_OFFER_LIMIT = 3 offers per calendar month
 *  - Counted by status: 'sent' | 'accepted' | 'rejected'  (NOT drafts)
 *  - Resets on the 1st of each calendar month (UTC)
 *  - Drafts are never blocked — user can always create/edit drafts
 *  - CRM and offer history remain accessible even after limit is reached
 */

/** Maximum number of finalized offers a free-plan user can send per calendar month. */
export const FREE_TIER_OFFER_LIMIT = 3;

/** Offer statuses that count against the monthly quota. Drafts are excluded. */
export const FINALIZED_OFFER_STATUSES = ['sent', 'accepted', 'rejected'] as const;

export type FinalizedOfferStatus = typeof FINALIZED_OFFER_STATUSES[number];

/**
 * Returns true if the user is allowed to send/finalize an offer.
 *
 * Pure function — easy to unit-test without any React or Supabase deps.
 *
 * @param plan        - 'free' | 'pro' | 'starter' | 'business' | 'enterprise'
 * @param monthlyUsed - Number of finalized offers sent by this user in the current calendar month
 */
export function canSendOffer(plan: string, monthlyUsed: number): boolean {
  if (plan !== 'free') return true;
  return monthlyUsed < FREE_TIER_OFFER_LIMIT;
}

/**
 * Returns remaining quota for the current month.
 * For paid plans returns Infinity.
 */
export function remainingOfferQuota(plan: string, monthlyUsed: number): number {
  if (plan !== 'free') return Infinity;
  return Math.max(0, FREE_TIER_OFFER_LIMIT - monthlyUsed);
}
