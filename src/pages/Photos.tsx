/**
 * Photos page — PR-3: Direct upload + global media library
 *
 * True global media library entry point. Users can:
 *  - Upload photos directly (no project required)
 *  - Browse all photos (linked and unlinked)
 *  - Filter by project and phase
 *  - View in lightbox
 *
 * Data source: media_library (all user photos),
 * enriched with photo_project_links for project info.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  ExternalLink,
  FolderOpen,
  ImageOff,
  AlertTriangle,
  RefreshCw,
  X,
  Upload,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MEDIA_BUCKET, normalizeStoragePath } from '@/lib/storage';
import { PHOTO_PHASES, type PhotoPhase } from '@/hooks/usePhotoReport';
import { useMediaLibraryUpload } from '@/hooks/useMediaLibraryUpload';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface GalleryPhoto {
  id: string;
  mediaId: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  phase: string | null;
  projectId: string | null;
  projectName: string | null;
  aiAnalysis: Record<string, unknown> | null;
  createdAt: string;
  signedUrl: string;
}

// ── Data hook ────────────────────────────────────────────────────────────────

function useGalleryPhotos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gallery_photos', user?.id],
    queryFn: async (): Promise<GalleryPhoto[]> => {
      if (!user) return [];

      // Query media_library directly — includes ALL photos (linked + unlinked)
      const { data: mediaRows, error: mediaError } = await supabase
        .from('media_library')
        .select('id, storage_path, file_name, mime_type, ai_analysis, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(120);

      if (mediaError) {
        logger.error('[Gallery] media_library query error:', mediaError.message);
        throw mediaError;
      }

      const rows = mediaRows ?? [];
      if (rows.length === 0) return [];

      // Fetch project links for these photos
      const photoIds = rows.map((r) => r.id);
      const { data: linkRows } = await supabase
        .from('photo_project_links')
        .select('photo_id, project_id, phase, v2_projects ( name )')
        .in('photo_id', photoIds);

      // Build a map: photo_id → { projectId, projectName, phase }
      const linkMap = new Map<string, { projectId: string; projectName: string | null; phase: string | null }>();
      for (const link of linkRows ?? []) {
        const project = link.v2_projects as unknown as { name: string } | null;
        linkMap.set(link.photo_id, {
          projectId: link.project_id,
          projectName: project?.name ?? null,
          phase: link.phase,
        });
      }

      // Generate signed URLs in bounded batches
      const photos: GalleryPhoto[] = [];
      const BATCH_SIZE = 20;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (media) => {
            const storagePath = normalizeStoragePath(media.storage_path);
            const { data: urlData } = await supabase.storage
              .from(MEDIA_BUCKET)
              .createSignedUrl(storagePath, 3600);

            const link = linkMap.get(media.id);

            return {
              id: media.id,
              mediaId: media.id,
              storagePath,
              fileName: media.file_name,
              mimeType: media.mime_type,
              phase: link?.phase ?? null,
              projectId: link?.projectId ?? null,
              projectName: link?.projectName ?? null,
              aiAnalysis: media.ai_analysis as Record<string, unknown> | null,
              createdAt: media.created_at,
              signedUrl: urlData?.signedUrl ?? '',
            } satisfies GalleryPhoto;
          })
        );
        photos.push(...batchResults);
      }

      return photos;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

// ── Gallery filter helpers ───────────────────────────────────────────────────

function useUniqueProjects(photos: GalleryPhoto[]) {
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const p of photos) {
      if (p.projectId && p.projectName && !map.has(p.projectId)) {
        map.set(p.projectId, p.projectName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [photos]);
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ photo, onClose }: { photo: GalleryPhoto; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.fileName}
    >
      <button
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
        onClick={onClose}
        aria-label={t('photos.filterAll')}
      >
        <X className="h-5 w-5" />
      </button>
      <div className="max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.signedUrl}
          alt={photo.fileName}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-white text-sm">
          {photo.projectName && (
            <Badge variant="secondary" className="bg-white/20 text-white">
              {photo.projectName}
            </Badge>
          )}
          {!photo.projectId && (
            <Badge variant="outline" className="border-white/40 text-white">
              {t('photos.libraryOnly')}
            </Badge>
          )}
          {photo.phase && (
            <Badge variant="outline" className="border-white/40 text-white">
              {t(`photoReport.phase.${photo.phase}`)}
            </Badge>
          )}
          <span className="text-white/60 ml-auto">
            {new Date(photo.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Photos() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: photos, isLoading, isError, refetch } = useGalleryPhotos();
  const uploadMutation = useMediaLibraryUpload();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<PhotoPhase | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPhotos = photos ?? [];
  const projects = useUniqueProjects(allPhotos);

  const filteredPhotos = useMemo(() => {
    let result = allPhotos;
    if (selectedProject) {
      result = result.filter((p) => p.projectId === selectedProject);
    }
    if (selectedPhase) {
      result = result.filter((p) => p.phase === selectedPhase);
    }
    return result;
  }, [allPhotos, selectedProject, selectedPhase]);

  const handlePhotoClick = useCallback((photo: GalleryPhoto) => {
    if (photo.signedUrl) {
      setLightboxPhoto(photo);
    }
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Reset file input so the same file can be re-selected
      const fileList = Array.from(files);
      e.target.value = '';

      for (const file of fileList) {
        if (!file.type.startsWith('image/')) continue;

        try {
          await uploadMutation.mutateAsync(file);
          toast({
            title: t('photos.uploadSuccess'),
            variant: 'default',
          });
        } catch (err) {
          logger.error('[Photos] Upload failed:', err);
          toast({
            title: t('photos.uploadFailed'),
            description: t('photos.uploadFailedDesc'),
            variant: 'destructive',
          });
        }
      }
    },
    [uploadMutation, toast, t]
  );

  const hasActiveFilters = selectedProject !== null || selectedPhase !== null;
  const isUploading = uploadMutation.isPending;

  return (
    <>
      <Helmet>
        <title>{t('photos.title')} | Majster.AI</title>
      </Helmet>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {lightboxPhoto && (
        <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              {t('photos.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('photos.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/projects">
                <FolderOpen className="h-4 w-4 mr-2" />
                {t('photos.goToProjects')}
              </Link>
            </Button>
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? t('photos.uploading') : t('photos.uploadPhoto')}
            </Button>
          </div>
        </div>

        {/* Filters (only shown when photos exist) */}
        {!isLoading && !isError && allPhotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* Project filter */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedProject ?? ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
              aria-label={t('photos.filterProject')}
            >
              <option value="">{t('photos.allProjects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Phase filter */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedPhase ?? ''}
              onChange={(e) => setSelectedPhase((e.target.value || null) as PhotoPhase | null)}
              aria-label={t('photos.filterPhase')}
            >
              <option value="">{t('photos.allPhases')}</option>
              {PHOTO_PHASES.map((phase) => (
                <option key={phase} value={phase}>{t(`photoReport.phase.${phase}`)}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => { setSelectedProject(null); setSelectedPhase(null); }}
              >
                <X className="h-3 w-3 mr-1" />
                {t('photos.filterAll')}
              </Button>
            )}

            <span className="text-xs text-muted-foreground self-center ml-auto">
              {t('photos.photoCount', { count: filteredPhotos.length })}
            </span>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-medium">{t('photos.errorTitle')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('photos.errorDesc')}
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('photos.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filteredPhotos.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ImageOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">{t('photos.empty')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? t('photos.emptyFiltered')
                    : t('photos.emptyHintDirect')
                  }
                </p>
              </div>
              {!hasActiveFilters && (
                <Button onClick={handleUploadClick} disabled={isUploading} className="gap-2">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {t('photos.uploadPhoto')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gallery grid */}
        {!isLoading && !isError && filteredPhotos.length > 0 && (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePhotoClick(photo)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePhotoClick(photo); }}
                aria-label={photo.fileName}
              >
                {/* Photo */}
                <div className="aspect-square bg-muted overflow-hidden">
                  {photo.signedUrl ? (
                    <img
                      src={photo.signedUrl}
                      alt={photo.fileName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <ImageOff className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Phase badge */}
                {photo.phase && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-black/60 text-white text-[10px] px-1.5 py-0.5">
                      {t(`photoReport.phase.${photo.phase}`)}
                    </Badge>
                  </div>
                )}

                {/* AI badge */}
                {photo.aiAnalysis && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-primary-foreground text-xs">
                      AI
                    </Badge>
                  </div>
                )}

                {/* Library-only badge (no project link) */}
                {!photo.projectId && !photo.aiAnalysis && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-black/40 text-white border-white/30 text-[10px] px-1.5 py-0.5">
                      {t('photos.libraryOnly')}
                    </Badge>
                  </div>
                )}

                {/* Footer */}
                <div className="p-2 space-y-0.5">
                  {photo.projectName ? (
                    <p className="text-xs font-medium truncate">{photo.projectName}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground truncate">{photo.fileName}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </span>
                    {photo.projectId && (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-h-[32px] min-w-[32px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link to={`/app/projects/${photo.projectId}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
