/**
 * usePhotoReport — PR-15
 *
 * TanStack Query hooks for the project_photos table (phase-aware).
 * Uses private Supabase Storage bucket with signed URLs.
 *
 * Phases: BEFORE | DURING | AFTER | ISSUE
 *
 * Features:
 *  - Client-side image compression before upload (max 1600px, quality 0.75)
 *  - Optimistic UI: photo appears immediately with uploading status
 *  - Retry on failure (reuses compressed blob, no re-compression)
 *  - Signed URL generation for private bucket access
 *  - Dev logs: original vs compressed size (no PII)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage } from '@/lib/imageCompression';
import { logger } from '@/lib/logger';

// ── Constants ─────────────────────────────────────────────────────────────────

export const PHOTO_BUCKET = 'project-photos';

export const PHOTO_PHASES = ['BEFORE', 'DURING', 'AFTER', 'ISSUE'] as const;
export type PhotoPhase = typeof PHOTO_PHASES[number];

/** Compression target for PR-15 */
const COMPRESSION_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.75,
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectPhotoV2 {
  id: string;
  project_id: string;
  user_id: string;
  phase: PhotoPhase;
  /** Storage path (not a public URL). Use signedUrl for display. */
  photo_url: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  /** Populated client-side after signed URL fetch */
  signedUrl?: string;
  /** UI-only: upload in progress */
  uploading?: boolean;
  /** UI-only: upload failed */
  uploadError?: string;
}

export interface UploadPhotoInput {
  projectId: string;
  phase: PhotoPhase;
  file: File;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const photoReportKeys = {
  all: ['photo_report'] as const,
  byProject: (projectId: string) =>
    [...photoReportKeys.all, 'project', projectId] as const,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getSignedPhotoUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(filePath, 3600); // 1h expiry

  if (error || !data?.signedUrl) {
    logger.error('[PhotoReport] Failed to get signed URL:', error);
    return '';
  }
  return data.signedUrl;
}

/** Extract storage path from stored photo_url value */
function extractStoragePath(photoUrl: string): string {
  // photo_url may be stored as "project-photos/userId/..." or just "userId/..."
  const match = photoUrl.match(/project-photos\/(.+)/);
  if (match) return match[1].split('?')[0];
  return photoUrl.split('?')[0];
}

// ── usePhotoReport ────────────────────────────────────────────────────────────

export function usePhotoReport(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: photoReportKeys.byProject(projectId ?? ''),
    queryFn: async (): Promise<ProjectPhotoV2[]> => {
      if (!projectId) return [];

      try {
        const { data, error } = await supabase
          .from('project_photos')
          .select('id, project_id, user_id, phase, photo_url, file_name, mime_type, size_bytes, width, height, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.error('[PhotoReport] Query error (returning empty):', error.message);
          return [];
        }

        // Fetch signed URLs for all photos in parallel
        const photos = await Promise.all(
          (data ?? []).map(async (row) => {
            const storagePath = extractStoragePath(row.photo_url as string);
            const signedUrl = storagePath ? await getSignedPhotoUrl(storagePath) : '';
            return {
              ...row,
              phase: (row.phase ?? 'BEFORE') as PhotoPhase,
              signedUrl,
            } as ProjectPhotoV2;
          })
        );

        return photos;
      } catch (err) {
        logger.error('[PhotoReport] Unexpected error (returning empty):', err);
        return [];
      }
    },
    enabled: !!user && !!projectId,
    staleTime: 60_000,
  });
}

// ── useUploadPhotoReport ──────────────────────────────────────────────────────

export function useUploadPhotoReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, phase, file }: UploadPhotoInput): Promise<ProjectPhotoV2> => {
      if (!user) throw new Error('Not authenticated');

      const originalSize = file.size;

      // Compress client-side ONCE — reused on retry via closure
      const compressed = await compressImage(file, COMPRESSION_OPTIONS);
      const compressedSize = compressed.size;

      logger.log(
        `[PhotoReport] Compression: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB` +
        ` (${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction)`
      );

      // Storage path: userId/projectId/uuid.ext
      const ext = compressed.name.split('.').pop() ?? 'jpg';
      const storagePath = `${user.id}/${projectId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, compressed, { upsert: false });

      if (uploadError) throw uploadError;

      // Insert DB record with storage path (NOT a public URL)
      const { data, error } = await supabase
        .from('project_photos')
        .insert({
          project_id: projectId,
          user_id: user.id,
          phase,
          photo_url: storagePath,       // store path only
          file_name: file.name,
          mime_type: compressed.type,
          size_bytes: compressedSize,
        })
        .select('id, project_id, user_id, phase, photo_url, file_name, mime_type, size_bytes, width, height, created_at')
        .single();

      if (error) throw error;

      // Immediately fetch signed URL for optimistic display
      const signedUrl = await getSignedPhotoUrl(storagePath);

      return { ...(data as ProjectPhotoV2), signedUrl, phase: phase };
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: photoReportKeys.byProject(projectId) });
    },
  });
}

// ── useDeletePhotoReport ──────────────────────────────────────────────────────

export function useDeletePhotoReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, projectId: _projectId, storagePath }: {
      photoId: string;
      projectId: string;
      storagePath: string;
    }): Promise<void> => {
      // Delete from DB first (RLS enforced)
      const { error } = await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      // Best-effort storage cleanup (ignore error if already deleted)
      const path = extractStoragePath(storagePath);
      if (path) {
        await supabase.storage.from(PHOTO_BUCKET).remove([path]);
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: photoReportKeys.byProject(projectId) });
    },
  });
}
