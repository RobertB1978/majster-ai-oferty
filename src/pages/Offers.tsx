import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { differenceInDays, addDays, format } from 'date-fns';
import { FileText, MoreHorizontal, ExternalLink, FolderPlus, FolderOpen, Sparkles, Archive, Plus, CalendarDays, Loader2 } from 'lucide-react';

import { useCreateProjectV2, useProjectsBySourceOffers, findProjectBySourceOffer } from '@/hooks/useProjectsV2';
import { IndustryTemplateSheet } from '@/components/offers/IndustryTemplateSheet';
import { getStarterPack } from '@/data/starterPacks';
import { useAddCalendarEvent } from '@/hooks/useCalendarEvents';

import { useOffersInfinite, useArchiveOffer, NO_RESPONSE_DAYS } from '@/hooks/useOffers';
import type { Offer, OfferStatus, OfferSort } from '@/hooks/useOffers';
import { useDebounce } from '@/hooks/useDebounce';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import EmptyOffers from '@/components/illustrations/EmptyOffers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDate, formatNumberCompact } from '@/lib/formatters';

// ── Status config ──────────────────────────────────────────────────────────────

type StatusFilter = OfferStatus | 'ALL';

const STATUS_TABS: StatusFilter[] = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED'];

const STATUS_BADGE_CLASSES: Record<OfferStatus, string> = {
  DRAFT:    'bg-muted text-muted-foreground',
  SENT:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ARCHIVED: 'bg-secondary text-secondary-foreground',
};

