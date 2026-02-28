import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
}

/**
 * Reusable pagination controls component
 * Displays: [Previous] Page X of Y [Next] • Showing Z items
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
}: PaginationControlsProps) {
  const { t } = useTranslation();
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (totalPages <= 1) {
    return null; // Don't show pagination for single page
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.previous')}
        </Button>

        <div className="text-sm text-muted-foreground px-2">
          {t('common.pageOf', { current: currentPage, total: totalPages })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
        >
          {t('common.next')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {totalItems !== undefined && pageSize !== undefined && (
        <div className="text-sm text-muted-foreground">
          {t('common.showingItems', {
            from: (currentPage - 1) * pageSize + 1,
            to: Math.min(currentPage * pageSize, totalItems),
            total: totalItems,
          })}
        </div>
      )}
    </div>
  );
}
