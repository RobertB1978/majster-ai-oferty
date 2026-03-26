/**
 * Public offer data access — no authentication required.
 * Fetches offer data using the public_token via anon Supabase client (RLS method A).
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
 * Fetch a public offer by its public_token using the anon Supabase client.
 * RLS policy on offer_approvals must allow SELECT by public_token without auth.
 */
export async function fetchPublicOffer(token: string): Promise<PublicOfferData> {
  const { data, error } = await supabase
    .from('offer_approvals')
    .select(`
      id,
      status,
      client_name,
      created_at,
      valid_until,
      viewed_at,
      accepted_at,
      approved_at,
      accepted_via,
      withdrawn_at,
      project:projects(project_name),
      quote:quotes(total, positions)
    `)
    .eq('public_token', token)
    .single();

  if (error) throw error;
  return data as PublicOfferData;
}

/**
 * Record that a client opened the public offer page.
 * Sets viewed_at and transitions status to 'viewed' — only on first open.
 * Fire-and-forget: caller should not await this; failures are silent.
 * No personal data is stored — only a server-side timestamp.
 */
export async function recordOfferViewed(token: string): Promise<void> {
  await supabase
    .from('offer_approvals')
    .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
    .eq('public_token', token)
    .is('viewed_at', null)
    .in('status', ['sent', 'pending']);
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
