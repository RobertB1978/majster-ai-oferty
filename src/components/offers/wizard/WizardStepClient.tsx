/**
 * WizardStepClient — PR-10 Step 1
 * Select an existing client or create a minimal client inline.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, PlusCircle, Check } from 'lucide-react';

import { useClients } from '@/hooks/useClients';
import type { Client } from '@/hooks/useClients';
import type { WizardFormData } from '@/hooks/useOfferWizard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  form: WizardFormData;
  onChange: (partial: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

export function WizardStepClient({ form, onChange, errors }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: allClients = [] } = useClients();

  const filtered: Client[] = allClients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  );

  const handleSelectClient = (client: Client) => {
    onChange({ clientId: client.id, newClient: null });
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    onChange({ clientId: null, newClient: { name: '', phone: '', email: '' } });
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    onChange({ newClient: null });
    setIsCreating(false);
  };

  const handleNewClientChange = (field: 'name' | 'phone' | 'email', value: string) => {
    onChange({ newClient: { ...(form.newClient ?? { name: '', phone: '', email: '' }), [field]: value } });
  };

  const selectedClient = allClients.find((c) => c.id === form.clientId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('offerWizard.clientStep.hint')}</p>

      {!isCreating && (
        <>
          {/* Search existing */}
          <Input
            placeholder={t('offerWizard.clientStep.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('offerWizard.clientStep.searchPlaceholder')}
          />

          {/* Clients list */}
          <div className="max-h-56 overflow-y-auto space-y-1 rounded-md border border-border p-1">
            {filtered.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground text-center">
                {t('offerWizard.clientStep.noClients')}
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectClient(c)}
                className={cn(
                  'w-full flex items-center gap-3 rounded px-3 py-2 text-left text-sm transition-colors',
                  form.clientId === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate font-medium">{c.name}</span>
                {c.phone && <span className="text-xs opacity-70">{c.phone}</span>}
                {form.clientId === c.id && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>

          {selectedClient && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {t('offerWizard.clientStep.selected', { name: selectedClient.name })}
            </p>
          )}
          {errors.client && (
            <p className="text-sm text-destructive">{errors.client}</p>
          )}

          <Button type="button" variant="outline" size="sm" onClick={handleStartCreate} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {t('offerWizard.clientStep.createNew')}
          </Button>
        </>
      )}

      {isCreating && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-medium">{t('offerWizard.clientStep.newClientTitle')}</p>

          <div className="space-y-1">
            <Label htmlFor="nc-name">{t('offerWizard.clientStep.name')}</Label>
            <Input
              id="nc-name"
              value={form.newClient?.name ?? ''}
              onChange={(e) => handleNewClientChange('name', e.target.value)}
              placeholder={t('offerWizard.clientStep.namePlaceholder')}
              aria-required="true"
            />
            {errors.newClientName && (
              <p className="text-xs text-destructive">{errors.newClientName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-phone">{t('offerWizard.clientStep.phone')}</Label>
              <Input
                id="nc-phone"
                type="tel"
                value={form.newClient?.phone ?? ''}
                onChange={(e) => handleNewClientChange('phone', e.target.value)}
                placeholder="+48 500 000 000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-email">{t('offerWizard.clientStep.email')}</Label>
              <Input
                id="nc-email"
                type="email"
                value={form.newClient?.email ?? ''}
                onChange={(e) => handleNewClientChange('email', e.target.value)}
                placeholder="jan@example.pl"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancelCreate}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
