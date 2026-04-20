export type LegalDocumentStatus = 'draft' | 'published' | 'archived';

export type LegalDocumentSlug = 'privacy' | 'terms' | 'cookies' | 'dpa' | 'rodo';

export interface LegalDocument {
  id: string;
  slug: LegalDocumentSlug;
  language: string;
  version: string;
  title: string;
  content: string;
  status: LegalDocumentStatus;
  published_at: string | null;
  effective_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalAcceptance {
  id: string;
  user_id: string;
  legal_document_id: string;
  accepted_at: string;
  acceptance_source: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Subset returned by the frontend for display (no full content). */
export interface LegalDocumentMeta {
  id: string;
  slug: LegalDocumentSlug;
  language: string;
  version: string;
  title: string;
  status: LegalDocumentStatus;
  effective_at: string | null;
}
