/**
 * OfferPhotoAttach — Sprint: offer-versioning-7RcU5
 *
 * Lightweight photo attachment panel for an offer.
 * Shown in OfferDetail page for draft offers.
 *
 * Design rules:
 * - Photos are optional; zero-photos = no UI leakage in public view
 * - Each photo has two visibility toggles: show_in_pdf, show_in_public
 * - Neither flag set = internal only
 * - Max 10 photos per offer (app-layer guard)
 * - Mobile-first: one-tap upload, clear visibility labels
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImagePlus,
  Trash2,
  Loader2,
  FileText,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

import {
  useOfferPhotos,
  useUploadOfferPhoto,
  useUpdateOfferPhotoVisibility,
  useDeleteOfferPhoto,
} from '@/hooks/useOfferPhotos';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 10;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic';

interface Props {
  offerId: string;
  readOnly?: boolean;
}

export function OfferPhotoAttach({ offerId, readOnly = false }: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading } = useOfferPhotos(offerId);
  const upload = useUploadOfferPhoto();
  const updateVis = useUpdateOfferPhotoVisibility();
  const deletePhoto = useDeleteOfferPhoto();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_PHOTOS) return;

    setUploading(true);
    try {
      await upload.mutateAsync({ offerId, file });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleFlag = (
    photoId: string,
    flag: 'show_in_pdf' | 'show_in_public',
    current: { show_in_pdf: boolean; show_in_public: boolean; caption: string | null },
  ) => {
    updateVis.mutate({
      photoId,
      offerId,
      show_in_pdf: flag === 'show_in_pdf' ? !current.show_in_pdf : current.show_in_pdf,
      show_in_public: flag === 'show_in_public' ? !current.show_in_public : current.show_in_public,
      caption: current.caption,
    });
  };

  if (isLoading) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t('offerPhotos.sectionTitle')}</p>
        {!readOnly && photos.length < MAX_PHOTOS && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="sr-only"
              onChange={handleFileChange}
              aria-label={t('offerPhotos.uploadAriaLabel')}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {t('offerPhotos.addPhoto')}
            </Button>
          </>
        )}
      </div>

      {photos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {readOnly ? t('offerPhotos.noPhotosReadOnly') : t('offerPhotos.noPhotosHint')}
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => {
            const isInternal = !photo.show_in_pdf && !photo.show_in_public;
            return (
              <div
                key={photo.id}
                className="relative rounded-lg border border-border overflow-hidden bg-muted group"
              >
                {photo.signedUrl ? (
                  <img
                    src={photo.signedUrl}
                    alt={photo.caption ?? t('offerPhotos.photoAlt')}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Visibility badge */}
                <div className="absolute top-1 left-1 flex gap-1">
                  {isInternal && (
                    <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Lock className="h-2.5 w-2.5" />
                      {t('offerPhotos.visibilityInternal')}
                    </span>
                  )}
                  {photo.show_in_public && (
                    <span className="bg-blue-600/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" />
                      {t('offerPhotos.visibilityPublic')}
                    </span>
                  )}
                  {photo.show_in_pdf && (
                    <span className="bg-primary/80 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <FileText className="h-2.5 w-2.5" />
                      PDF
                    </span>
                  )}
                </div>

                {/* Controls */}
                {!readOnly && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1.5 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFlag(photo.id, 'show_in_public', photo)}
                        className={cn(
                          'rounded p-1 text-xs transition-colors',
                          photo.show_in_public
                            ? 'bg-primary text-white'
                            : 'bg-white/20 text-white hover:bg-white/30',
                        )}
                        title={t('offerPhotos.togglePublic')}
                        aria-label={t('offerPhotos.togglePublic')}
                        aria-pressed={photo.show_in_public}
                      >
                        {photo.show_in_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFlag(photo.id, 'show_in_pdf', photo)}
                        className={cn(
                          'rounded p-1 text-xs transition-colors',
                          photo.show_in_pdf
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/20 text-white hover:bg-white/30',
                        )}
                        title={t('offerPhotos.togglePdf')}
                        aria-label={t('offerPhotos.togglePdf')}
                        aria-pressed={photo.show_in_pdf}
                      >
                        <FileText className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        deletePhoto.mutate({ photoId: photo.id, offerId, storagePath: photo.storage_path })
                      }
                      className="rounded p-1 bg-destructive/80 text-white hover:bg-destructive transition-colors"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('offerPhotos.visibilityLegend')}
        </p>
      )}
    </div>
  );
}
