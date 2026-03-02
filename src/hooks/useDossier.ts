/**
 * useDossier — PR-16
 *
 * TanStack Query hooks for project_dossier_items and project_dossier_share_tokens.
 * RLS enforced server-side (user_id = auth.uid()).
 *
 * Exports:
 *  - DOSSIER_CATEGORIES       — ordered list of categories
 *  - useDossierItems          — list items for a project (with signed URLs)
 *  - useUploadDossierItem     — upload file to dossier bucket + insert DB row
 *  - useDeleteDossierItem     — delete item (DB + storage)
 *  - useDossierShareTokens    — list share tokens for a project
 *  - useCreateDossierToken    — create share token
 *  - useDeleteDossierToken    — delete share token
 *  - buildDossierShareUrl     — helper to build /d/:token URL
 *  - daysUntilTokenExpiry     — helper: days remaining
 *  - useExportDossierPdf      — export dossier as PDF summary (client-side jspdf)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ── Constants ─────────────────────────────────────────────────────────────────

export type DossierCategory =
  | 'CONTRACT'
  | 'PROTOCOL'
  | 'RECEIPT'
  | 'PHOTO'
  | 'GUARANTEE'
  | 'OTHER';

export const DOSSIER_CATEGORIES: DossierCategory[] = [
  'CONTRACT',
  'PROTOCOL',
  'RECEIPT',
  'PHOTO',
  'GUARANTEE',
  'OTHER',
];

export const DOSSIER_BUCKET = 'dossier';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DossierItem {
  id: string;
  user_id: string;
  project_id: string;
  category: DossierCategory;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  source: 'MANUAL' | 'PHOTO_REPORT' | 'OFFER_PDF' | 'SIGNATURE' | null;
  created_at: string;
  /** Populated client-side via getSignedUrl */
  signed_url?: string;
}

export interface DossierShareToken {
  id: string;
  user_id: string;
  project_id: string;
  token: string;
  expires_at: string;
  allowed_categories: DossierCategory[];
  label: string | null;
  created_at: string;
}

export interface CreateDossierTokenInput {
  project_id: string;
  allowed_categories: DossierCategory[];
  label?: string;
  expires_days?: number; // default 30
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOSSIER_BUCKET)
    .createSignedUrl(filePath, 3600); // 1 hour TTL
  if (error || !data?.signedUrl) {
    logger.error('[Dossier] signed URL error', error);
    return '';
  }
  return data.signedUrl;
}

export function buildDossierShareUrl(token: string): string {
  return `${window.location.origin}/d/${token}`;
}

export function daysUntilTokenExpiry(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ── useDossierItems ───────────────────────────────────────────────────────────

export function useDossierItems(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dossier_items', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<DossierItem[]> => {
      const { data, error } = await supabase
        .from('project_dossier_items')
        .select('*')
        .eq('project_id', projectId!)
        .order('category')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch signed URLs in parallel
      const items = await Promise.all(
        (data ?? []).map(async (row) => ({
          ...row,
          signed_url: await getSignedUrl(row.file_path),
        }))
      );

      return items as DossierItem[];
    },
  });
}

// ── useUploadDossierItem ──────────────────────────────────────────────────────

