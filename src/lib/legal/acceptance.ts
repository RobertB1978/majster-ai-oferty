import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'majster_pending_legal_acceptances';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 h

export interface SignupLegalDoc {
  id: string;
  slug: string;
  version: string;
  title: string;
}

export interface PendingLegalAcceptance {
  document_id: string;
  slug: string;
  version: string;
  /** ISO timestamp recorded at the moment the user checked the box — legally relevant. */
  accepted_at: string;
  user_agent: string;
  acceptance_source: 'signup';
}

interface PendingStore {
  items: PendingLegalAcceptance[];
  expires_at: number; // epoch ms
}

/**
 * Fetches the currently published Terms of Service and Privacy Policy documents.
 * Uses the canonical Polish (pl) version — the only language seeded in the DB.
 *
 * anon users can read published legal_documents per the RLS policy:
 *   USING (status = 'published')  — no role restriction.
 *
 * Throws on DB error so the caller can show an explicit error to the user.
 */
export async function fetchSignupRequiredDocs(): Promise<SignupLegalDoc[]> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('id, slug, version, title')
    .eq('status', 'published')
    .eq('language', 'pl')
    .in('slug', ['terms', 'privacy']);

  if (error) throw error;
  return (data ?? []) as SignupLegalDoc[];
}

/**
 * Persists pending legal acceptances to localStorage so they survive the
 * email-confirmation redirect. The acceptance timestamp is recorded NOW
 * (at checkbox submission time) — this is the legally relevant moment.
 *
 * TTL: 24 h. Expired records are discarded automatically on next read.
 */
export function storePendingAcceptances(docs: SignupLegalDoc[]): void {
  const store: PendingStore = {
    items: docs.map(doc => ({
      document_id: doc.id,
      slug: doc.slug,
      version: doc.version,
      accepted_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      acceptance_source: 'signup',
    })),
    expires_at: Date.now() + TTL_MS,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (Private Browsing quota, etc.) — silently skip.
  }
}

export function getPendingAcceptances(): PendingLegalAcceptance[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const store: PendingStore = JSON.parse(raw) as PendingStore;
    if (Date.now() > store.expires_at) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return store.items;
  } catch {
    return null;
  }
}

export function clearPendingAcceptances(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Writes pending legal acceptances from localStorage to the database.
 * MUST only be called when the user has an authenticated session.
 *
 * ip_hash is intentionally null:
 *   The browser does not have reliable access to the real IP address
 *   (NAT, proxies, and CDNs would all return incorrect values).
 *   accepted_at + user_agent + legal_document_id (versioned, immutable) provide
 *   sufficient evidence for the acceptance chain under RODO art. 7(1).
 *   Future: an Edge Function triggered post-confirmation could backfill ip_hash.
 */
export async function writePendingAcceptances(userId: string): Promise<void> {
  const pending = getPendingAcceptances();
  if (!pending || pending.length === 0) return;

  const rows = pending.map(p => ({
    user_id: userId,
    legal_document_id: p.document_id,
    accepted_at: p.accepted_at,
    acceptance_source: p.acceptance_source,
    user_agent: p.user_agent,
    ip_hash: null,
  }));

  const { error } = await supabase.from('legal_acceptances').insert(rows);

  if (error) {
    // Do not throw — never block the user's session due to evidence write failure.
    // The failure is logged for monitoring; a retry mechanism is out of scope for PR-L2.
    console.error('[legal] Failed to persist acceptances:', error.message);
    return;
  }

  clearPendingAcceptances();
}
