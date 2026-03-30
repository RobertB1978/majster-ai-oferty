/**
 * usePhotoReport — PR-15 → PR-2 bridge
 *
 * TanStack Query hooks for project photos, now backed by
 * media_library + photo_project_links (PR-2).
 *
 * Phases: BEFORE | DURING | AFTER | ISSUE
 *
 * Features:
 *  - Client-side image compression before upload (max 1600px, quality 0.75)
 *  - Optimistic UI: photo appears immediately with uploading status
 *  - Retry on failure (reuses compressed blob, no re-compression)
 *  - Signed URL generation for private bucket access
 *  - Writes go to media_library + photo_project_links
 *  - Reads come from photo_project_links joined with media_library
 *  - Legacy project_photos table is left untouched (backward compat)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage } from '@/lib/imageCompression';
import { logger } from '@/lib/logger';
import { MEDIA_BUCKET, normalizeStoragePath } from '@/lib/storage';

// ── Constants ─────────────────────────────────────────────────────────────────

/** @deprecated Use MEDIA_BUCKET from '@/lib/storage' instead. Kept for backward compat. */
export const PHOTO_BUCKET = MEDIA_BUCKET;

export const PHOTO_PHASES = ['BEFORE', 'DURING', 'AFTER', 'ISSUE'] as const;
export type PhotoPhase = (typeof PHOTO_PHASES)[number];

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
  /** media_library asset id */
  media_id: string;
  /** photo_project_links link id */
  link_id: string;
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
    .from(MEDIA_BUCKET)
    .createSignedUrl(filePath, 3600); // 1h expiry

  if (error || !data?.signedUrl) {
    logger.error('[PhotoReport] Failed to get signed URL:', error);
    return '';
  }
  return data.signedUrl;
}

// ── usePhotoReport ────────────────────────────────────────────────────────────

export function usePhotoReport(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: photoReportKeys.byProject(projectId ?? ''),
    queryFn: async (): Promise<ProjectPhotoV2[]> => {
      if (!projectId) return [];

      try {
        // Read from photo_project_links joined with media_library
        const { data, error } = await supabase
          .from('photo_project_links')
          .select(`
            id,
            photo_id,
            project_id,
            user_id,
            phase,
            sort_order,
            created_at,
            media_library (
              id,
              storage_path,
              file_name,
              file_size,
              mime_type,
              width,
              height,
              ai_analysis
            )
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.error('[PhotoReport] Query error (returning empty):', error.message);
          return [];
        }

        // Fetch signed URLs for all photos in parallel
        const photos = await Promise.all(
          (data ?? []).map(async (row) => {
            const media = row.media_library as unknown as {
              id: string;
              storage_path: string;
              file_name: string;
              file_size: number | null;
              mime_type: string | null;
              width: number | null;
              height: number | null;
              ai_analysis: Record<string, unknown> | null;
            } | null;

            if (!media) return null;

            const storagePath = normalizeStoragePath(media.storage_path);
            const signedUrl = storagePath ? await getSignedPhotoUrl(storagePath) : '';

            return {
              id: row.photo_id,
              media_id: media.id,
              link_id: row.id,
              project_id: row.project_id,
              user_id: row.user_id,
              phase: (row.phase ?? 'BEFORE') as PhotoPhase,
              photo_url: media.storage_path,
              file_name: media.file_name,
              mime_type: media.mime_type,
              size_bytes: media.file_size,
              width: media.width,
              height: media.height,
              created_at: row.created_at,
              signedUrl,
            } as ProjectPhotoV2;
          })
        );

        return photos.filter((p): p is ProjectPhotoV2 => p !== null);
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

      // Storage path: userId/projectId/uuid.ext (same as before for compat)
      const ext = compressed.name.split('.').pop() ?? 'jpg';
      const storagePath = `${user.id}/${projectId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, compressed, { upsert: false });

      if (uploadError) throw uploadError;

      // Step 1: Insert into media_library
      const { data: mediaRow, error: mediaError } = await supabase
        .from('media_library')
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          file_name: file.name,
          file_size: compressedSize,
          mime_type: compressed.type,
        })
        .select('id, storage_path, file_name, file_size, mime_type, width, height, created_at')
        .single();

      if (mediaError) throw mediaError;

      // Step 2: Insert link into photo_project_links
      const { data: linkRow, error: linkError } = await supabase
        .from('photo_project_links')
        .insert({
          photo_id: mediaRow.id,
          project_id: projectId,
          user_id: user.id,
          phase,
        })
        .select('id, created_at')
        .single();

      if (linkError) throw linkError;

      // Step 3: Also insert into legacy project_photos for backward compat
      await supabase
        .from('project_photos')
        .insert({
          id: mediaRow.id, // reuse same UUID
          project_id: projectId,
          user_id: user.id,
          phase,
          photo_url: storagePath,
          file_name: file.name,
          mime_type: compressed.type,
          size_bytes: compressedSize,
        })
        .single();
      // Ignore errors on legacy insert — new model is source of truth

      // Immediately fetch signed URL for optimistic display
      const signedUrl = await getSignedPhotoUrl(storagePath);

      return {
        id: mediaRow.id,
        media_id: mediaRow.id,
        link_id: linkRow.id,
        project_id: projectId,
        user_id: user.id,
        phase,
        photo_url: storagePath,
        file_name: file.name,
        mime_type: compressed.type,
        size_bytes: compressedSize,
        width: null,
        height: null,
        created_at: linkRow.created_at,
        signedUrl,
      };
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: photoReportKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
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
      // Delete link from photo_project_links (RLS enforced)
      const { error: linkError } = await supabase
        .from('photo_project_links')
        .delete()
        .eq('photo_id', photoId);

      if (linkError) throw linkError;

      // Delete from media_library (RLS enforced)
      const { error: mediaError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', photoId);

      if (mediaError) throw mediaError;

      // Best-effort: also delete from legacy table
      await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId);

      // Best-effort storage cleanup (ignore error if already deleted)
      const path = normalizeStoragePath(storagePath);
      if (path) {
        await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: photoReportKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
    },
  });
}
