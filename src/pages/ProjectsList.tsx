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
import { FolderKanban, Plus } from 'lucide-react';

import { useProjectsV2List, type ProjectStatus } from '@/hooks/useProjectsV2';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

// ── Status config ─────────────────────────────────────────────────────────────

type StatusFilter = ProjectStatus | 'ALL';

const STATUS_TABS: StatusFilter[] = ['ALL', 'ACTIVE', 'COMPLETED', 'ON_HOLD'];

const STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  ACTIVE:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ON_HOLD:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_I18N_KEYS: Record<StatusFilter, string> = {
  ALL:       'projectsV2.statusAll',
  ACTIVE:    'projectsV2.statusActive',
  COMPLETED: 'projectsV2.statusCompleted',
  ON_HOLD:   'projectsV2.statusOnHold',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 300);

  const { data: projects = [], isLoading, isError, refetch } = useProjectsV2List(
    statusFilter === 'ALL' ? 'ALL' : statusFilter,
    search
  );

  const isFiltering = statusFilter !== 'ALL' || searchRaw.trim() !== '';

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">{t('projectsV2.pageTitle')}</h1>
        <Button size="sm" onClick={() => navigate('/app/projects/new')}>
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
        <EmptyState
          icon={FolderKanban}
          title={isFiltering ? t('projectsV2.emptyFilterTitle') : t('projectsV2.emptyTitle')}
          description={isFiltering ? t('projectsV2.emptyFilterDesc') : t('projectsV2.emptyDesc')}
          ctaLabel={isFiltering ? undefined : t('projectsV2.emptyCta')}
          onCta={isFiltering ? undefined : () => navigate('/app/projects/new')}
        />
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
                      {t('projectsV2.startDate')}: {new Date(project.start_date).toLocaleDateString('pl-PL')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
