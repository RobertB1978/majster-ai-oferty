/**
 * PhotoReportPanel — PR-15
 *
 * Photo Report module for Project Hub.
 * Sections: BEFORE / DURING / AFTER / ISSUE
 * Features:
 *  - Add photo(s) per section via file input (or camera on mobile)
 *  - Client-side compression before upload (handled in usePhotoReport)
 *  - Optimistic UI: photo tile appears immediately with "Uploading..." status
 *  - Retry button on failed upload
 *  - Signed URL for private bucket display
 *  - Camera permission handling via CameraPermissionGate
 */

import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Camera, Loader2, RotateCcw, Trash2, Plus, ImageOff } from 'lucide-react';

import {
  usePhotoReport,
  useUploadPhotoReport,
  useDeletePhotoReport,
  PHOTO_PHASES,
  type PhotoPhase,
  type ProjectPhotoV2,
} from '@/hooks/usePhotoReport';
import { CameraPermissionGate } from './CameraPermissionGate';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OptimisticPhoto extends Partial<ProjectPhotoV2> {
  id: string;
  phase: PhotoPhase;
  uploading: boolean;
  uploadError?: string;
  localPreview?: string;
  _pendingFile?: File;
}

interface PhaseGroupProps {
  phase: PhotoPhase;
  projectId: string;
  photos: ProjectPhotoV2[];
  optimistic: OptimisticPhoto[];
  onUpload: (phase: PhotoPhase, file: File) => void;
  onRetry: (opt: OptimisticPhoto) => void;
  onDelete: (photo: ProjectPhotoV2) => void;
}

// ── PhaseGroup ────────────────────────────────────────────────────────────────

