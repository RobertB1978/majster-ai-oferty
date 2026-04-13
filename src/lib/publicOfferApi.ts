/**
 * LEGACY FLOW SERVICE — ARCH-01
 *
 * Public offer data access for the LEGACY flow (offer_approvals table).
 * Used by: OfferPublicPage (/oferta/:token) and OfferApproval (/offer/:token).
 *
 * ⚠️  Do NOT add new business logic here.
 *     New features must go to the CANONICAL flow (acceptance_links + /a/:token).
 *     This service is kept for backwards compatibility with existing sent links.
 *     Consolidation planned for PR-ARCH-02.
 *
 * SEC-01: Direct anon table access (RLS method) replaced with SECURITY DEFINER
 * RPC calls.  The previous approach used a broken RLS policy that allowed any
 * anonymous client to enumerate ALL pending offers without a valid token.
 *
 * Access model (after SEC-01):
 *   - fetchPublicOffer   → supabase.rpc('get_offer_approval_by_token')
 *   - recordOfferViewed  → supabase.rpc('record_offer_viewed_by_token')
 *
 * Both functions are SECURITY DEFINER and perform exact token-based lookups.
 * They return only the minimal fields needed for the public offer page.
 */

import { supabase } from '@/integrations/supabase/client';

export interface PublicOfferPosition {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

export interface PublicOfferData {
  id: string;
  status: string;
  client_name: string | null;
  created_at: string;
  valid_until: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  approved_at: string | null;
  accepted_via: string | null;
  withdrawn_at: string | null;
  project: { project_name: string } | null;
  quote: { total: number; positions: PublicOfferPosition[] } | null;
  company: {
    company_name: string | null;
    phone: string | null;
    contact_email: string | null;
  } | null;
}

/**
 * Fetch a public offer by its public_token via SECURITY DEFINER RPC.
 *
 * SEC-01: Replaces the broken anon SELECT policy (which allowed enumeration
 * of all pending offers) with a controlled DB function that performs an exact
 * token match and returns only safe display fields.
 *
 * @throws Error with message 'not_found' when token is missing or invalid.
 * @throws Error with message 'expired' when the link or offer has expired.
 */
export async function fetchPublicOffer(token: string): Promise<PublicOfferData> {
  const { data: raw, error } = await supabase.rpc('get_offer_approval_by_token', {
    p_token: token,
  });

  if (error) throw error;

  // The RPC returns {error: 'not_found'} / {error: 'expired'} on failure,
  // or the full offer object on success.
  const result = raw as { error?: string } | PublicOfferData;
  if (!result || (typeof result === 'object' && 'error' in result)) {
    throw new Error((result as { error: string }).error ?? 'not_found');
  }
  return result as PublicOfferData;
}

/**
 * Record that a client opened the public offer page.
 * Sets viewed_at and transitions status to 'viewed' — only on first open.
 * Fire-and-forget: caller should not await this; failures are silent.
 */
export async function recordOfferViewed(token: string): Promise<void> {
  // SEC-01: Replaces direct anon UPDATE on offer_approvals with controlled RPC.
  await supabase.rpc('record_offer_viewed_by_token', { p_token: token });
  // Errors are intentionally ignored: tracking must never break the offer page.
}

/**
 * Accept a public offer via the approve-offer edge function.
 * Uses web_button flow (no accept_token required).
 */
export async function acceptPublicOffer(
  token: string,
  clientName: string,
  signatureData: string,
  clientEmail?: string,
): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const response = await fetch(`${baseUrl}/functions/v1/approve-offer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      action: 'approve',
      clientName,
      clientEmail: clientEmail ?? null,
      signatureData,
      accepted_via: 'web_button',
    }),
  });

  const result = await response.json() as { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? 'Nie udało się zaakceptować oferty');
  }
}

/**
 * Send a client question to the contractor via the client-question edge function.
 * Question is saved as an in-app notification for the contractor.
 */
export async function sendClientQuestion(
  token: string,
  questionText: string,
): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const response = await fetch(`${baseUrl}/functions/v1/client-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, questionText }),
  });

  const result = await response.json() as { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? 'Nie udało się wysłać pytania');
  }
}
