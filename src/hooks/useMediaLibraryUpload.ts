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
import { MEDIA_BUCKET } from '@/lib/storage';

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
