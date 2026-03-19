/**
 * useOfferPhotos — Sprint: offer-versioning-7RcU5
 *
 * Lightweight photo attachment for offers.
 * Reuses the existing 'project-photos' storage bucket under
 * the sub-path: {userId}/offers/{offerId}/{uuid}.{ext}
 *
 * Each photo has:
 *   - show_in_pdf    → embedded in generated PDF
 *   - show_in_public → visible on client-facing public offer page
 *   - (internal by default when both false)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage } from '@/lib/imageCompression';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OfferPhoto {
  id: string;
  offer_id: string;
  user_id: string;
  storage_path: string;
  show_in_pdf: boolean;
  show_in_public: boolean;
  caption: string | null;
  sort_order: number;
  created_at: string;
  /** Populated client-side after signed URL fetch */
  signedUrl?: string;
}

const PHOTO_BUCKET = 'project-photos';

// ── Query keys ────────────────────────────────────────────────────────────────

export const offerPhotoKeys = {
  byOffer: (offerId: string) => ['offerPhotos', offerId] as const,
};

// ── List & sign URLs ──────────────────────────────────────────────────────────

export function useOfferPhotos(offerId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: offerPhotoKeys.byOffer(offerId ?? ''),
    queryFn: async (): Promise<OfferPhoto[]> => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_photos')
        .select('id, offer_id, user_id, storage_path, show_in_pdf, show_in_public, caption, sort_order, created_at')
        .eq('offer_id', offerId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as OfferPhoto[];

      // Fetch signed URLs (1 hour expiry)
      const withUrls = await Promise.all(
        rows.map(async (row) => {
          const { data: signed } = await supabase.storage
            .from(PHOTO_BUCKET)
            .createSignedUrl(row.storage_path, 3600);
          return { ...row, signedUrl: signed?.signedUrl ?? undefined };
        }),
      );
      return withUrls;
    },
    enabled: !!user && !!offerId,
    staleTime: 1000 * 60 * 10,
  });
}

// ── Upload ────────────────────────────────────────────────────────────────────

interface UploadParams {
  offerId: string;
  file: File;
  showInPdf?: boolean;
  showInPublic?: boolean;
  caption?: string;
}

export function useUploadOfferPhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      file,
      showInPdf = false,
      showInPublic = false,
      caption,
    }: UploadParams): Promise<OfferPhoto> => {
      if (!user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() ?? 'jpg';
      const uuid = crypto.randomUUID();
      const storagePath = `${user.id}/offers/${offerId}/${uuid}.${ext}`;

      // Compress before upload (reuse existing utility)
      const compressed = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.80,
      });

      const { error: uploadErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, compressed, {
          contentType: compressed.type,
          upsert: false,
        });
      if (uploadErr) throw uploadErr;

      // Get current max sort_order
      const { data: existing } = await supabase
        .from('offer_photos')
        .select('sort_order')
        .eq('offer_id', offerId)
        .order('sort_order', { ascending: false })
        .limit(1);
      const nextOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1;

      const { data, error: dbErr } = await supabase
        .from('offer_photos')
        .insert({
          offer_id: offerId,
          user_id: user.id,
          storage_path: storagePath,
          show_in_pdf: showInPdf,
          show_in_public: showInPublic,
          caption: caption?.trim() || null,
          sort_order: nextOrder,
        })
        .select('id, offer_id, user_id, storage_path, show_in_pdf, show_in_public, caption, sort_order, created_at')
        .single();
      if (dbErr) throw dbErr;

      return data as OfferPhoto;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: offerPhotoKeys.byOffer(vars.offerId) });
    },
  });
}

// ── Update visibility ─────────────────────────────────────────────────────────

interface UpdateVisibilityParams {
  photoId: string;
  offerId: string;
  showInPdf: boolean;
  showInPublic: boolean;
  caption?: string | null;
}

export function useUpdateOfferPhotoVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, showInPdf, showInPublic, caption }: UpdateVisibilityParams) => {
      const { error } = await supabase
        .from('offer_photos')
        .update({ show_in_pdf: showInPdf, show_in_public: showInPublic, caption: caption ?? null })
        .eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: offerPhotoKeys.byOffer(vars.offerId) });
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────

interface DeleteParams {
  photoId: string;
  offerId: string;
  storagePath: string;
}

export function useDeleteOfferPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, storagePath }: DeleteParams) => {
      // Delete from storage (non-fatal if file missing)
      await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
      // Delete DB record
      const { error } = await supabase.from('offer_photos').delete().eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: offerPhotoKeys.byOffer(vars.offerId) });
    },
  });
}
