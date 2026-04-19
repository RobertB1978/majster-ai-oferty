/**
 * WizardStepClient — PR-10 Step 1 (extended in PR-COMM-03)
 * Select an existing client or create a minimal client inline.
 * PR-COMM-03: added NIP, street, postal_code, city to the quick-create form.
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

function validateNip(nip: string): boolean {
  const digits = nip.replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(digits)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  return sum % 11 === Number(digits[9]);
}

const EMPTY_NEW_CLIENT = {
  name: '',
  phone: '',
  email: '',
  nip: '',
  street: '',
  postal_code: '',
  city: '',
};

export function WizardStepClient({ form, onChange, errors }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nipError, setNipError] = useState('');

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
    onChange({ clientId: null, newClient: { ...EMPTY_NEW_CLIENT } });
    setIsCreating(true);
    setNipError('');
  };

  const handleCancelCreate = () => {
    onChange({ newClient: null });
    setIsCreating(false);
    setNipError('');
  };

  const handleNewClientChange = (
    field: keyof typeof EMPTY_NEW_CLIENT,
    value: string,
  ) => {
    const base = form.newClient ?? { ...EMPTY_NEW_CLIENT };
    onChange({ newClient: { ...base, [field]: value } });

    if (field === 'nip') {
      const trimmed = value.replace(/[\s-]/g, '');
      if (trimmed && !validateNip(value)) {
        setNipError(t('offerWizard.clientStep.nipInvalid'));
      } else {
        setNipError('');
      }
    }
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
            <p className="text-sm text-success">
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

          {/* Name */}
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

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-phone">{t('offerWizard.clientStep.phone')}</Label>
              <Input
                id="nc-phone"
                type="tel"
                value={form.newClient?.phone ?? ''}
                onChange={(e) => handleNewClientChange('phone', e.target.value)}
                placeholder={t('offerWizard.clientStep.phonePlaceholder')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-email">{t('offerWizard.clientStep.email')}</Label>
              <Input
                id="nc-email"
                type="email"
                value={form.newClient?.email ?? ''}
                onChange={(e) => handleNewClientChange('email', e.target.value)}
                placeholder={t('offerWizard.clientStep.emailPlaceholder')}
              />
            </div>
          </div>

          {/* NIP */}
          <div className="space-y-1">
            <Label htmlFor="nc-nip">{t('offerWizard.clientStep.nip')}</Label>
            <Input
              id="nc-nip"
              value={form.newClient?.nip ?? ''}
              onChange={(e) => handleNewClientChange('nip', e.target.value)}
              placeholder={t('offerWizard.clientStep.nipPlaceholder')}
              maxLength={13}
            />
            {nipError && (
              <p className="text-xs text-destructive">{nipError}</p>
            )}
          </div>

          {/* Street */}
          <div className="space-y-1">
            <Label htmlFor="nc-street">{t('offerWizard.clientStep.street')}</Label>
            <Input
              id="nc-street"
              value={form.newClient?.street ?? ''}
              onChange={(e) => handleNewClientChange('street', e.target.value)}
              placeholder={t('offerWizard.clientStep.streetPlaceholder')}
            />
          </div>

          {/* Postal code + City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-postal">{t('offerWizard.clientStep.postalCode')}</Label>
              <Input
                id="nc-postal"
                value={form.newClient?.postal_code ?? ''}
                onChange={(e) => handleNewClientChange('postal_code', e.target.value)}
                placeholder={t('offerWizard.clientStep.postalCodePlaceholder')}
                maxLength={6}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-city">{t('offerWizard.clientStep.city')}</Label>
              <Input
                id="nc-city"
                value={form.newClient?.city ?? ''}
                onChange={(e) => handleNewClientChange('city', e.target.value)}
                placeholder={t('offerWizard.clientStep.cityPlaceholder')}
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
