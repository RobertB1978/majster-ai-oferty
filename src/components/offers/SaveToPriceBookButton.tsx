/**
 * SaveToPriceBookButton
 *
 * A small inline button that saves the current item to the user's price book
 * (item_templates table). Only enabled when the item has a non-empty name.
 *
 * Truthful: saves real user-entered data, no AI or synthetic pricing.
 */

import { Bookmark, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useCreateItemTemplate } from '@/hooks/useItemTemplates';
import { cn } from '@/lib/utils';

interface SaveToPriceBookButtonProps {
  name: string;
  unit: string;
  price: number;
  category?: 'Materiał' | 'Robocizna';
  className?: string;
  /** Compact: icon only, no visual label */
  size?: 'sm' | 'xs';
}

export function SaveToPriceBookButton({
  name,
  unit,
  price,
  category = 'Robocizna',
  className,
}: SaveToPriceBookButtonProps) {
  const { t } = useTranslation();
  const createTemplate = useCreateItemTemplate();

  const hasName = name.trim().length > 0;

  const handleSave = async () => {
    if (!hasName || createTemplate.isPending) return;
    await createTemplate.mutateAsync({
      name: name.trim(),
      unit: unit.trim() || 'szt.',
      default_qty: 1,
      default_price: price,
      category,
      description: '',
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 text-muted-foreground hover:text-primary transition-colors',
        !hasName && 'opacity-30 cursor-not-allowed',
        className,
      )}
      disabled={!hasName || createTemplate.isPending}
      onClick={handleSave}
      title={
        !hasName
          ? t('priceBook.saveToBookDisabled')
          : t('priceBook.saveToBook')
      }
      aria-label={t('priceBook.saveToBook')}
      data-testid="save-to-price-book-btn"
    >
      {createTemplate.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
