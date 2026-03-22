import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  FileText,
  Users,
  DollarSign,
  CalendarPlus,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FabAction {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

const FAB_ACTIONS: FabAction[] = [
  { id: 'quick-mode', labelKey: 'newShell.fab.quickMode', icon: Zap,         route: '/app/quick' },
  { id: 'new-offer',  labelKey: 'newShell.fab.newOffer',  icon: FileText,    route: '/app/offers/new' },
  { id: 'add-client', labelKey: 'newShell.fab.addClient', icon: Users,       route: '/app/customers' },
  { id: 'add-cost',   labelKey: 'newShell.fab.addCost',   icon: DollarSign,  route: '/app/finance' },
  { id: 'add-date',   labelKey: 'newShell.fab.addDate',   icon: CalendarPlus, route: '/app/calendar' },
];

/**
 * NewShellFAB — Floating Action Button z bottom sheet akcji.
 *
 * - FAB jest absolutnie pozycjonowany nad dolną nawigacją (slot środkowy)
 * - Kliknięcie otwiera bottom sheet z listą działających akcji
 * - Każda akcja nawiguje do odpowiedniej strony aplikacji
 */
export function NewShellFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  function handleAction(action: FabAction) {
    setIsOpen(false);
    navigate(action.route);
  }

  return (
    // lg:hidden — na desktop FAB jest zastąpiony przez przycisk "Utwórz" w topbarze
    <div className="lg:hidden">
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
          className="fixed left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-xl animate-slide-up"
          style={{ zIndex: 60, bottom: 'calc(var(--nav-height, 4rem) + env(safe-area-inset-bottom, 0px))' }}
          role="dialog"
          aria-modal="true"
          aria-label={t('newShell.fab.sheetTitle')}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {t('newShell.fab.sheetTitle')}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                aria-label={t('common.close')}
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
                    'bg-secondary/70 text-foreground hover:bg-secondary active:bg-secondary/90'
                  )}
                >
                  <action.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium leading-tight">
                    {t(action.labelKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Bezpieczna strefa dolna */}
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} aria-hidden="true" />
        </div>
      )}

      {/* FAB Button — środek dolnej nawigacji */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed left-1/2 -translate-x-1/2',
          'h-14 w-14 rounded-full',
          'bg-primary text-primary-foreground',
          'shadow-lg shadow-primary/30',
          'flex items-center justify-center',
          'transition-all duration-200',
          isOpen ? 'rotate-45 scale-95' : 'rotate-0 scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        style={{ zIndex: 61, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        aria-label={isOpen ? t('common.close') : t('newShell.fab.open')}
        aria-expanded={isOpen}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
