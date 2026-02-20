import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FolderOpen, Users, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type AddOnKey = 'extra_projects_10' | 'extra_clients_20' | 'extra_pdf_50';

interface AddOn {
  key: AddOnKey;
  icon: React.ElementType;
  labelPl: string;
  descriptionPl: string;
  price: number; // PLN netto
  unit: string;
}

const ADD_ONS: AddOn[] = [
  {
    key: 'extra_projects_10',
    icon: FolderOpen,
    labelPl: '+10 projektów',
    descriptionPl: 'Dodatkowe 10 slotów projektowych do Twojego aktualnego limitu.',
    price: 19,
    unit: 'jednorazowo',
  },
  {
    key: 'extra_clients_20',
    icon: Users,
    labelPl: '+20 klientów',
    descriptionPl: 'Dodatkowe 20 klientów w książce adresowej.',
    price: 14,
    unit: 'jednorazowo',
  },
  {
    key: 'extra_pdf_50',
    icon: FileText,
    labelPl: '+50 eksportów PDF',
    descriptionPl: '50 dodatkowych eksportów do PDF (oferty, faktury, raporty).',
    price: 9,
    unit: 'jednorazowo',
  },
];

interface AddOnModalProps {
  open: boolean;
  onClose: () => void;
  /** Which limit was hit — pre-selects the matching add-on */
  limitType?: 'projects' | 'clients' | 'pdf';
}

function limitToKey(lt?: AddOnModalProps['limitType']): AddOnKey | null {
  if (lt === 'projects') return 'extra_projects_10';
  if (lt === 'clients') return 'extra_clients_20';
  if (lt === 'pdf') return 'extra_pdf_50';
  return null;
}

export function AddOnModal({ open, onClose, limitType }: AddOnModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selected, setSelected] = useState<AddOnKey | null>(limitToKey(limitType));
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState<AddOnKey[]>([]);

  const handleBuy = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('user_addons').upsert(
        {
          addon_key: selected,
          quantity: 1,
        },
        { onConflict: 'user_id,addon_key', ignoreDuplicates: false }
      );
      if (error) throw error;
      setPurchased((prev) => [...prev, selected]);
      toast({
        title: t('addons.purchaseSuccess', 'Zakupiono dodatek'),
        description: ADD_ONS.find((a) => a.key === selected)?.labelPl,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('addons.purchaseError', 'Błąd zakupu'),
        description: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAddon = ADD_ONS.find((a) => a.key === selected);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('addons.title', 'Dokup więcej zasobów')}</DialogTitle>
          <DialogDescription>
            {t(
              'addons.subtitle',
              'Osiągnięto limit Twojego planu. Wybierz dodatek, aby go rozszerzyć.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2">
          {ADD_ONS.map((addon) => {
            const Icon = addon.icon;
            const isSelected = selected === addon.key;
            const isPurchased = purchased.includes(addon.key);

            return (
              <button
                key={addon.key}
                type="button"
                onClick={() => !isPurchased && setSelected(addon.key)}
                className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isPurchased
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30 opacity-80 cursor-default'
                    : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPurchased ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{addon.labelPl}</span>
                    {isPurchased && (
                      <Badge variant="outline" className="text-green-700 border-green-400 text-xs">
                        {t('addons.purchased', 'Zakupiono')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{addon.descriptionPl}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-base">{addon.price} zł</span>
                  <p className="text-xs text-muted-foreground">{addon.unit}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-1">
          <div>
            {selectedAddon && (
              <p className="text-sm text-muted-foreground">
                {t('addons.selected', 'Wybrany')}: <span className="font-medium text-foreground">{selectedAddon.labelPl}</span>
                {' — '}
                <span className="font-bold">{selectedAddon.price} zł</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('addons.vatNote', 'Cena netto + 23% VAT. Płatność przez Stripe.')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'Anuluj')}
            </Button>
            <Button onClick={handleBuy} disabled={!selected || loading || purchased.includes(selected ?? '' as AddOnKey)}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('addons.buy', 'Kup teraz')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
