/**
 * PhotoCapture — field-capture photo picker component.
 *
 * Presentational + controlled. No direct Supabase calls.
 * Parent manages upload logic and provides previewUrl for each photo.
 *
 * Gate 1 Condition 1 — src/components/field-capture/PhotoCapture.tsx
 * Roadmap §2.2: touch targets ≥ 48px | §3.7: amber focus ring
 */

import { useRef, useState, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CameraPermissionGate } from '@/components/photos/CameraPermissionGate';

// ── Public types ──────────────────────────────────────────────────────────────

export interface PhotoCapturePhoto {
  id: string;
  /** Thumbnail URL — may be an object URL (local) or storage URL (synced). */
  previewUrl: string;
  caption: string | null;
}

export interface PhotoCaptureProps {
  photos: PhotoCapturePhoto[];
  /** Called when the user selects a new image file. */
  onAdd: (file: File) => void;
  /** Called when the user confirms removal of a photo by its id. */
  onRemove: (id: string) => void;
  /** Maximum thumbnails shown before "+N more" indicator. Default: 4. */
  maxVisible?: number;
  /** Disable all interactions — e.g., while upload is in progress. */
  disabled?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * PhotoCapture renders two entry points (camera + gallery), a thumbnail grid,
 * and a removal confirmation dialog.
 *
 * Accesibility:
 * - All icon-only buttons have aria-label.
 * - Removal dialog uses role="alertdialog" with focus trap (autoFocus on Cancel).
 * - Photo grid has role="list" / role="listitem".
 */
export function PhotoCapture({
  photos,
  onAdd,
  onRemove,
  maxVisible = 4,
  disabled = false,
  className,
}: PhotoCaptureProps) {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const regionId = useId();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onAdd(file);
        // Reset value so the same file can be re-selected
        e.target.value = '';
      }
    },
    [onAdd],
  );

  const handleRemoveRequest = useCallback((id: string) => {
    setRemoveConfirmId(id);
  }, []);

  const handleRemoveConfirm = useCallback(() => {
    if (removeConfirmId) {
      onRemove(removeConfirmId);
      setRemoveConfirmId(null);
    }
  }, [removeConfirmId, onRemove]);

  const handleRemoveCancel = useCallback(() => {
    setRemoveConfirmId(null);
  }, []);

  const visible = photos.slice(0, maxVisible);
  const hiddenCount = Math.max(0, photos.length - maxVisible);

  return (
    <div className={cn('space-y-3', className)} role="region" aria-labelledby={regionId}>
      {/* Hidden file inputs — camera and gallery are separate for capture= behaviour */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="camera-input"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="gallery-input"
      />

      {/* Add-photo action buttons */}
      <div className="flex gap-2">
        <CameraPermissionGate onRequestFile={() => cameraInputRef.current?.click()}>
          {(onPickFile) => (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 min-h-[48px] border-dashed"
              onClick={onPickFile}
              disabled={disabled}
              aria-label={t('fieldCapture.photo.addFromCamera')}
            >
              <Camera className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('fieldCapture.photo.addFromCamera')}
            </Button>
          )}
        </CameraPermissionGate>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 min-h-[48px] border-dashed"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled}
          aria-label={t('fieldCapture.photo.addFromGallery')}
        >
          <ImagePlus className="h-4 w-4 mr-2" aria-hidden="true" />
          {t('fieldCapture.photo.addFromGallery')}
        </Button>
      </div>

      {/* Thumbnail grid */}
      {photos.length > 0 && (
        <div
          className="grid grid-cols-4 gap-2"
          role="list"
          aria-label={t('fieldCapture.photo.addPhoto')}
        >
          {visible.map((photo, index) => (
            <div
              key={photo.id}
              role="listitem"
              className="relative aspect-square rounded-[var(--radius-sm)] overflow-hidden bg-[var(--bg-surface-raised)] group"
            >
              <img
                src={photo.previewUrl}
                alt={photo.caption ?? t('fieldCapture.photo.ariaLabel', { index: index + 1 })}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Remove button — enlarged hit-area via pseudo-element */}
              <button
                type="button"
                className={cn(
                  'absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white',
                  'flex items-center justify-center',
                  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-1',
                  'transition-opacity duration-[var(--motion-fast)]',
                  // Expand touch target without changing visual size
                  'after:absolute after:inset-[-8px] after:rounded-full',
                )}
                onClick={() => handleRemoveRequest(photo.id)}
                aria-label={t('fieldCapture.photo.removePhoto')}
                disabled={disabled}
                data-testid={`remove-photo-${photo.id}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ))}

          {/* "+N more" overflow indicator */}
          {hiddenCount > 0 && (
            <div
              className="aspect-square rounded-[var(--radius-sm)] bg-[var(--bg-surface-raised)] flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]"
              aria-label={t('fieldCapture.photo.andMore', { count: hiddenCount })}
            >
              +{hiddenCount}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)] text-center py-2">
          {t('fieldCapture.photo.empty')}
        </p>
      )}

      {/* Removal confirmation dialog */}
      {removeConfirmId !== null && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="photo-remove-label"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
        >
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 mx-4 w-full max-w-sm space-y-4">
            <p
              id="photo-remove-label"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              {t('fieldCapture.photo.removeConfirm')}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="flex-1 min-h-[48px]"
                onClick={handleRemoveConfirm}
              >
                {t('fieldCapture.photo.removeConfirmYes')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1 min-h-[48px]"
                onClick={handleRemoveCancel}
                autoFocus
              >
                {t('fieldCapture.photo.removeConfirmNo')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
