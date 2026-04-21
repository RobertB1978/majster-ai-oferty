import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegalDocument, LegalDraftInput, LegalDocumentGroup, LegalDocumentSlug } from '@/types/legal';

const QUERY_KEY = ['admin', 'legal-documents'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// List all legal documents (admin — all statuses)
// ─────────────────────────────────────────────────────────────────────────────
export function useAdminLegalDocuments() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<LegalDocument[]> => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('slug')
        .order('language')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as LegalDocument[];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Group documents by slug+language for list view
// ─────────────────────────────────────────────────────────────────────────────
export function useAdminLegalDocumentGroups(): {
  groups: LegalDocumentGroup[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useAdminLegalDocuments();

  const groups: LegalDocumentGroup[] = [];

  if (data) {
    const map = new Map<string, LegalDocumentGroup>();

    for (const doc of data) {
      const key = `${doc.slug}:${doc.language}`;
      if (!map.has(key)) {
        map.set(key, {
          slug: doc.slug,
          language: doc.language,
          published: null,
          drafts: [],
          archived: [],
        });
      }
      const group = map.get(key)!;
      if (doc.status === 'published') group.published = doc;
      else if (doc.status === 'draft') group.drafts.push(doc);
      else group.archived.push(doc);
    }

    groups.push(...map.values());
    groups.sort((a, b) =>
      a.slug !== b.slug
        ? a.slug.localeCompare(b.slug)
        : a.language.localeCompare(b.language)
    );
  }

  return { groups, isLoading, error: error as Error | null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch a single document by id
// ─────────────────────────────────────────────────────────────────────────────
export function useAdminLegalDocument(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async (): Promise<LegalDocument | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as LegalDocument;
    },
    enabled: !!id,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Save (insert or update) a draft
// ─────────────────────────────────────────────────────────────────────────────
export function useSaveLegalDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id?: string;
      input: LegalDraftInput;
    }): Promise<LegalDocument> => {
      if (id) {
        const { data, error } = await supabase
          .from('legal_documents')
          .update({
            title: input.title,
            content: input.content,
            version: input.version,
            effective_at: input.effective_at ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('status', 'draft')
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data as LegalDocument;
      } else {
        const { data, error } = await supabase
          .from('legal_documents')
          .insert({
            slug: input.slug,
            language: input.language,
            version: input.version,
            title: input.title,
            content: input.content,
            status: 'draft',
            effective_at: input.effective_at ?? null,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data as LegalDocument;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Publish a draft (atomic: archives current published, promotes draft)
// ─────────────────────────────────────────────────────────────────────────────
export function usePublishLegalDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('publish_legal_document', {
        p_draft_id: draftId,
      });

      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Create a new draft from currently published document
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateDraftFromPublished() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      language,
    }: {
      slug: LegalDocumentSlug;
      language: string;
    }): Promise<string> => {
      const { data, error } = await supabase.rpc(
        'create_legal_draft_from_published',
        { p_slug: slug, p_language: language }
      );

      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
