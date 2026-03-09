/**
 * useProjectAcceptance — PR-15
 *
 * TanStack Query hooks for project_acceptance table.
 * Manages client acceptance record + signature storage (private bucket).
 * RLS enforced server-side (user_id = auth.uid()).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { PHOTO_BUCKET } from './usePhotoReport';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectAcceptance {
  id: string;
  user_id: string;
  project_id: string;
  accepted_at: string | null;
  signature_path: string | null;
  client_name: string | null;
  notes: string | null;
  updated_at: string;
  created_at: string;
  /** Populated client-side after signed URL fetch */
  signatureUrl?: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const acceptanceKeys = {
  all: ['project_acceptance'] as const,
  byProject: (projectId: string) =>
    [...acceptanceKeys.all, 'project', projectId] as const,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getSignedSignatureUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    logger.error('[Acceptance] Failed to get signed URL for signature:', error);
    return '';
  }
  return data.signedUrl;
}

// ── useProjectAcceptance ──────────────────────────────────────────────────────

export function useProjectAcceptance(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: acceptanceKeys.byProject(projectId ?? ''),
    queryFn: async (): Promise<ProjectAcceptance | null> => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('project_acceptance')
        .select('id, user_id, project_id, accepted_at, signature_path, client_name, notes, updated_at, created_at')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const record = data as ProjectAcceptance;

      // Fetch signed URL for signature if present
      if (record.signature_path) {
        record.signatureUrl = await getSignedSignatureUrl(record.signature_path);
      }

      return record;
    },
    enabled: !!user && !!projectId,
    staleTime: 30_000,
  });
}

// ── useUpsertAcceptance ───────────────────────────────────────────────────────

export function useUpsertAcceptance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      clientName,
      notes,
    }: {
      projectId: string;
      clientName?: string;
      notes?: string;
    }): Promise<ProjectAcceptance> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_acceptance')
        .upsert(
          {
            user_id: user.id,
            project_id: projectId,
            client_name: clientName ?? null,
            notes: notes ?? null,
          },
          { onConflict: 'project_id' }
        )
        .select('*')
        .single();

      if (error) throw error;
      return data as ProjectAcceptance;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: acceptanceKeys.byProject(projectId) });
    },
  });
}

// ── useSaveSignature ──────────────────────────────────────────────────────────

export function useSaveSignature() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      signatureBlob,
    }: {
      projectId: string;
      signatureBlob: Blob;
    }): Promise<ProjectAcceptance> => {
      if (!user) throw new Error('Not authenticated');

      // Storage path: userId/projectId/signature.png
      const storagePath = `${user.id}/${projectId}/signature.png`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, signatureBlob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('project_acceptance')
        .upsert(
          {
            user_id: user.id,
            project_id: projectId,
            signature_path: storagePath,
            accepted_at: new Date().toISOString(),
          },
          { onConflict: 'project_id' }
        )
        .select('*')
        .single();

      if (error) throw error;

      logger.log(`[Acceptance] Signature saved to storage: ${storagePath}`);
      return data as ProjectAcceptance;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: acceptanceKeys.byProject(projectId) });
    },
  });
}
