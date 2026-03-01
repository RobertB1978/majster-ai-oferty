import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  FileText,
  Mic,
  Users,
  DollarSign,
  FolderOpen,
  CalendarPlus,
  Bell,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FabAction {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
  placeholder?: boolean;
}

const FAB_ACTIONS: FabAction[] = [
  { id: 'new-offer',    labelKey: 'newShell.fab.newOffer',    icon: FileText,    route: '/app/quick-est' },
  { id: 'voice-note',   labelKey: 'newShell.fab.voiceNote',   icon: Mic,         placeholder: true },
  { id: 'add-client',   labelKey: 'newShell.fab.addClient',   icon: Users,       route: '/app/customers' },
  { id: 'add-cost',     labelKey: 'newShell.fab.addCost',     icon: DollarSign,  route: '/app/finance' },
  { id: 'add-document', labelKey: 'newShell.fab.addDocument', icon: FolderOpen,  placeholder: true },
  { id: 'add-date',     labelKey: 'newShell.fab.addDate',     icon: CalendarPlus, route: '/app/calendar' },
  { id: 'reminder',     labelKey: 'newShell.fab.reminder',    icon: Bell,        placeholder: true },
];

/**
 * NewShellFAB — Floating Action Button z bottom sheet akcji.
 *
 * - FAB jest absolutnie pozycjonowany nad dolną nawigacją (slot środkowy)
 * - Kliknięcie otwiera bottom sheet z listą akcji
 * - Akcje z `placeholder: true` wyświetlają toast "Wkrótce"
 * - Akcje z `route` nawigują do odpowiedniej strony
 */
export function NewShellFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  function handleAction(action: FabAction) {
    setIsOpen(false);
    if (action.placeholder) {
      // Brak toasta tutaj — komunikat wyświetlany inline w bottom sheet
      return;
    }
    if (action.route) {
      navigate(action.route);
    }
  }

  return (
    <>
      {/* Overlay — zamyka bottom sheet po kliknięciu poza */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: 55 }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet z akcjami */}
      {isOpen && (
        <div
          className="fixed bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-xl animate-slide-up"
          style={{ zIndex: 60 }}
          role="dialog"
          aria-modal="true"
          aria-label={t('newShell.fab.sheetTitle', 'Szybkie akcje')}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {t('newShell.fab.sheetTitle', 'Szybkie akcje')}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                aria-label={t('common.close', 'Zamknij')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FAB_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl text-left transition-colors',
                    action.placeholder
                      ? 'bg-secondary/40 text-muted-foreground cursor-default'
                      : 'bg-secondary/70 text-foreground hover:bg-secondary active:bg-secondary/90'
                  )}
                >
                  <action.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium leading-tight">
                    {t(action.labelKey)}
                    {action.placeholder && (
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        {t('nav.comingSoon', 'Wkrótce')}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Bezpieczna strefa dolna */}
          <div className="h-safe-area-bottom" />
        </div>
      )}

      {/* FAB Button — środek dolnej nawigacji */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2',
          'h-14 w-14 rounded-full',
          'bg-primary text-primary-foreground',
          'shadow-lg shadow-primary/30',
          'flex items-center justify-center',
          'transition-all duration-200',
          isOpen ? 'rotate-45 scale-95' : 'rotate-0 scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        style={{ zIndex: 61 }}
        aria-label={isOpen ? t('common.close', 'Zamknij') : t('newShell.fab.open', 'Utwórz')}
        aria-expanded={isOpen}
      >
        <Plus className="h-6 w-6" />
      </button>
    </>
  );
}
