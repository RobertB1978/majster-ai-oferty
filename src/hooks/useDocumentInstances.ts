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
import type { DocumentInstanceModeBFields } from '@/types/document-mode-b';
import { DOSSIER_BUCKET } from '@/lib/storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentInstance extends DocumentInstanceModeBFields {
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
  /** Ścieżka do finalnego PDF w bucket 'dossier'. Reużywana przez Tryb A i Tryb B. */
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
    regon?: string;
    krs?: string;
    representativeName?: string;
    representativeRole?: string;
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
          .select('company_name, legal_form, nip, regon, krs, owner_name, representative_name, representative_role, street, postal_code, city, phone, email_for_offers')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const addrParts = [
            profile.street,
            profile.postal_code,
            profile.city,
          ].filter(Boolean);
          const lf = (profile as Record<string, unknown>).legal_form as string || 'jdg';
          const isJdg = lf === 'jdg';
          const repName = isJdg
            ? ((profile as Record<string, unknown>).owner_name as string | null)
            : ((profile as Record<string, unknown>).representative_name as string | null);
          const repRole = isJdg
            ? 'Właściciel'
            : (((profile as Record<string, unknown>).representative_role as string | null) || 'Prezes Zarządu');
          ctx.company = {
            name: profile.company_name ?? undefined,
            nip: profile.nip ?? undefined,
            regon: ((profile as Record<string, unknown>).regon as string | null) ?? undefined,
            krs: isJdg ? undefined : (((profile as Record<string, unknown>).krs as string | null) ?? undefined),
            representativeName: repName ?? undefined,
            representativeRole: repName ? repRole : undefined,
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
        .select('id, user_id, project_id, client_id, offer_id, template_key, template_version, locale, title, data_json, references_json, pdf_path, dossier_item_id, created_at, updated_at, source_mode, status, master_template_id, master_template_version, file_docx, version_number, edited_at, sent_at')
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
        .select('id, user_id, project_id, client_id, offer_id, template_key, template_version, locale, title, data_json, references_json, pdf_path, dossier_item_id, created_at, updated_at, source_mode, status, master_template_id, master_template_version, file_docx, version_number, edited_at, sent_at')
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
        .select('id, user_id, project_id, client_id, offer_id, template_key, template_version, locale, title, data_json, references_json, pdf_path, dossier_item_id, created_at, updated_at, source_mode, status, master_template_id, master_template_version, file_docx, version_number, edited_at, sent_at')
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
        .select('id, user_id, project_id, client_id, offer_id, template_key, template_version, locale, title, data_json, references_json, pdf_path, dossier_item_id, created_at, updated_at, source_mode, status, master_template_id, master_template_version, file_docx, version_number, edited_at, sent_at')
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
          .from(DOSSIER_BUCKET)
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
