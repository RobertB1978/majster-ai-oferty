/**
 * ProjectsList — PR-13
 *
 * New projects list page. Replaces redirect at /app/projects.
 * Features: ACTIVE/COMPLETED/ON_HOLD filter, search, EmptyState CTA.
 * Works with FF_NEW_SHELL ON/OFF.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FolderKanban, Plus, Archive, FileText, LayoutList } from 'lucide-react';

import { useProjectsV2List, useDeleteProjectV2, type ProjectStatus } from '@/hooks/useProjectsV2';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import EmptyProjects from '@/components/illustrations/EmptyProjects';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// ── Status config ─────────────────────────────────────────────────────────────

type StatusFilter = ProjectStatus | 'ALL';

const STATUS_TABS: StatusFilter[] = ['ALL', 'ACTIVE', 'COMPLETED', 'ON_HOLD'];

const STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  ACTIVE:    'bg-info/10 text-info dark:bg-info/20',
  COMPLETED: 'bg-success/10 text-success dark:bg-success/20',
  ON_HOLD:   'bg-warning/10 text-warning dark:bg-warning/20',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const STATUS_I18N_KEYS: Record<StatusFilter, string> = {
  ALL:       'projectsV2.statusAll',
  ACTIVE:    'projectsV2.statusActive',
  COMPLETED: 'projectsV2.statusCompleted',
  ON_HOLD:   'projectsV2.statusOnHold',
  CANCELLED: 'projectsV2.statusCancelled',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectsList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchRaw, setSearchRaw] = useState('');
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const search = useDebounce(searchRaw, 300);

  const { data: projects = [], isLoading, isError, refetch } = useProjectsV2List(
    statusFilter === 'ALL' ? 'ALL' : statusFilter,
    search
  );
  const deleteProject = useDeleteProjectV2();

  const isFiltering = statusFilter !== 'ALL' || searchRaw.trim() !== '';

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-2">
        <div>
          <h1 className="text-2xl font-extrabold">{t('projectsV2.pageTitle')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('projectsV2.offerFirstNote')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/projects/new')}
          title={t('projectsV2.manualCreationHint')}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t('projectsV2.newProject')}
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors whitespace-nowrap',
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {t(STATUS_I18N_KEYS[s])}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
          onClear={() => setSearchRaw('')}
          placeholder={t('projectsV2.searchPlaceholder')}
        />
      </div>

      {/* Content */}
      {isLoading && (
        <div role="status" aria-label={t('projectsV2.loadingAriaLabel')}>
          <SkeletonList rows={5} />
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          title={t('projectsV2.errorTitle')}
          description={t('projectsV2.errorDesc')}
          retryLabel={t('projectsV2.errorRetry')}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="space-y-3">
          <EmptyState
            icon={FolderKanban}
            illustration={isFiltering ? undefined : EmptyProjects}
            title={isFiltering ? t('projectsV2.emptyFilterTitle') : t('projectsV2.emptyTitle')}
            description={isFiltering ? t('projectsV2.emptyFilterDesc') : t('projectsV2.emptyDesc')}
            ctaLabel={isFiltering ? undefined : t('projectsV2.emptyCta')}
            onCta={isFiltering ? undefined : () => navigate('/app/offers')}
          />
          {!isFiltering && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/app/projects/new')}
              >
                <FileText className="h-3.5 w-3.5" />
                {t('projectsV2.manualCta')}
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div className="flex flex-col gap-2">
          {projects.map((project) => {
            const status = project.status as ProjectStatus;
            return (
              <div
                key={project.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30 cursor-pointer"
                onClick={() => navigate(`/app/projects/${project.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/projects/${project.id}`)}
                aria-label={project.title}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium truncate">{project.title}</span>
                    <Badge className={cn('shrink-0 text-[11px] font-semibold px-2 py-0.5', STATUS_BADGE_CLASSES[status])}>
                      {t(STATUS_I18N_KEYS[status])}
                    </Badge>
                    {/* Sprint E: lightweight stages badge — renders nothing for projects without a stage plan */}
                    {project.stages_json.length > 0 && (
                      <Badge className="shrink-0 bg-muted text-muted-foreground text-[11px] px-2 py-0.5 gap-1">
                        <LayoutList className="h-3 w-3" />
                        {project.stages_json.length} etapów
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {/* Progress bar */}
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${project.progress_percent}%` }}
                        />
                      </div>
                      <span className="shrink-0">{project.progress_percent}%</span>
                    </div>
                  </div>
                  {project.start_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('projectsV2.startDate')}: {formatDate(project.start_date, i18n.language)}
                    </p>
                  )}
                </div>
                {project.status !== 'CANCELLED' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label={t('projectsV2.archiveProject')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setArchiveConfirmId(project.id);
                    }}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archive confirmation dialog (PRJ-03: soft-delete via CANCELLED status) */}
      <AlertDialog open={!!archiveConfirmId} onOpenChange={() => setArchiveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projectsV2.archiveConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projectsV2.archiveConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (archiveConfirmId) {
                  const id = archiveConfirmId;
                  setArchiveConfirmId(null);
                  deleteProject.mutate(id, {
                    onSuccess: () => toast.success(t('projectsV2.archiveSuccess')),
                    onError: () => toast.error(t('projectsV2.archiveError')),
                  });
                }
              }}
            >
              {t('projectsV2.archiveConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
