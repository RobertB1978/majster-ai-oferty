import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import { FileText, MoreHorizontal, Copy, ExternalLink } from 'lucide-react';

import { useOffers, NO_RESPONSE_DAYS } from '@/hooks/useOffers';
import type { Offer, OfferStatus, OfferSort } from '@/hooks/useOffers';
import { useDebounce } from '@/hooks/useDebounce';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
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

function formatAmount(value: number | null, currency: string): string | null {
  if (value === null) return null;
  return (
    new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) +
    ' ' +
    currency
  );
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
  onDuplicate: () => void;
}

function OfferRow({ offer, onOpen, onDuplicate }: OfferRowProps) {
  const { t } = useTranslation();
  const noResp = offer.status === 'SENT' ? noResponseDays(offer.sent_at) : null;
  const amount = formatAmount(offer.total_net, offer.currency);
  const updatedAgo = formatRelativeDays(offer.last_activity_at);
  const status = offer.status as OfferStatus;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30 cursor-pointer"
      onClick={() => onOpen(offer.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(offer.id)}
      aria-label={offer.title ?? t('offersList.noTitle')}
    >
      {/* Left: title + badges */}
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
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {amount && <span>{amount}</span>}
          <span>{t('offersList.updatedAgo', { time: updatedAgo })}</span>
        </div>
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
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            <Copy className="mr-2 h-4 w-4" />
            {t('offersList.actionDuplicate')}
          </DropdownMenuItem>
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

  const search = useDebounce(searchRaw, 300);

  const { data: offers = [], isLoading, isError, refetch } = useOffers({
    status: statusFilter,
    search,
    sort,
  });

  const handleOpen = (id: string) => navigate(`/app/offers/${id}`);
  const handleDuplicate = () => toast.info(t('offersList.duplicateComingSoon'));
  const handleCreateFirst = () => navigate('/app/offers/new');

  const isFiltering = statusFilter !== 'ALL' || searchRaw.trim() !== '';

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-5">{t('offersList.pageTitle')}</h1>

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
          description={t('offersList.errorDesc')}
          retryLabel={t('offersList.errorRetry')}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && offers.length === 0 && (
        <EmptyState
          icon={FileText}
          title={isFiltering ? t('offersList.emptyFilterTitle') : t('offersList.emptyTitle')}
          description={isFiltering ? t('offersList.emptyFilterDesc') : t('offersList.emptyDesc')}
          ctaLabel={isFiltering ? undefined : t('offersList.emptyCta')}
          onCta={isFiltering ? undefined : handleCreateFirst}
        />
      )}

      {!isLoading && !isError && offers.length > 0 && (
        <div className="flex flex-col gap-2">
          {offers.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              onOpen={handleOpen}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
