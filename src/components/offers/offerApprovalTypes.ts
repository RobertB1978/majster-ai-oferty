export interface QuotePosition {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

export type OfferStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'expired'
  | 'withdrawn';

export interface OfferData {
  id: string;
  status: OfferStatus;
  client_name: string | null;
  client_email: string | null;
  created_at: string;
  accepted_at?: string | null;
  approved_at?: string | null;
  valid_until?: string | null;
  withdrawn_at?: string | null;
  accepted_via?: string | null;
  project: {
    project_name: string;
    status: string;
  } | null;
  quote: {
    total: number;
    positions: QuotePosition[];
  } | null;
  company?: {
    company_name: string | null;
    owner_name: string | null;
    phone: string | null;
    contact_email?: string | null;
  } | null;
}

/** Returns true when the current time is within 600 seconds of the accepted_at timestamp */
export function canCancel(acceptedAt: string | null | undefined): boolean {
  if (!acceptedAt) return false;
  const diffMs = Date.now() - new Date(acceptedAt).getTime();
  return diffMs < 600_000;
}
