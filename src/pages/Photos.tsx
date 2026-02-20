import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Camera, ExternalLink, FolderOpen, ImageOff, HardDrive, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useUserSubscription } from '@/hooks/useSubscription';

interface PhotoRow {
  id: string;
  photo_url: string;
  description: string | null;
  analysis_result: string | null;
  created_at: string;
  project_id: string;
  project?: { name: string };
}

function useAllPhotos() {
  return useQuery({
    queryKey: ['all_project_photos'],
    queryFn: async (): Promise<PhotoRow[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get photos via projects the user owns
      const { data, error } = await supabase
        .from('project_photos')
        .select('id, photo_url, description, analysis_result, created_at, project_id, projects(name)')
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...row,
        project: Array.isArray(row.projects) ? row.projects[0] : (row.projects as { name: string } | null) ?? undefined,
      }));
    },
  });
}

const PLAN_STORAGE: Record<string, { label: string; limitMB: number | null }> = {
  free:       { label: '100 MB', limitMB: 100 },
  pro:        { label: '1 GB',   limitMB: 1024 },
  starter:    { label: '1 GB',   limitMB: 1024 },
  business:   { label: '5 GB',   limitMB: 5120 },
  enterprise: { label: '∞',      limitMB: null },
};

// Approximate: avg photo ~2 MB after compression
const AVG_PHOTO_MB = 2;

export default function Photos() {
  const { t } = useTranslation();
  const { data: photos, isLoading } = useAllPhotos();
  const { data: subscription } = useUserSubscription();
  const planId = subscription?.plan_id ?? 'free';
  const storageInfo = PLAN_STORAGE[planId] ?? PLAN_STORAGE.free;
  const usedMB = (photos?.length ?? 0) * AVG_PHOTO_MB;
  const pct = storageInfo.limitMB ? Math.min(100, Math.round((usedMB / storageInfo.limitMB) * 100)) : 0;

  return (
    <>
      <Helmet>
        <title>{t('photos.title', 'Zdjęcia')} | Majster.AI</title>
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              {t('photos.title', 'Zdjęcia projektów')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('photos.subtitle', 'Wszystkie zdjęcia z Twoich projektów. AI może analizować stan techniczny.')}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/app/jobs">
              <FolderOpen className="h-4 w-4 mr-2" />
              {t('photos.goToProjects', 'Dodaj zdjęcia w projekcie')}
            </Link>
          </Button>
        </div>

        {/* Storage bar */}
        <Card className="border-border/60">
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 py-4">
            <HardDrive className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('photos.storageUsed', 'Wykorzystano przestrzeń')}
                </span>
                <span className="font-medium tabular-nums">
                  {storageInfo.limitMB
                    ? `~${usedMB} MB / ${storageInfo.label}`
                    : `~${usedMB} MB / ${storageInfo.label}`}
                </span>
              </div>
              {storageInfo.limitMB ? (
                <Progress value={pct} className="h-2" />
              ) : (
                <div className="h-2 rounded-full bg-primary/20">
                  <div className="h-full w-0 rounded-full bg-primary" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('photos.storagePlanNote', 'Limit dla planu')}:{' '}
                <span className="font-medium">
                  {t(`plan.names.${planId}`, planId)} — {storageInfo.label}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (!photos || photos.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ImageOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">{t('photos.empty', 'Brak zdjęć')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(
                    'photos.emptyHint',
                    'Dodaj zdjęcia w widoku projektu. AI przeanalizuje stan techniczny i zaproponuje pozycje w wycenie.'
                  )}
                </p>
              </div>
              <Button asChild>
                <Link to="/app/jobs">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t('photos.openProjects', 'Otwórz projekty')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && photos && photos.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow"
              >
                {/* Photo */}
                <div className="aspect-square bg-muted overflow-hidden">
                  <img
                    src={photo.photo_url}
                    alt={photo.description ?? t('photos.photoAlt', 'Zdjęcie projektu')}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* AI badge */}
                {photo.analysis_result && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-primary-foreground text-xs">
                      AI ✓
                    </Badge>
                  </div>
                )}

                {/* Footer */}
                <div className="p-3 space-y-1">
                  {photo.project?.name && (
                    <p className="text-xs font-medium truncate">{photo.project.name}</p>
                  )}
                  {photo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{photo.description}</p>
                  )}
                  {photo.analysis_result && (
                    <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-1">
                      {photo.analysis_result}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(photo.created_at).toLocaleDateString('pl-PL')}
                    </span>
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                      <Link to={`/app/jobs/${photo.project_id}`}>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GDPR note */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0 text-success mt-0.5" />
        <p>
          {t(
            'photos.gdprNote',
            'Zdjęcia są przechowywane bezpiecznie i przetwarzane zgodnie z RODO / GDPR. Możesz je usunąć w dowolnym momencie z poziomu projektu. Nie udostępniamy ich osobom trzecim.'
          )}
          {' '}
          <Link to="/legal/rodo" className="underline underline-offset-2 hover:text-foreground transition-colors">
            {t('photos.gdprLink', 'Centrum RODO')}
          </Link>
        </p>
      </div>
    </>
  );
}