function PhaseGroup({ phase, projectId: _projectId, photos, optimistic, onUpload, onRetry, onDelete }: PhaseGroupProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => onUpload(phase, file));
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const allItems = [
    ...photos.map((p) => ({ type: 'uploaded' as const, photo: p })),
    ...optimistic.map((o) => ({ type: 'optimistic' as const, opt: o })),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t(`photoReport.phase.${phase}`)}
        </h4>
        <CameraPermissionGate onRequestFile={triggerFileInput}>
          {(onPickFile) => (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onPickFile}
            >
              <Camera className="h-3.5 w-3.5" />
              {t('photoReport.addPhoto')}
            </Button>
          )}
        </CameraPermissionGate>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          aria-label={t('photoReport.addPhotoAriaLabel', { phase: t(`photoReport.phase.${phase}`) })}
        />
      </div>

      {allItems.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
          {t('photoReport.noPhotos')}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {/* Uploaded photos */}
          {photos.map((photo) => (
            <UploadedPhotoTile
              key={photo.id}
              photo={photo}
              onDelete={onDelete}
            />
          ))}
          {/* Optimistic / in-progress tiles */}
          {optimistic.map((opt) => (
            <OptimisticPhotoTile
              key={opt.id}
              opt={opt}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── UploadedPhotoTile ─────────────────────────────────────────────────────────

function UploadedPhotoTile({ photo, onDelete }: { photo: ProjectPhotoV2; onDelete: (p: ProjectPhotoV2) => void }) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      onDelete(photo);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
      {photo.signedUrl ? (
        <img
          src={photo.signedUrl}
          alt={photo.file_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <ImageOff className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <button
        className={cn(
          'absolute top-1 right-1 rounded-full p-1 bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
          deleting && 'opacity-100'
        )}
        onClick={handleDelete}
        disabled={deleting}
        aria-label={t('photoReport.deletePhoto')}
      >
        {deleting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}

// ── OptimisticPhotoTile ───────────────────────────────────────────────────────

function OptimisticPhotoTile({ opt, onRetry }: { opt: OptimisticPhoto; onRetry: (o: OptimisticPhoto) => void }) {
  const { t } = useTranslation();

  return (
    <div className="relative aspect-square rounded-md overflow-hidden border bg-muted">
      {opt.localPreview && (
        <img
          src={opt.localPreview}
          alt={opt.file_name ?? 'preview'}
          loading="lazy"
          className={cn('w-full h-full object-cover', (opt.uploading || opt.uploadError) && 'opacity-50')}
        />
      )}
      {opt.uploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Loader2 className="h-5 w-5 animate-spin text-white drop-shadow" />
          <span className="text-[10px] text-white font-medium drop-shadow">
            {t('photoReport.uploading')}
          </span>
        </div>
      )}
      {opt.uploadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
          <span className="text-[9px] text-destructive font-medium text-center leading-tight">
            {t('photoReport.uploadFailed')}
          </span>
          <button
            className="flex items-center gap-0.5 text-[9px] text-white bg-primary rounded px-1 py-0.5"
            onClick={() => onRetry(opt)}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            {t('photoReport.retry')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── PhotoReportPanel ──────────────────────────────────────────────────────────

interface PhotoReportPanelProps {
  projectId: string;
}

export function PhotoReportPanel({ projectId }: PhotoReportPanelProps) {
  const { t } = useTranslation();
  const { data: photos, isLoading, isError, refetch } = usePhotoReport(projectId);
  const uploadPhoto = useUploadPhotoReport();
  const deletePhoto = useDeletePhotoReport();

  // Optimistic state per phase
  const [optimistic, setOptimistic] = useState<OptimisticPhoto[]>([]);

  const handleUpload = useCallback(async (phase: PhotoPhase, file: File) => {
    // Create local preview immediately
    const localPreview = URL.createObjectURL(file);
    const tempId = `opt_${Date.now()}_${Math.random()}`;

    const optItem: OptimisticPhoto = {
      id: tempId,
      phase,
      uploading: true,
      localPreview,
      file_name: file.name,
      _pendingFile: file,
    };

    setOptimistic((prev) => [...prev, optItem]);

    try {
      await uploadPhoto.mutateAsync({ projectId, phase, file });
      // Remove optimistic on success (real data comes from query invalidation)
      setOptimistic((prev) => prev.filter((o) => o.id !== tempId));
      URL.revokeObjectURL(localPreview);
      toast.success(t('photoReport.uploadSuccess'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('photoReport.uploadFailed');
      setOptimistic((prev) =>
        prev.map((o) =>
          o.id === tempId ? { ...o, uploading: false, uploadError: message } : o
        )
      );
      toast.error(t('photoReport.uploadFailed'));
    }
  }, [projectId, uploadPhoto, t]);

  const handleRetry = useCallback(async (opt: OptimisticPhoto) => {
    if (!opt._pendingFile) return;

    setOptimistic((prev) =>
      prev.map((o) =>
        o.id === opt.id ? { ...o, uploading: true, uploadError: undefined } : o
      )
    );

    try {
      await uploadPhoto.mutateAsync({ projectId, phase: opt.phase, file: opt._pendingFile });
      setOptimistic((prev) => prev.filter((o) => o.id !== opt.id));
      if (opt.localPreview) URL.revokeObjectURL(opt.localPreview);
      toast.success(t('photoReport.uploadSuccess'));
    } catch {
      setOptimistic((prev) =>
        prev.map((o) =>
          o.id === opt.id ? { ...o, uploading: false, uploadError: t('photoReport.uploadFailed') } : o
        )
      );
      toast.error(t('photoReport.uploadFailed'));
    }
  }, [projectId, uploadPhoto, t]);

  const handleDelete = useCallback(async (photo: ProjectPhotoV2) => {
    try {
      await deletePhoto.mutateAsync({
        photoId: photo.id,
        projectId,
        storagePath: photo.photo_url,
      });
      toast.success(t('photoReport.deleteSuccess'));
    } catch {
      toast.error(t('photoReport.deleteError'));
    }
  }, [projectId, deletePhoto, t]);

  if (isLoading) {
    return <SkeletonList rows={3} />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={ImageOff}
        title={t('photoReport.emptyTitle')}
        description={t('photoReport.emptyDesc')}
      />
    );
  }

  const photosByPhase = (photos ?? []).reduce<Record<PhotoPhase, ProjectPhotoV2[]>>(
    (acc, photo) => {
      const phase = photo.phase ?? 'BEFORE';
      acc[phase] = [...(acc[phase] ?? []), photo];
      return acc;
    },
    { BEFORE: [], DURING: [], AFTER: [], ISSUE: [] }
  );

  const optimisticByPhase = optimistic.reduce<Record<PhotoPhase, OptimisticPhoto[]>>(
    (acc, opt) => {
      acc[opt.phase] = [...(acc[opt.phase] ?? []), opt];
      return acc;
    },
    { BEFORE: [], DURING: [], AFTER: [], ISSUE: [] }
  );

  const totalPhotos = (photos?.length ?? 0) + optimistic.length;

  return (
    <div className="space-y-5">
      {totalPhotos === 0 && (
        <EmptyState
          icon={Plus}
          title={t('photoReport.emptyTitle')}
          description={t('photoReport.emptyDesc')}
        />
      )}

      {PHOTO_PHASES.map((phase) => (
        <PhaseGroup
          key={phase}
          phase={phase}
          projectId={projectId}
          photos={photosByPhase[phase] ?? []}
          optimistic={optimisticByPhase[phase] ?? []}
          onUpload={handleUpload}
          onRetry={handleRetry}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
