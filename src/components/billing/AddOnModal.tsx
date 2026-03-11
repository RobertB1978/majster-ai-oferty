import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Note: 'purchased' state removed — add-on checkout via Stripe is not yet available
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderOpen, Users, FileText, Info, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AddOnKey | null>(limitToKey(limitType));

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

            return (
              <button
                key={addon.key}
                type="button"
                onClick={() => setSelected(addon.key)}
                className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{addon.labelPl}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {t('addons.comingSoonBadge', 'Wkrótce')}
                    </Badge>
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

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
            {t(
              'addons.comingSoon',
              'Zakup pojedynczych dodatków przez Stripe będzie dostępny wkrótce. Aby teraz zwiększyć limity, przejdź na wyższy plan.'
            )}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between pt-1">
          <div>
            {selectedAddon && (
              <p className="text-sm text-muted-foreground">
                {t('addons.selected', 'Wybrany')}: <span className="font-medium text-foreground">{selectedAddon.labelPl}</span>
                {' — '}
                <span className="font-bold">{selectedAddon.price} zł</span>
                <span className="text-xs ml-1 text-muted-foreground">
                  ({t('addons.priceSoon', 'cena orientacyjna')})
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('addons.vatNote', 'Cena netto + 23% VAT.')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel', 'Anuluj')}
            </Button>
            <Button onClick={() => { onClose(); navigate('/app/plan'); }} className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              {t('addons.seePlans', 'Zobacz plany')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