const STATUS_I18N_KEYS: Record<StatusFilter, string> = {
  ALL:      'offersList.statusAll',
  DRAFT:    'offersList.statusDraft',
  SENT:     'offersList.statusSent',
  ACCEPTED: 'offersList.statusAccepted',
  REJECTED: 'offersList.statusRejected',
  ARCHIVED: 'offersList.statusArchived',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRelativeDays(dateStr: string): string {
  const diff = differenceInDays(new Date(), new Date(dateStr));
  if (diff === 0) return '< 1 d';
  return `${diff} d`;
}

function formatShortDate(dateStr: string | null, locale?: string): string | null {
  if (!dateStr) return null;
  return formatDate(dateStr, locale);
}

function formatAmount(value: number | null, currency: string, locale?: string): string | null {
  if (value === null) return null;
  return formatNumberCompact(value, locale) + ' ' + currency;
}

function noResponseDays(sentAt: string | null): number | null {
  if (!sentAt) return null;
  const days = differenceInDays(new Date(), new Date(sentAt));
  return days >= NO_RESPONSE_DAYS ? days : null;
}

// ── OfferRow ──────────────────────────────────────────────────────────────────

interface OfferRowProps {
  offer: Offer;
  onOpen: (id: string) => void;
  onCreateProject: (id: string) => void;
  onOpenProject: (projectId: string) => void;
  onArchive: (id: string) => void;
  onScheduleFollowup: (offer: Offer) => void;
  isCreatingProject?: boolean;
  /** Batch-resolved project ID from useProjectsBySourceOffers. Null = no project exists. */
  existingProjectId?: string | null;
  /** True while the batch project lookup is in flight. */
  projectsLoading?: boolean;
}

function OfferRow({ offer, onOpen, onCreateProject, onOpenProject, onArchive, onScheduleFollowup, isCreatingProject, existingProjectId, projectsLoading }: OfferRowProps) {
  const { t, i18n } = useTranslation();
  const noResp = offer.status === 'SENT' ? noResponseDays(offer.sent_at) : null;
  const amount = formatAmount(offer.total_net, offer.currency, i18n.language);
  const updatedAgo = formatRelativeDays(offer.last_activity_at);
  const status = offer.status as OfferStatus;
  const isAccepted = status === 'ACCEPTED';
  const visibleDate = formatShortDate(offer.sent_at ?? offer.created_at, i18n.language);
  // Sprint E: resolve template pack for list badge (gracefully undefined for non-template offers)
  const templatePack = offer.source_template_id ? getStarterPack(offer.source_template_id) : undefined;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30 cursor-pointer',
        isAccepted ? 'border-green-300 dark:border-green-700' : 'border-border'
      )}
      onClick={() => onOpen(offer.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(offer.id)}
      aria-label={offer.title ?? t('offersList.noTitle')}
    >
      {/* Left: title + badges + create project CTA */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium truncate">
            {offer.title ?? t('offersList.noTitle')}
          </span>
          <Badge className={cn('shrink-0 text-[11px] font-semibold px-2 py-0.5', STATUS_BADGE_CLASSES[status])}>
            {t(STATUS_I18N_KEYS[status])}
          </Badge>
          {noResp !== null && (
            <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[11px] px-2 py-0.5">
              {t('offersList.noResponseBadge', { days: noResp })}
            </Badge>
          )}
          {/* Sprint E: lightweight template-origin badge — renders nothing when no template */}
          {templatePack && (
            <Badge className="shrink-0 bg-primary/10 text-primary border border-primary/20 text-[11px] px-2 py-0.5 gap-1">
              <Sparkles className="h-3 w-3" />
              {templatePack.tradeName}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {amount && <span>{amount}</span>}
          {offer.client_reference && <span>{t('offersList.clientRef')}: {offer.client_reference}</span>}
          {visibleDate && <span>{offer.sent_at ? t('offersList.sentAt') : t('offersList.createdAt')}: {visibleDate}</span>}
          <span>{t('offersList.updatedAgo', { time: updatedAgo })}</span>
        </div>
        {/* ACCEPTED CTA — open existing project or create new one */}
        {isAccepted && (
          <div className="mt-2">
            {projectsLoading ? (
              <div className="flex items-center gap-1.5 h-7 text-xs text-muted-foreground py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
            ) : existingProjectId ? (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={(e) => { e.stopPropagation(); onOpenProject(existingProjectId); }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {t('acceptanceLink.openProjectCta')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={(e) => { e.stopPropagation(); onCreateProject(offer.id); }}
                disabled={isCreatingProject}
              >
                <FolderPlus className="h-3.5 w-3.5" />
                {isCreatingProject ? t('projectsV2.creating') : t('acceptanceLink.createProjectCta')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Right: actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            aria-label={t('common.actions')}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(offer.id); }}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('offersList.actionOpen')}
          </DropdownMenuItem>
          {offer.status === 'SENT' && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onScheduleFollowup(offer); }}>
              <CalendarDays className="mr-2 h-4 w-4" />
              {t('offersList.actionScheduleFollowup')}
            </DropdownMenuItem>
          )}
          {offer.status !== 'ARCHIVED' && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(offer.id); }}>
              <Archive className="mr-2 h-4 w-4" />
              {t('offersList.actionArchive')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Offers page ───────────────────────────────────────────────────────────────

export default function Offers() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchRaw, setSearchRaw] = useState('');
  const [sort, setSort] = useState<OfferSort>('last_activity_at');
  const [creatingProjectId, setCreatingProjectId] = useState<string | null>(null);
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);

  const search = useDebounce(searchRaw, 300);
  const createProject = useCreateProjectV2();
  const archiveOffer = useArchiveOffer();
  const addCalendarEvent = useAddCalendarEvent();

  const {
    data: offersData,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOffersInfinite({ status: statusFilter, search, sort });

  // Flatten infinite pages into a single array for rendering and lookups
  const offers = useMemo(
    () => offersData?.pages.flat() ?? [],
    [offersData?.pages],
  );

  // Collect accepted offer IDs for a single batch project lookup
  const acceptedOfferIds = useMemo(
    () => offers.filter((o) => o.status === 'ACCEPTED').map((o) => o.id),
    [offers],
  );

  // One query for all accepted-offer → project mappings instead of N per-row queries
  const { data: projectMap = new Map<string, string>(), isLoading: projectsLoading } =
    useProjectsBySourceOffers(acceptedOfferIds);

  // IntersectionObserver sentinel — triggers fetchNextPage when bottom of list is visible
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleOpen = (id: string) => navigate(`/app/offers/${id}`);
  const handleOpenProject = (projectId: string) => navigate(`/app/projects/${projectId}`);
  const handleCreateFirst = () => navigate('/app/offers/new');
  const handleArchive = async (offerId: string) => {
    try {
      await archiveOffer.mutateAsync(offerId);
      toast.success(t('offersList.archiveSuccess'));
    } catch {
      toast.error(t('offersList.archiveError'));
    }
  };

  // PR-13: Create project from accepted offer then navigate to project hub
  const handleCreateProject = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    setCreatingProjectId(offerId);
    try {
      // Duplicate prevention: check if project already exists for this offer
      const existing = await findProjectBySourceOffer(offerId);
      if (existing) {
        toast.info(t('projectsV2.alreadyExists'));
        navigate(`/app/projects/${existing.id}`);
        return;
      }
      const project = await createProject.mutateAsync({
        title: offer.title ?? t('projectsV2.defaultTitle'),
        client_id: offer.client_id ?? null,
        source_offer_id: offerId,
        total_from_offer: offer.total_net ?? null,
      });
      toast.success(t('projectsV2.createSuccess'));
      navigate(`/app/projects/${project.id}`);
    } catch {
      toast.error(t('projectsV2.createError'));
    } finally {
      setCreatingProjectId(null);
    }
  };


  // Pack 4: Schedule a manual follow-up calendar event for a SENT offer
  const handleScheduleFollowup = (offer: Offer) => {
    const followupDate = format(addDays(new Date(), 2), 'yyyy-MM-dd');
    addCalendarEvent.mutate({
      title: `Follow-up: ${offer.title ?? t('offersList.noTitle')}`,
      description: null,
      event_type: 'follow_up',
      event_date: followupDate,
      event_time: null,
      project_id: null,
      status: 'pending',
    });
  };

  const errorDescription = useMemo(() => {
    if (!error) return t('offersList.errorDesc');

    const errorObj = error as { code?: string };

    // PGRST205 = table not found in schema — pending database migration
    if (errorObj.code === 'PGRST205') {
      return t('offersList.errorDescMigration');
    }

    return t('offersList.errorDesc');
  }, [error, t]);

  const isFiltering = statusFilter !== 'ALL' || searchRaw.trim() !== '';

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Page title + action buttons */}
      <div className="flex items-center justify-between mb-5 gap-2">
        <h1 className="text-2xl font-bold">{t('offersList.pageTitle')}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
            onClick={() => setTemplateSheetOpen(true)}
            title={t('industryTemplates.triggerButtonHint')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('industryTemplates.triggerButton')}</span>
            <span className="sm:hidden">{t('industryTemplates.triggerButtonShort')}</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleCreateFirst}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('offersList.newOfferButton')}</span>
            <span className="sm:hidden">{t('offersList.newOfferButtonShort')}</span>
          </Button>
        </div>
      </div>

      {/* Industry templates sheet */}
      <IndustryTemplateSheet
        open={templateSheetOpen}
        onOpenChange={setTemplateSheetOpen}
      />

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

      {/* Search + Sort row */}
      <div className="flex gap-2 mb-4">
        <SearchInput
          className="flex-1"
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
          onClear={() => setSearchRaw('')}
          placeholder={t('offersList.searchPlaceholder')}
        />
        <Select value={sort} onValueChange={(v) => setSort(v as OfferSort)}>
          <SelectTrigger className="w-[160px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_activity_at">{t('offersList.sortRecentUpdated')}</SelectItem>
            <SelectItem value="created_at">{t('offersList.sortNewest')}</SelectItem>
            <SelectItem value="total_net">{t('offersList.sortValue')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading && (
        <div role="status" aria-label={t('offersList.loadingAriaLabel')}>
          <SkeletonList rows={6} />
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          title={t('offersList.errorTitle')}
          description={errorDescription}
          retryLabel={t('offersList.errorRetry')}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && offers.length === 0 && (
        <div className="space-y-3">
          <EmptyState
            icon={FileText}
            illustration={isFiltering ? undefined : EmptyOffers}
            title={isFiltering ? t('offersList.emptyFilterTitle') : t('offersList.emptyTitle')}
            description={isFiltering ? t('offersList.emptyFilterDesc') : t('offersList.emptyDesc')}
            ctaLabel={isFiltering ? t('offersList.emptyFilterCta') : t('offersList.emptyCta')}
            onCta={isFiltering ? () => { setStatusFilter('ALL'); setSearchRaw(''); } : handleCreateFirst}
          />
          {!isFiltering && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary hover:text-primary hover:bg-primary/5"
                onClick={() => setTemplateSheetOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('industryTemplates.emptyStateCta')}
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoading && !isError && offers.length > 0 && (
        <div className="flex flex-col gap-2">
          {offers.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              onOpen={handleOpen}
              onCreateProject={handleCreateProject}
              onOpenProject={handleOpenProject}
              onArchive={handleArchive}
              onScheduleFollowup={handleScheduleFollowup}
              isCreatingProject={creatingProjectId === offer.id}
              existingProjectId={projectMap.get(offer.id) ?? null}
              projectsLoading={projectsLoading}
            />
          ))}

          {/* IntersectionObserver sentinel — auto-triggers fetchNextPage when visible */}
          <div ref={loadMoreRef} className="flex justify-center pt-2 pb-4">
            {isFetchingNextPage && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('offersList.loadingMore')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
