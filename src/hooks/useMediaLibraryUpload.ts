/**
 * useMediaLibraryUpload — Direct upload to media_library
 *
 * Uploads a photo directly into the global media library without
 * requiring a project association. Storage path follows canonical rule:
 *   {userId}/media/{uuid}.{ext}
 *
 * Features:
 *  - Client-side image compression (max 1600px, quality 0.75)
 *  - Signed URL generation for immediate display
 *  - Invalidates gallery query on success
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage } from '@/lib/imageCompression';
import { logger } from '@/lib/logger';
import { MEDIA_BUCKET, normalizeStoragePath } from '@/lib/storage';
import type { PhotoPhase } from '@/hooks/usePhotoReport';

const COMPRESSION_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.75,
} as const;

export interface MediaLibraryPhoto {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  signedUrl: string;
}

export function useMediaLibraryUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<MediaLibraryPhoto> => {
      if (!user) throw new Error('Not authenticated');

      const originalSize = file.size;
      const compressed = await compressImage(file, COMPRESSION_OPTIONS);

      logger.log(
        `[MediaLibrary] Compression: ${(originalSize / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB` +
        ` (${((1 - compressed.size / originalSize) * 100).toFixed(1)}% reduction)`
      );

      // Canonical path: {userId}/media/{uuid}.{ext}
      const ext = compressed.name.split('.').pop() ?? 'jpg';
      const storagePath = `${user.id}/media/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, compressed, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: mediaRow, error: mediaError } = await supabase
        .from('media_library')
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          file_name: file.name,
          file_size: compressed.size,
          mime_type: compressed.type,
        })
        .select('id, storage_path, file_name, file_size, mime_type, created_at')
        .single();

      if (mediaError) throw mediaError;

      // Signed URL for immediate display
      const { data: urlData } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(storagePath, 3600);

      return {
        id: mediaRow.id,
        storagePath: mediaRow.storage_path,
        fileName: mediaRow.file_name,
        mimeType: mediaRow.mime_type ?? compressed.type,
        fileSize: mediaRow.file_size ?? compressed.size,
        createdAt: mediaRow.created_at,
        signedUrl: urlData?.signedUrl ?? '',
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
    },
  });
}

// ── useAttachPhotoToProject ──────────────────────────────────────────────────

export function useAttachPhotoToProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoId,
      projectId,
      phase,
    }: {
      photoId: string;
      projectId: string;
      phase: PhotoPhase;
    }): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      // Upsert so that re-attaching updates the phase instead of throwing a duplicate key error
      const { error } = await supabase
        .from('photo_project_links')
        .upsert(
          {
            photo_id: photoId,
            project_id: projectId,
            user_id: user.id,
            phase,
          },
          { onConflict: 'photo_id,project_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
      queryClient.invalidateQueries({ queryKey: ['photo_report'] });
    },
  });
}

// ── useDeleteMediaLibraryPhoto ───────────────────────────────────────────────

export function useDeleteMediaLibraryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, storagePath }: {
      photoId: string;
      storagePath: string;
    }): Promise<void> => {
      // Delete all links first (project, offer, client) — RLS enforced
      await supabase.from('photo_project_links').delete().eq('photo_id', photoId);
      await supabase.from('photo_offer_links').delete().eq('photo_id', photoId);
      await supabase.from('photo_client_links').delete().eq('photo_id', photoId);

      // Delete from media_library
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      // Best-effort: legacy table cleanup
      await supabase.from('project_photos').delete().eq('id', photoId);

      // Best-effort: storage cleanup
      const path = normalizeStoragePath(storagePath);
      if (path) {
        await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
      queryClient.invalidateQueries({ queryKey: ['photo_report'] });
    },
  });
}
