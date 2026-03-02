/**
 * useDocumentInstances — PR-17
 *
 * TanStack Query hooks for document_instances table.
 * RLS enforced server-side (user_id = auth.uid()).
 *
 * Auto-fill: pulls data from profiles/clients/offers/v2_projects.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import type { AutofillSource, DocumentTemplate } from '@/data/documentTemplates';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentInstance {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  offer_id: string | null;
  template_key: string;
  template_version: string;
  locale: 'pl' | 'en' | 'uk';
  title: string | null;
  data_json: Record<string, string>;
  references_json: Array<{ text: string; url?: string }>;
  pdf_path: string | null;
  dossier_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInstanceInput {
  template: DocumentTemplate;
  locale?: 'pl' | 'en' | 'uk';
  projectId?: string | null;
  clientId?: string | null;
  offerId?: string | null;
  title?: string;
  dataJson: Record<string, string>;
}

export interface UpdateInstanceInput {
  id: string;
  dataJson?: Record<string, string>;
  title?: string;
  pdfPath?: string;
  dossierItemId?: string;
}

// ── Auto-fill context ─────────────────────────────────────────────────────────

export interface AutofillContext {
  company?: {
    name?: string;
    nip?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  client?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  offer?: {
    number?: string;
    total_gross?: string;
    title?: string;
  };
  project?: {
    title?: string;
    address?: string;
  };
}

export function resolveAutofill(source: AutofillSource, ctx: AutofillContext): string {
  if (source === 'current.date') {
    return new Date().toISOString().slice(0, 10);
  }
  const [domain, field] = source.split('.') as [keyof AutofillContext, string];
  const domainData = ctx[domain] as Record<string, string | undefined> | undefined;
  return domainData?.[field] ?? '';
}

// ── useAutofillContext ────────────────────────────────────────────────────────

export function useAutofillContext(opts: {
  projectId?: string | null;
  clientId?: string | null;
  offerId?: string | null;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['autofillContext', user?.id, opts.projectId, opts.clientId, opts.offerId],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<AutofillContext> => {
      const ctx: AutofillContext = {};

      // Company / profile
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, nip, street, postal_code, city, phone, email_for_offers')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const addrParts = [
            profile.street,
            profile.postal_code,
            profile.city,
          ].filter(Boolean);
          ctx.company = {
            name: profile.company_name ?? undefined,
            nip: profile.nip ?? undefined,
            address: addrParts.join(', ') || undefined,
            phone: profile.phone ?? undefined,
            email: profile.email_for_offers ?? undefined,
          };
        }
      }

      // Client
      if (opts.clientId) {
        const { data: client } = await supabase
          .from('clients')
          .select('name, address, phone, email')
          .eq('id', opts.clientId)
          .maybeSingle();

        if (client) {
          ctx.client = {
            name: client.name ?? undefined,
            address: client.address ?? undefined,
            phone: client.phone ?? undefined,
            email: client.email ?? undefined,
          };
        }
      }

      // Offer
      if (opts.offerId) {
        const { data: offer } = await supabase
          .from('offers')
          .select('title, total_gross')
          .eq('id', opts.offerId)
          .maybeSingle();

        if (offer) {
          const year = new Date().getFullYear();
          const suffix = opts.offerId.replace(/-/g, '').slice(0, 6).toUpperCase();
          ctx.offer = {
            title: offer.title ?? undefined,
            total_gross: offer.total_gross != null ? String(offer.total_gross) : undefined,
            number: `OF/${year}/${suffix}`,
          };
        }
      }

      // Project
      if (opts.projectId) {
        const { data: project } = await supabase
          .from('v2_projects')
          .select('title, address')
          .eq('id', opts.projectId)
          .maybeSingle();

        if (project) {
          ctx.project = {
            title: project.title ?? undefined,
            address: project.address ?? undefined,
          };
        }
      }

      return ctx;
    },
  });
}

// ── useDocumentInstances ──────────────────────────────────────────────────────

export function useDocumentInstances(projectId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['document_instances', user?.id, projectId],
    enabled: !!user,
    queryFn: async (): Promise<DocumentInstance[]> => {
      let q = supabase
        .from('document_instances')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        q = q.eq('project_id', projectId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DocumentInstance[];
    },
  });
}

// ── useDocumentInstance ───────────────────────────────────────────────────────

export function useDocumentInstance(id: string | undefined) {
  return useQuery({
    queryKey: ['document_instance', id],
    enabled: !!id,
    queryFn: async (): Promise<DocumentInstance | null> => {
      const { data, error } = await supabase
        .from('document_instances')
        .select('*')
        .eq('id', id!)
        .maybeSingle();

      if (error) throw error;
      return data as DocumentInstance | null;
    },
  });
}

// ── useCreateDocumentInstance ─────────────────────────────────────────────────

export function useCreateDocumentInstance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInstanceInput): Promise<DocumentInstance> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('document_instances')
        .insert({
          user_id: user.id,
          project_id: input.projectId ?? null,
          client_id: input.clientId ?? null,
          offer_id: input.offerId ?? null,
          template_key: input.template.key,
          template_version: input.template.version,
          locale: input.locale ?? 'pl',
          title: input.title ?? null,
          data_json: input.dataJson,
          references_json: input.template.references,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as DocumentInstance;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      if (vars.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['document_instances', undefined, vars.projectId],
        });
      }
    },
  });
}

// ── useUpdateDocumentInstance ─────────────────────────────────────────────────

export function useUpdateDocumentInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInstanceInput): Promise<DocumentInstance> => {
      const updatePayload: Record<string, unknown> = {};
      if (input.dataJson !== undefined) updatePayload.data_json = input.dataJson;
      if (input.title !== undefined) updatePayload.title = input.title;
      if (input.pdfPath !== undefined) updatePayload.pdf_path = input.pdfPath;
      if (input.dossierItemId !== undefined) updatePayload.dossier_item_id = input.dossierItemId;

      const { data, error } = await supabase
        .from('document_instances')
        .update(updatePayload)
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) throw error;
      return data as DocumentInstance;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      queryClient.invalidateQueries({ queryKey: ['document_instance', data.id] });
    },
  });
}

// ── useDeleteDocumentInstance ─────────────────────────────────────────────────

export function useDeleteDocumentInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pdfPath }: { id: string; pdfPath?: string | null }) => {
      const { error } = await supabase
        .from('document_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Best-effort storage cleanup
      if (pdfPath) {
        const { error: storageErr } = await supabase.storage
          .from('dossier')
          .remove([pdfPath]);
        if (storageErr) {
          logger.warn('[DocInstances] storage delete failed (orphan)', storageErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
    },
  });
}
