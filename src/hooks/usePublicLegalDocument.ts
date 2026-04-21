import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegalDocument, LegalDocumentSlug } from '@/types/legal';

export interface PublicLegalDocumentResult {
  doc: LegalDocument | null;
  isLoading: boolean;
  /** true when DB fetch failed or returned nothing — caller should use i18n fallback */
  isFallback: boolean;
  /** DB effective_at formatted for locale, or null if not available */
  effectiveDate: string | null;
}

/**
 * Fetches the currently published legal document for a given slug and language.
 *
 * Primary source of truth: legal_documents WHERE status='published' AND slug=X AND language=Y.
 * The table has a public SELECT RLS policy for published rows, so no auth required.
 *
 * isFallback=true means the caller should use static/i18n content instead.
 * No error is thrown — the hook is designed to be graceful so public pages never crash.
 */
export function usePublicLegalDocument(
  slug: LegalDocumentSlug,
  language: string
): PublicLegalDocumentResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-legal-document', slug, language],
    queryFn: async (): Promise<LegalDocument | null> => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('slug', slug)
        .eq('language', language)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as LegalDocument | null;
    },
    staleTime: 5 * 60 * 1000,
    // retry defaults to QueryClient config (retry: false in tests, 3 in prod)
  });

  const doc = isError ? null : (data ?? null);
  const isFallback = isError || (!isLoading && !doc);

  let effectiveDate: string | null = null;
  if (doc?.effective_at) {
    try {
      const localeStr =
        language === 'pl' ? 'pl-PL' :
        language === 'uk' ? 'uk-UA' :
        'en-GB';
      effectiveDate = new Date(doc.effective_at).toLocaleDateString(localeStr);
    } catch {
      effectiveDate = doc.effective_at.slice(0, 10);
    }
  }

  return { doc, isLoading, isFallback, effectiveDate };
}