export function useUploadDossierItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      category,
      file,
    }: {
      projectId: string;
      category: DossierCategory;
      file: File;
    }): Promise<DossierItem> => {
      if (!user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() ?? 'bin';
      const filePath = `${user.id}/${projectId}/${category.toLowerCase()}/${Date.now()}_${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(DOSSIER_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Insert DB row
      const { data, error: insertError } = await supabase
        .from('project_dossier_items')
        .insert({
          user_id: user.id,
          project_id: projectId,
          category,
          file_path: filePath,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          source: 'MANUAL',
        })
        .select('*')
        .single();

      if (insertError) {
        // Cleanup orphan file
        await supabase.storage.from(DOSSIER_BUCKET).remove([filePath]);
        throw insertError;
      }

      return {
        ...data,
        signed_url: await getSignedUrl(filePath),
      } as DossierItem;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['dossier_items', vars.projectId] });
    },
  });
}

// ── useDeleteDossierItem ──────────────────────────────────────────────────────

export function useDeleteDossierItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item }: { item: DossierItem }) => {
      // Delete DB row first
      const { error: dbError } = await supabase
        .from('project_dossier_items')
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      // Delete from storage (best effort)
      const { error: storageError } = await supabase.storage
        .from(DOSSIER_BUCKET)
        .remove([item.file_path]);

      if (storageError) {
        logger.warn('[Dossier] storage delete failed (orphan)', storageError);
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['dossier_items', vars.item.project_id] });
    },
  });
}

// ── useDossierShareTokens ─────────────────────────────────────────────────────

export function useDossierShareTokens(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dossier_share_tokens', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<DossierShareToken[]> => {
      const { data, error } = await supabase
        .from('project_dossier_share_tokens')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DossierShareToken[];
    },
  });
}

// ── useCreateDossierToken ─────────────────────────────────────────────────────

export function useCreateDossierToken() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDossierTokenInput): Promise<DossierShareToken> => {
      if (!user) throw new Error('Not authenticated');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (input.expires_days ?? 30));

      const { data, error } = await supabase
        .from('project_dossier_share_tokens')
        .insert({
          user_id: user.id,
          project_id: input.project_id,
          allowed_categories: input.allowed_categories,
          label: input.label ?? null,
          expires_at: expiresAt.toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as DossierShareToken;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['dossier_share_tokens', vars.project_id] });
    },
  });
}

// ── useDeleteDossierToken ─────────────────────────────────────────────────────

export function useDeleteDossierToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token }: { token: DossierShareToken }) => {
      const { error } = await supabase
        .from('project_dossier_share_tokens')
        .delete()
        .eq('id', token.id);

      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['dossier_share_tokens', vars.token.project_id],
      });
    },
  });
}

// ── useExportDossierPdf ───────────────────────────────────────────────────────
// Export strategy: Option B (safe MVP) — client-side summary PDF via jsPDF
// - Cover page: project title + metadata
// - Table: category, filename, size, date, link (signed URL)
// - No file merging — reliable on mobile

export function useExportDossierPdf() {
  return useMutation({
    mutationFn: async ({
      projectTitle,
      items,
    }: {
      projectTitle: string;
      items: DossierItem[];
    }) => {
      // Dynamic import to avoid including jspdf in initial bundle
      const { jsPDF } = await import('jspdf');
      // @ts-expect-error — jspdf-autotable augments jsPDF prototype
      await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // ── Cover page ────────────────────────────────────────────────────────
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Teczka projektu', 20, 35);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(projectTitle, 20, 48);

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 20, 58);
      doc.text(`Dokumentów: ${items.length}`, 20, 64);
      doc.setTextColor(0, 0, 0);

      doc.setLineWidth(0.5);
      doc.line(20, 70, 190, 70);

      // ── Document index table ──────────────────────────────────────────────
      const CATEGORY_LABELS: Record<string, string> = {
        CONTRACT:  'Umowy',
        PROTOCOL:  'Protokoły',
        RECEIPT:   'Rachunki',
        PHOTO:     'Fotoprotokół',
        GUARANTEE: 'Gwarancje',
        OTHER:     'Inne',
      };

      const rows = items.map((item) => [
        CATEGORY_LABELS[item.category] ?? item.category,
        item.file_name,
        item.size_bytes ? `${Math.ceil(item.size_bytes / 1024)} KB` : '—',
        new Date(item.created_at).toLocaleDateString('pl-PL'),
        item.signed_url ? 'Dostępny' : 'Brak linku',
      ]);

      // @ts-expect-error — autoTable added by jspdf-autotable
      doc.autoTable({
        startY: 78,
        head: [['Kategoria', 'Plik', 'Rozmiar', 'Data', 'Status']],
        body: rows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 },
      });

      // ── Footer ────────────────────────────────────────────────────────────
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
        .internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Majster.AI — Teczka projektu | Strona ${i} z ${pageCount}`,
          20,
          290
        );
        doc.setTextColor(0, 0, 0);
      }

      // Trigger download
      const safeName = projectTitle.replace(/[^a-zA-Z0-9ąćęłńóśźż\s]/gi, '').trim() || 'projekt';
      doc.save(`teczka_${safeName}_${Date.now()}.pdf`);
    },
    onError: (err) => {
      logger.error('[Dossier] PDF export failed', err);
      toast.error('Błąd eksportu PDF. Spróbuj ponownie.');
    },
  });
}
