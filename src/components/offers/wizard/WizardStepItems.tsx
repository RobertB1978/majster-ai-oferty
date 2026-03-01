/**
 * WizardStepItems — PR-10 Step 2
 * Add line items from Price Library (item_templates) or manually.
 * Live totals update as user edits.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Search } from 'lucide-react';
import { itemTemplatesKeys } from '@/hooks/useItemTemplates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import type { WizardFormData, WizardItem, ItemType } from '@/hooks/useOfferWizard';
import { computeTotals } from '@/hooks/useOfferWizard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BulkAddItems } from '@/components/offers/BulkAddItems';

interface Props {
  form: WizardFormData;
  onChange: (partial: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

function formatMoney(val: number): string {
  return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

export function WizardStepItems({ form, onChange, errors }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [libSearch, setLibSearch] = useState('');

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

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(libSearch.toLowerCase())
  );

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
    onChange({ items: [...form.items, item] });
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
    onChange({ items: [...form.items, item] });
  };

  const updateItem = (localId: string, patch: Partial<WizardItem>) => {
    onChange({
      items: form.items.map((it) => (it.localId === localId ? { ...it, ...patch } : it)),
    });
  };

  const removeItem = (localId: string) => {
    onChange({ items: form.items.filter((it) => it.localId !== localId) });
  };

  const totals = computeTotals(form.items);

  return (
    <div className="space-y-4">
      {/* Price Library */}
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
            >
              <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="flex-1 truncate">{tpl.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatMoney(Number(tpl.default_price))} / {tpl.unit}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      {form.items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('offerWizard.itemsStep.addedItems')}</p>
          {form.items.map((item) => (
            <div
              key={item.localId}
              className="rounded-lg border border-border p-3 space-y-2"
            >
              <div className="flex gap-2">
                <Input
                  className="flex-1 text-sm"
                  value={item.name}
                  onChange={(e) => updateItem(item.localId, { name: e.target.value })}
                  placeholder={t('offerWizard.itemsStep.itemNamePlaceholder')}
                  aria-label={t('offerWizard.itemsStep.itemName')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(item.localId)}
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
                    onChange={(e) => updateItem(item.localId, { qty: Number(e.target.value) })}
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
                    onChange={(e) => updateItem(item.localId, { unit_price_net: Number(e.target.value) })}
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
                    onChange={(e) => updateItem(item.localId, {
                      vat_rate: e.target.value === '' ? null : Number(e.target.value),
                    })}
                    placeholder="0"
                    className="mt-0.5 h-8 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-right text-muted-foreground">
                {t('offerWizard.itemsStep.lineTotal')}: <strong>{formatMoney(item.qty * item.unit_price_net)} zł</strong>
              </p>
            </div>
          ))}
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
        {/* PR-12: Bulk add items from paste or CSV */}
        <BulkAddItems onAdd={(newItems) => onChange({ items: [...form.items, ...newItems] })} />
      </div>

      {/* Live totals */}
      {form.items.length > 0 && (
        <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('common.net')}</span>
            <span className="font-medium">{formatMoney(totals.total_net)} zł</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{formatMoney(totals.total_vat)} zł</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>{t('common.gross')}</span>
            <span>{formatMoney(totals.total_gross)} zł</span>
          </div>
        </div>
      )}
    </div>
  );
}
