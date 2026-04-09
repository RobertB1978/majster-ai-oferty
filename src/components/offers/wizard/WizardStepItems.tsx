/**
 * WizardStepItems — PR-10 Step 2
 * Add line items from Price Library (item_templates) or manually.
 * Live totals update as user edits.
 *
 * Sprint offer-versioning-7RcU5:
 *   - Variant tabs: user can add up to 3 named variants
 *   - Each tab owns an independent item list
 *   - No-variant mode unchanged (backward compat)
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Search, Layers, X } from 'lucide-react';
import { itemTemplatesKeys } from '@/hooks/useItemTemplates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import type { WizardFormData, WizardItem, WizardVariant, ItemType } from '@/hooks/useOfferWizard';
import { computeTotalsForItems } from '@/hooks/useOfferWizard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BulkAddItems } from '@/components/offers/BulkAddItems';
import { SaveToPriceBookButton } from '@/components/offers/SaveToPriceBookButton';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';

const MAX_VARIANTS = 3;

interface Props {
  form: WizardFormData;
  onChange: (partial: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

function formatMoney(val: number, language?: string): string {
  return formatNumber(val, 2, language);
}

// ── Shared item editor ────────────────────────────────────────────────────────

interface ItemListProps {
  items: WizardItem[];
  onUpdate: (localId: string, patch: Partial<WizardItem>) => void;
  onRemove: (localId: string) => void;
}

function ItemList({ items, onUpdate, onRemove }: ItemListProps) {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.localId}
          className="rounded-lg border border-border p-3 space-y-2"
        >
          <div className="flex gap-2">
            <Input
              className="flex-1 text-sm"
              value={item.name}
              onChange={(e) => onUpdate(item.localId, { name: e.target.value })}
              placeholder={t('offerWizard.itemsStep.itemNamePlaceholder')}
              aria-label={t('offerWizard.itemsStep.itemName')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(item.localId)}
              aria-label={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">{t('offerWizard.itemsStep.qty')}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.qty}
                onChange={(e) => onUpdate(item.localId, { qty: Number(e.target.value) })}
                className="mt-0.5 h-8 text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{t('offerWizard.itemsStep.unitPrice')}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price_net}
                onChange={(e) => onUpdate(item.localId, { unit_price_net: Number(e.target.value) })}
                className="mt-0.5 h-8 text-sm"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{t('offerWizard.itemsStep.vatRate')}</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={item.vat_rate ?? ''}
                onChange={(e) => onUpdate(item.localId, {
                  vat_rate: e.target.value === '' ? null : Number(e.target.value),
                })}
                placeholder="0"
                className="mt-0.5 h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t('offerWizard.itemsStep.lineTotal')}: <strong>{formatMoney(item.qty * item.unit_price_net, i18n.language)} zł</strong>
            </p>
            <SaveToPriceBookButton
              name={item.name}
              unit={item.unit}
              price={item.unit_price_net}
              category={item.item_type === 'material' ? 'Materiał' : 'Robocizna'}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WizardStepItems({ form, onChange, errors }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [libSearch, setLibSearch] = useState('');
  const [activeVariantLocalId, setActiveVariantLocalId] = useState<string | null>(
    form.variants[0]?.localId ?? null,
  );

  // Keep active tab in sync when variants change
  const activeVariant = form.variants.find((v) => v.localId === activeVariantLocalId)
    ?? form.variants[0]
    ?? null;

  // Flat list of templates for search
  const { data: templates = [] } = useQuery({
    queryKey: [...itemTemplatesKeys.lists(), 'all-flat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_templates')
        .select('id, name, unit, default_qty, default_price, category')
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const filteredTemplates = templates.filter((tpl) =>
    tpl.name.toLowerCase().includes(libSearch.toLowerCase()),
  );

  // ── Variant helpers ───────────────────────────────────────────────────────

  const addVariant = () => {
    if (form.variants.length >= MAX_VARIANTS) return;
    const newId = crypto.randomUUID();
    const label = `${t('offerWizard.variants.defaultLabel')} ${form.variants.length + 1}`;
    const newVariant: WizardVariant = {
      localId: newId,
      dbId: null,
      label,
      items: [],
    };

    // If currently in no-variant mode and there are items, migrate them to first variant
    if (form.variants.length === 0 && form.items.length > 0) {
      const firstId = crypto.randomUUID();
      const firstVariant: WizardVariant = {
        localId: firstId,
        dbId: null,
        label: `${t('offerWizard.variants.defaultLabel')} 1`,
        items: form.items,
      };
      onChange({ variants: [firstVariant, newVariant], items: [] });
      setActiveVariantLocalId(newId);
    } else if (form.variants.length === 0) {
      const firstId = crypto.randomUUID();
      const firstVariant: WizardVariant = {
        localId: firstId,
        dbId: null,
        label: `${t('offerWizard.variants.defaultLabel')} 1`,
        items: [],
      };
      onChange({ variants: [firstVariant, newVariant], items: [] });
      setActiveVariantLocalId(newId);
    } else {
      onChange({ variants: [...form.variants, newVariant] });
      setActiveVariantLocalId(newId);
    }
  };

  const removeVariant = (localId: string) => {
    const next = form.variants.filter((v) => v.localId !== localId);
    if (next.length <= 1) {
      // If only one variant remains, revert to no-variant mode.
      // This keeps wizard/public behavior consistent: 1 option = no variant choice.
      const finalItems = next.flatMap((v) => v.items);
      onChange({ variants: [], items: finalItems });
      setActiveVariantLocalId(null);
    } else {
      onChange({ variants: next });
      if (activeVariantLocalId === localId) {
        setActiveVariantLocalId(next[0].localId);
      }
    }
  };

  const updateVariantLabel = (localId: string, label: string) => {
    onChange({
      variants: form.variants.map((v) =>
        v.localId === localId ? { ...v, label } : v,
      ),
    });
  };

  const updateVariantItems = (localId: string, items: WizardItem[]) => {
    onChange({
      variants: form.variants.map((v) =>
        v.localId === localId ? { ...v, items } : v,
      ),
    });
  };

  // ── No-variant item helpers ───────────────────────────────────────────────

  const addFromTemplate = (tpl: typeof templates[number]) => {
    const item: WizardItem = {
      localId: crypto.randomUUID(),
      dbId: null,
      name: tpl.name,
      unit: tpl.unit ?? '',
      qty: Number(tpl.default_qty) || 1,
      unit_price_net: Number(tpl.default_price) || 0,
      vat_rate: null,
      item_type: tpl.category === 'Materiał' ? 'material' : 'labor',
    };

    if (activeVariant) {
      updateVariantItems(activeVariant.localId, [...activeVariant.items, item]);
    } else {
      onChange({ items: [...form.items, item] });
    }
  };

  const addManual = () => {
    const item: WizardItem = {
      localId: crypto.randomUUID(),
      dbId: null,
      name: '',
      unit: t('offerWizard.itemsStep.defaultUnit'),
      qty: 1,
      unit_price_net: 0,
      vat_rate: null,
      item_type: 'labor' as ItemType,
    };

    if (activeVariant) {
      updateVariantItems(activeVariant.localId, [...activeVariant.items, item]);
    } else {
      onChange({ items: [...form.items, item] });
    }
  };

  const updateItem = (localId: string, patch: Partial<WizardItem>) => {
    if (activeVariant) {
      const updated = activeVariant.items.map((it) =>
        it.localId === localId ? { ...it, ...patch } : it,
      );
      updateVariantItems(activeVariant.localId, updated);
    } else {
      onChange({
        items: form.items.map((it) => (it.localId === localId ? { ...it, ...patch } : it)),
      });
    }
  };

  const removeItem = (localId: string) => {
    if (activeVariant) {
      updateVariantItems(
        activeVariant.localId,
        activeVariant.items.filter((it) => it.localId !== localId),
      );
    } else {
      onChange({ items: form.items.filter((it) => it.localId !== localId) });
    }
  };

  const handleBulkAdd = (newItems: WizardItem[]) => {
    if (activeVariant) {
      updateVariantItems(activeVariant.localId, [...activeVariant.items, ...newItems]);
    } else {
      onChange({ items: [...form.items, ...newItems] });
    }
  };

  const currentItems = activeVariant ? activeVariant.items : form.items;
  const totals = computeTotalsForItems(currentItems);

  return (
    <div className="space-y-4">

      {/* ── Variant tabs ──────────────────────────────────────────────────── */}
      {form.variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label={t('offerWizard.variants.tabsAriaLabel')}>
            {form.variants.map((v, idx) => (
              <div
                key={v.localId}
                className={cn(
                  'flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium cursor-pointer shrink-0 transition-colors',
                  v.localId === (activeVariant?.localId)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-accent',
                )}
                role="tab"
                aria-selected={v.localId === activeVariant?.localId}
                tabIndex={0}
                onClick={() => setActiveVariantLocalId(v.localId)}
                onKeyDown={(e) => e.key === 'Enter' && setActiveVariantLocalId(v.localId)}
              >
                <Layers className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <Input
                  className={cn(
                    'h-5 border-0 p-0 text-sm font-medium bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-24 min-w-0',
                    v.localId === activeVariant?.localId ? 'text-primary-foreground' : 'text-foreground',
                  )}
                  value={v.label}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateVariantLabel(v.localId, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  maxLength={50}
                  aria-label={`${t('offerWizard.variants.labelAriaLabel')} ${idx + 1}`}
                />
                {form.variants.length > 1 && (
                  <button
                    type="button"
                    className={cn(
                      'h-4 w-4 rounded-full flex items-center justify-center hover:opacity-80',
                      v.localId === activeVariant?.localId ? 'text-primary-foreground' : 'text-muted-foreground',
                    )}
                    onClick={(e) => { e.stopPropagation(); removeVariant(v.localId); }}
                    aria-label={t('offerWizard.variants.removeVariant')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            {form.variants.length < MAX_VARIANTS && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1 text-xs text-muted-foreground"
                onClick={addVariant}
                aria-label={t('offerWizard.variants.addVariant')}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('offerWizard.variants.addVariant')}
              </Button>
            )}
          </div>

          {/* Totals for active variant */}
          <p className="text-xs text-muted-foreground">
            {t('offerWizard.variants.editingLabel')}: <strong>{activeVariant?.label}</strong>
            {' · '}
            {currentItems.length} {t('offerWizard.variants.itemsCount')}
          </p>
        </div>
      )}

      {/* Add variant button when in no-variant mode */}
      {form.variants.length === 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={addVariant}
          >
            <Layers className="h-3.5 w-3.5" />
            {t('offerWizard.variants.addFirstVariant')}
          </Button>
        </div>
      )}

      {/* ── Price Library ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium mb-2">{t('offerWizard.itemsStep.libraryTitle')}</p>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder={t('offerWizard.itemsStep.libSearch')}
            value={libSearch}
            onChange={(e) => setLibSearch(e.target.value)}
          />
        </div>
        <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border border-border p-1">
          {filteredTemplates.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground text-center">
              {t('offerWizard.itemsStep.noTemplates')}
            </p>
          )}
          {filteredTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => addFromTemplate(tpl)}
              className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
              data-testid="library-template-row"
            >
              <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="flex-1 truncate">{tpl.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatMoney(Number(tpl.default_price), i18n.language)} / {tpl.unit}
              </span>
              <span
                className="text-[10px] rounded-full px-1.5 py-0.5 bg-primary/10 text-primary shrink-0"
                data-testid="library-source-label"
              >
                {t('priceBook.sourcePriceBook')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Item list ─────────────────────────────────────────────────────── */}
      {currentItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('offerWizard.itemsStep.addedItems')}</p>
          <ItemList items={currentItems} onUpdate={updateItem} onRemove={removeItem} />
        </div>
      )}

      {errors.items && (
        <p className="text-sm text-destructive">{errors.items}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={addManual} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('offerWizard.itemsStep.addManual')}
        </Button>
        <BulkAddItems onAdd={handleBulkAdd} />
      </div>

      {/* ── Live totals ────────────────────────────────────────────────────── */}
      {currentItems.length > 0 && (
        <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
          {form.variants.length > 0 && (
            <p className="text-xs text-muted-foreground mb-1">
              {activeVariant?.label}
            </p>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('common.net')}</span>
            <span className="font-medium">{formatMoney(totals.total_net, i18n.language)} zł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{formatMoney(totals.total_vat, i18n.language)} zł</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>{t('common.gross')}</span>
            <span>{formatMoney(totals.total_gross, i18n.language)} zł</span>
          </div>
        </div>
      )}
    </div>
  );
}
