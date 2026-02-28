import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight, Package } from 'lucide-react';
import {
  Building2,
  ClipboardList,
  DoorOpen,
  Droplets,
  Hammer,
  Home,
  Layers,
  Paintbrush,
  Square,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import { tradeCategories } from '@/data/tradeCatalog';
import type { CatalogCategory, CatalogSubcategory, CatalogTrade } from '@/data/tradeCatalog';
import { getStarterPack } from '@/data/starterPacks';
import type { StarterPack } from '@/data/starterPacks';

/** Map icon name string → Lucide component */
const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  ClipboardList,
  DoorOpen,
  Droplets,
  Hammer,
  Home,
  Layers,
  Paintbrush,
  Square,
  Truck,
  Wrench,
  Zap,
};

function CatalogIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Package;
  return <Icon className={className} />;
}

type CatalogStep = 'categories' | 'subcategories' | 'trades';

interface TradeCatalogPickerProps {
  onSelectPack: (pack: StarterPack) => void;
  onBack: () => void;
}

export function TradeCatalogPicker({ onSelectPack, onBack }: TradeCatalogPickerProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<CatalogStep>('categories');
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<CatalogSubcategory | null>(null);

  const handleSelectCategory = (cat: CatalogCategory) => {
    setSelectedCategory(cat);
    setStep('subcategories');
  };

  const handleSelectSubcategory = (sub: CatalogSubcategory) => {
    setSelectedSubcategory(sub);
    setStep('trades');
  };

  const handleSelectTrade = (trade: CatalogTrade) => {
    const pack = getStarterPack(trade.packId);
    if (pack) onSelectPack(pack);
  };

  const handleBack = () => {
    if (step === 'trades') {
      setStep('subcategories');
    } else if (step === 'subcategories') {
      setStep('categories');
      setSelectedCategory(null);
    } else {
      onBack();
    }
  };

  const title =
    step === 'categories'
      ? t('quickEstimate.tradeCatalog.chooseCategory')
      : step === 'subcategories'
        ? selectedCategory?.name ?? t('quickEstimate.tradeCatalog.chooseSubcategory')
        : selectedSubcategory?.name ?? t('quickEstimate.tradeCatalog.chooseTrade');

  return (
    <div className="space-y-3">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleBack}
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="font-semibold text-sm truncate">{title}</p>
      </div>

      {/* ── Step: categories ──────────────────────────────────────────── */}
      {step === 'categories' && (
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {tradeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <CatalogIcon name={cat.icon} className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-medium leading-tight">{cat.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Step: subcategories ───────────────────────────────────────── */}
      {step === 'subcategories' && selectedCategory && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {selectedCategory.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSelectSubcategory(sub)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-muted hover:border-primary hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-sm font-medium text-left">{sub.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {sub.trades.length}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Step: trades ─────────────────────────────────────────────── */}
      {step === 'trades' && selectedSubcategory && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {selectedSubcategory.trades.map((trade) => {
            const pack = getStarterPack(trade.packId);
            return (
              <Card
                key={`${trade.packId}-${trade.name}`}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelectTrade(trade)}
              >
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{trade.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{trade.description}</p>
                    {pack && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        {pack.items.length} {t('quickEstimate.tradeCatalog.itemsInPack')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
